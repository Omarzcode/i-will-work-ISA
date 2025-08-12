"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./useAuth"
import type { Notification } from "@/lib/types"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const notificationsRef = collection(db, "notifications")
    let q

    if (user.isManager) {
      // Managers see notifications marked for managers
      q = query(notificationsRef, where("isForManager", "==", true), orderBy("timestamp", "desc"))
    } else {
      // Branch users see notifications for their branch
      q = query(
        notificationsRef,
        where("branchCode", "==", user.branchCode),
        where("isForManager", "==", false),
        orderBy("timestamp", "desc"),
      )
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = []
      let unreadCounter = 0

      snapshot.forEach((doc) => {
        const data = doc.data()
        const notification: Notification = {
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          read: data.read || false,
          timestamp: data.timestamp,
          requestId: data.requestId,
          branchCode: data.branchCode,
          isForManager: data.isForManager,
          recipientId: data.recipientId,
        }

        notificationsList.push(notification)
        if (!notification.read) {
          unreadCounter++
        }
      })

      setNotifications(notificationsList.slice(0, 50)) // Limit to 50 notifications
      setUnreadCount(unreadCounter)

      // Show browser notification for new unread notifications
      if (unreadCounter > 0 && "Notification" in window && Notification.permission === "granted") {
        const latestUnread = notificationsList.find((n) => !n.read)
        if (latestUnread) {
          const browserNotification = new Notification(latestUnread.title, {
            body: latestUnread.message,
            icon: "/maintenance-logo.png",
            tag: latestUnread.id,
          })

          browserNotification.onclick = () => {
            window.focus()
            browserNotification.close()
          }

          setTimeout(() => {
            browserNotification.close()
          }, 5000)
        }
      }
    })

    return () => unsubscribe()
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, { read: true })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db)
      const unreadNotifications = notifications.filter((n) => !n.read)

      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.update(notificationRef, { read: true })
      })

      await batch.commit()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}
