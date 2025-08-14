"use client"

import { useState, useEffect, useCallback } from "react"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./useAuth"
import { useToast } from "./use-toast"
import type { Notification } from "@/lib/types"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  // Track previous notification count to detect new ones
  const [previousNotificationIds, setPreviousNotificationIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setIsLoading(false)
      setPreviousNotificationIds(new Set())
      return
    }

    const notificationsRef = collection(db, "notifications")
    let notificationQuery

    if (user.isManager) {
      // Managers see notifications marked for managers
      notificationQuery = query(notificationsRef, where("isForManager", "==", true), orderBy("timestamp", "desc"))
    } else {
      // Branch users see notifications for their branch
      notificationQuery = query(
        notificationsRef,
        where("branchCode", "==", user.branchCode),
        where("isForManager", "==", false),
        orderBy("timestamp", "desc"),
      )
    }

    const unsubscribe = onSnapshot(notificationQuery, (snapshot) => {
      const notificationsList: Notification[] = []
      let unreadCounter = 0
      const currentNotificationIds = new Set<string>()

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        const notification: Notification = {
          id: docSnapshot.id,
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
        currentNotificationIds.add(docSnapshot.id)

        if (!notification.read) {
          unreadCounter++
        }
      })

      // Check for new notifications (only show toast for truly new ones)
      const newNotifications = notificationsList.filter(
        (notification) =>
          !previousNotificationIds.has(notification.id) && !notification.read && previousNotificationIds.size > 0, // Don't show toasts on initial load
      )

      // Show toast for new notifications
      newNotifications.forEach((notification) => {
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        })
      })

      setNotifications(notificationsList.slice(0, 50)) // Limit to 50 notifications
      setUnreadCount(unreadCounter)
      setPreviousNotificationIds(currentNotificationIds)
      setIsLoading(false)

      // Show browser notification for new unread notifications
      if (newNotifications.length > 0 && "Notification" in window && Notification.permission === "granted") {
        const latestNotification = newNotifications[0]
        const browserNotification = new Notification(latestNotification.title, {
          body: latestNotification.message,
          icon: "/maintenance-logo.png",
          tag: latestNotification.id,
        })

        browserNotification.onclick = () => {
          window.focus()
          browserNotification.close()
        }

        setTimeout(() => {
          browserNotification.close()
        }, 5000)
      }
    })

    return () => unsubscribe()
  }, [user, toast, previousNotificationIds.size])

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
      const unreadNotifications = notifications.filter((notification) => !notification.read)

      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.update(notificationRef, { read: true })
      })

      await batch.commit()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, [notifications])

  const createNotification = useCallback(async (notificationData: Omit<Notification, "id" | "timestamp">) => {
    try {
      await addDoc(collection(db, "notifications"), {
        ...notificationData,
        timestamp: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error creating notification:", error)
      throw error
    }
  }, [])

  const requestNotificationPermission = useCallback(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    createNotification,
    requestNotificationPermission,
  }
}
