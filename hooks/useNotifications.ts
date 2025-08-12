"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore"
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

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("branchCode", "==", user.branchCode),
      orderBy("timestamp", "desc"),
    )

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

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, loading }
}
