"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./useAuth"
import type { Notification } from "@/lib/types"

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

      setNotifications(notificationsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

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
