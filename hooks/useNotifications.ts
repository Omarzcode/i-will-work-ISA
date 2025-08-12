"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./useAuth"

export interface Notification {
  id?: string
  title: string
  message: string
  type: "new_request" | "status_update" | "success" | "warning" | "error" | "system"
  timestamp: any
  read: boolean
  requestId?: string
  branchCode?: string
  isForManager: boolean
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    let notificationsQuery

    if (user.isManager) {
      // Managers see notifications for new requests and general notifications
      notificationsQuery = query(
        collection(db, "notifications"),
        where("isForManager", "==", true),
        orderBy("timestamp", "desc"),
      )
    } else {
      // Branch users see notifications for their branch
      notificationsQuery = query(
        collection(db, "notifications"),
        where("branchCode", "==", user.branchCode),
        where("isForManager", "==", false),
        orderBy("timestamp", "desc"),
      )
    }

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[]

      // Show browser notification for new unread notifications
      const previousNotifications = notifications
      const newNotifications = notificationsData.filter(
        (newNotif) => !newNotif.read && !previousNotifications.some((prevNotif) => prevNotif.id === newNotif.id),
      )

      // Show browser notifications for new notifications
      newNotifications.forEach((notification) => {
        showBrowserNotification(notification)
      })

      setNotifications(notificationsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user]) // Removed notifications.length from dependency

  const showBrowserNotification = (notification: Notification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          tag: notification.id,
          badge: "/favicon.ico",
          requireInteraction: false,
          silent: false,
        })

        // Auto close after 5 seconds
        setTimeout(() => {
          browserNotification.close()
        }, 5000)

        // Handle click
        browserNotification.onclick = () => {
          window.focus()
          browserNotification.close()
          // Mark as read when clicked
          if (notification.id) {
            markAsRead(notification.id)
          }
        }
      } catch (error) {
        console.log("Browser notification failed:", error)
      }
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)
      const promises = unreadNotifications.map((notification) =>
        updateDoc(doc(db, "notifications", notification.id!), { read: true }),
      )
      await Promise.all(promises)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
