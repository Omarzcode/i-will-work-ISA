"use client"

import { useEffect, useState, useCallback } from "react"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./useAuth"
import { useToast } from "./use-toast"
import type { Notification } from "@/lib/types"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [previousNotificationIds, setPreviousNotificationIds] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const { toast } = useToast()

  // Show toast for new notifications
  const showNotificationToast = useCallback(
    (notification: Notification) => {
      // Don't show toast on initial load
      if (previousNotificationIds.size === 0) return

      const getToastTitle = (type: string) => {
        switch (type) {
          case "new_request":
            return "New Request"
          case "status_update":
            return "Status Update"
          case "success":
            return "Success"
          case "warning":
            return "Warning"
          case "error":
            return "Error"
          case "system":
            return "System"
          default:
            return "Notification"
        }
      }

      toast({
        title: getToastTitle(notification.type),
        description: notification.message,
        duration: 5000,
      })

      // Browser notification if permission granted
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(getToastTitle(notification.type), {
          body: notification.message,
          icon: "/favicon.ico",
          tag: notification.id,
        })
      }
    },
    [previousNotificationIds.size, toast],
  )

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    try {
      const notificationsRef = collection(db, "notifications")
      let q

      if (user.isManager) {
        // Managers see all notifications
        q = query(notificationsRef, where("isForManager", "==", true), orderBy("timestamp", "desc"))
      } else {
        // Regular users see notifications for their branch
        q = query(
          notificationsRef,
          where("branchCode", "==", user.branchCode),
          where("isForManager", "==", false),
          orderBy("timestamp", "desc"),
        )
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notificationsList: Notification[] = []
          const currentIds = new Set<string>()

          snapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data()
            const notification: Notification = {
              id: docSnapshot.id,
              title: data.title,
              message: data.message,
              type: data.type,
              timestamp: data.timestamp,
              read: data.read || false,
              requestId: data.requestId,
              branchCode: data.branchCode,
              isForManager: data.isForManager,
              recipientId: data.recipientId,
            }
            notificationsList.push(notification)
            currentIds.add(docSnapshot.id)
          })

          // Check for new notifications
          if (previousNotificationIds.size > 0) {
            notificationsList.forEach((notification) => {
              if (!previousNotificationIds.has(notification.id) && !notification.read) {
                showNotificationToast(notification)
              }
            })
          }

          setNotifications(notificationsList)
          setPreviousNotificationIds(currentIds)
          setLoading(false)
        },
        (error) => {
          console.error("Error fetching notifications:", error)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Error setting up notifications listener:", error)
      setLoading(false)
    }
  }, [user, showNotificationToast])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, { read: true })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
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
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}
