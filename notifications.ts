"use client"

import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { MaintenanceRequest } from "@/lib/types"

export interface NotificationData {
  id: string
  title: string
  message: string
  type: "new_request" | "status_update" | "system"
  timestamp: Date
  read: boolean
  requestId?: string
}

export class NotificationService {
  private static instance: NotificationService
  private notifications: NotificationData[] = []
  private listeners: ((notifications: NotificationData[]) => void)[] = []
  private unsubscribe: (() => void) | null = null

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Initialize notifications for managers
  initializeForManager() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }

    // Listen for new requests
    const requestsQuery = query(collection(db, "requests"), orderBy("timestamp", "desc"), limit(50))

    let isFirstLoad = true
    this.unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      if (isFirstLoad) {
        isFirstLoad = false
        return
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const request = { id: change.doc.id, ...change.doc.data() } as MaintenanceRequest
          this.addNotification({
            id: `new_request_${request.id}`,
            title: "New Maintenance Request",
            message: `New ${request.problemType} request from ${request.branchCode} branch`,
            type: "new_request",
            timestamp: new Date(),
            read: false,
            requestId: request.id,
          })
        }
      })
    })
  }

  // Initialize notifications for regular users
  initializeForUser(branchCode: string) {
    if (this.unsubscribe) {
      this.unsubscribe()
    }

    // Listen for status updates on user's requests
    const requestsQuery = query(
      collection(db, "requests"),
      where("branchCode", "==", branchCode),
      orderBy("timestamp", "desc"),
      limit(20),
    )

    const initialRequests: { [key: string]: string } = {}
    let isFirstLoad = true

    this.unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      if (isFirstLoad) {
        // Store initial states
        snapshot.docs.forEach((doc) => {
          const request = doc.data() as MaintenanceRequest
          initialRequests[doc.id] = request.status
        })
        isFirstLoad = false
        return
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const request = { id: change.doc.id, ...change.doc.data() } as MaintenanceRequest
          const oldStatus = initialRequests[request.id!]

          if (oldStatus && oldStatus !== request.status) {
            this.addNotification({
              id: `status_update_${request.id}_${Date.now()}`,
              title: "Request Status Updated",
              message: `Your ${request.problemType} request status changed to ${this.getStatusText(request.status)}`,
              type: "status_update",
              timestamp: new Date(),
              read: false,
              requestId: request.id,
            })
            initialRequests[request.id!] = request.status
          }
        }
      })
    })
  }

  private getStatusText(status: string): string {
    switch (status) {
      case "قيد المراجعة":
        return "Under Review"
      case "تمت الموافقة":
        return "Approved"
      case "قيد التنفيذ":
        return "In Progress"
      case "تم الإنجاز":
        return "Completed"
      case "مرفوض":
        return "Rejected"
      default:
        return status
    }
  }

  addNotification(notification: NotificationData) {
    this.notifications.unshift(notification)
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50)
    }
    this.notifyListeners()

    // Show browser notification if permission granted
    this.showBrowserNotification(notification)
  }

  private showBrowserNotification(notification: NotificationData) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id,
      })
    }
  }

  requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }

  subscribe(callback: (notifications: NotificationData[]) => void) {
    this.listeners.push(callback)
    callback(this.notifications)

    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.notifications))
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.notifyListeners()
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true))
    this.notifyListeners()
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
    this.notifications = []
    this.listeners = []
  }
}
