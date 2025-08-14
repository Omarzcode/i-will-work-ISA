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
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./useAuth"
import { useToast } from "./use-toast"
import type { Notification } from "@/lib/types"

export function useNotifications() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [previousNotificationIds, setPreviousNotificationIds] = useState<Set<string>>(new Set())

  // Fetch notifications based on user role
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    console.log("Setting up notifications listener for user:", user.email, "isManager:", user.isManager)

    let q
    if (user.isManager) {
      // Managers see notifications meant for managers (new requests from all branches)
      q = query(collection(db, "notifications"), where("isForManager", "==", true), orderBy("timestamp", "desc"))
      console.log("Manager query: notifications where isForManager == true")
    } else {
      // Branch users see notifications for their branch (status updates)
      q = query(
        collection(db, "notifications"),
        where("branchCode", "==", user.branchCode),
        where("isForManager", "==", false),
        orderBy("timestamp", "desc"),
      )
      console.log("Branch user query: notifications for branch", user.branchCode, "where isForManager == false")
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Notifications snapshot received, docs count:", snapshot.docs.length)

        const notificationsList: Notification[] = []
        const currentNotificationIds = new Set<string>()

        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          const notification: Notification = {
            id: docSnapshot.id,
            title: data.title || "",
            message: data.message || "",
            type: data.type || "info",
            read: data.read || false,
            timestamp: data.timestamp,
            branchCode: data.branchCode || "",
            requestId: data.requestId || "",
            isForManager: data.isForManager || false,
          }
          notificationsList.push(notification)
          currentNotificationIds.add(docSnapshot.id)
        })

        console.log("Processed notifications:", notificationsList.length)

        // Show toast for new notifications (only after initial load)
        if (previousNotificationIds.size > 0) {
          const newNotifications = notificationsList.filter(
            (notification) => !previousNotificationIds.has(notification.id) && !notification.read,
          )

          newNotifications.forEach((notification) => {
            console.log("Showing toast for new notification:", notification.title)
            toast({
              title: notification.title,
              description: notification.message,
            })
          })
        }

        setNotifications(notificationsList)
        setPreviousNotificationIds(currentNotificationIds)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, toast, previousNotificationIds.size])

  // Create a new notification
  const createNotification = useCallback(async (notificationData: Omit<Notification, "id" | "timestamp">) => {
    try {
      console.log("Creating notification:", notificationData)

      const docRef = await addDoc(collection(db, "notifications"), {
        ...notificationData,
        timestamp: serverTimestamp(),
      })

      console.log("Notification created with ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("Error creating notification:", error)
      throw error
    }
  }, [])

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      })
      console.log("Marked notification as read:", notificationId)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const batch = writeBatch(db)
      const unreadNotifications = notifications.filter((n) => !n.read)

      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.update(notificationRef, { read: true })
      })

      await batch.commit()
      console.log("Marked all notifications as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    loading,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
  }
}
