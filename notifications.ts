// Legacy notification service - keeping for backward compatibility
// Main notification system is now in hooks/useNotifications.ts

import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./lib/firebase"
import type { Notification } from "./lib/types"

export class NotificationService {
  private static instance: NotificationService
  private listeners: Map<string, () => void> = new Map()

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async createNotification(notification: Omit<Notification, "id" | "timestamp">) {
    try {
      await addDoc(collection(db, "notifications"), {
        ...notification,
        timestamp: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  // This is deprecated - use hooks/useNotifications.ts instead
  subscribeToNotifications(
    userId: string,
    isManager: boolean,
    branchCode: string,
    callback: (notifications: Notification[]) => void,
  ) {
    const notificationsRef = collection(db, "notifications")
    let q

    if (isManager) {
      q = query(notificationsRef, where("isForManager", "==", true), orderBy("timestamp", "desc"))
    } else {
      q = query(
        notificationsRef,
        where("branchCode", "==", branchCode),
        where("isForManager", "==", false),
        orderBy("timestamp", "desc"),
      )
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = []
      snapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() } as Notification)
      })
      callback(notifications)
    })

    this.listeners.set(userId, unsubscribe)
    return unsubscribe
  }

  unsubscribe(userId: string) {
    const unsubscribe = this.listeners.get(userId)
    if (unsubscribe) {
      unsubscribe()
      this.listeners.delete(userId)
    }
  }
}
