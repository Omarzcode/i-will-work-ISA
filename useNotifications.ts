"use client"

import { useState, useEffect } from "react"
import { NotificationService, type NotificationData } from "@/lib/notifications"
import { useAuth } from "./useAuth"

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const notificationService = NotificationService.getInstance()

    // Request notification permission
    notificationService.requestNotificationPermission()

    // Initialize based on user type
    if (user.isManager) {
      notificationService.initializeForManager()
    } else if (user.branchCode) {
      notificationService.initializeForUser(user.branchCode)
    }

    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications)
      setUnreadCount(notificationService.getUnreadCount())
    })

    return () => {
      unsubscribe()
      notificationService.cleanup()
    }
  }, [user])

  const markAsRead = (notificationId: string) => {
    const notificationService = NotificationService.getInstance()
    notificationService.markAsRead(notificationId)
  }

  const markAllAsRead = () => {
    const notificationService = NotificationService.getInstance()
    notificationService.markAllAsRead()
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}
