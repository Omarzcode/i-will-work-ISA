"use client"

import { useState, useEffect, useCallback } from "react"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import type { Notification } from "@/lib/types"

export function useNotifications() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    console.log("Setting up notifications listener for user:", user.email, "isManager:", user.isManager)

    let q
    if (user.isManager) {
      // Managers see notifications meant for managers (new requests from all branches)
      q = query(collection(db, "notifications"), where("isForManager", "==", true), orderBy("timestamp", "desc"))
    } else {
      // Branch users see notifications for their branch (status updates)
      q = query(
        collection(db, "notifications"),
        where("branchCode", "==", user.branchCode),
        where("isForManager", "==", false),
        orderBy("timestamp", "desc"),
      )
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Notifications snapshot received, docs count:", snapshot.docs.length)

        const notificationsList: Notification[] = []
        const previousNotificationIds = new Set(notifications.map((n) => n.id))

        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          const notification: Notification = {
            id: docSnapshot.id,
            title: data.title || "",
            message: data.message || "",
            type: data.type || "system",
            timestamp: data.timestamp,
            read: data.read || false,
            requestId: data.requestId || "",
            branchCode: data.branchCode || "",
            isForManager: data.isForManager || false,
          }
          notificationsList.push(notification)

          // Show toast for new notifications (not on initial load)
          if (!previousNotificationIds.has(notification.id) && !notification.read && notifications.length > 0) {
            console.log("Showing toast for new notification:", notification.title)
            toast({
              title: notification.title,
              description: notification.message,
            })
          }
        })

        console.log("Processed notifications:", notificationsList.length)
        setNotifications(notificationsList)
        setUnreadCount(notificationsList.filter((n) => !n.read).length)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, toast, notifications.length])

  const createNotification = useCallback(async (notificationData: Omit<Notification, "id" | "timestamp">) => {
    try {
      console.log("Creating notification:", notificationData)

      await addDoc(collection(db, "notifications"), {
        ...notificationData,
        timestamp: serverTimestamp(),
      })

      console.log("Notification created successfully")
    } catch (error) {
      console.error("Error creating notification:", error)
      throw error
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      })
      console.log("Notification marked as read:", notificationId)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)
      const promises = unreadNotifications.map((notification) =>
        updateDoc(doc(db, "notifications", notification.id!), { read: true }),
      )
      await Promise.all(promises)
      console.log("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, [notifications])

  return {
    notifications,
    unreadCount,
    loading,
    createNotification,
    markAsRead,
    markAllAsRead,
  }
}
