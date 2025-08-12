"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/hooks/useAuth"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "firebase/firestore"

interface Notification {
  id: string
  title: string
  message: string
  timestamp: any
  isRead: boolean
  branchCode?: string
  isForManager?: boolean
}

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      console.log("NotificationBell: No user found")
      return
    }

    console.log("NotificationBell: Setting up notifications for user:", {
      email: user.email,
      role: user.role,
      branchCode: user.branchCode,
    })

    let notificationQuery

    if (user.role === "manager") {
      // Managers see all notifications marked for managers
      notificationQuery = query(
        collection(db, "notifications"),
        where("isForManager", "==", true),
        orderBy("timestamp", "desc"),
      )
      console.log("NotificationBell: Created manager query")
    } else {
      // Branch users see notifications for their branch
      notificationQuery = query(
        collection(db, "notifications"),
        where("branchCode", "==", user.branchCode),
        where("isForManager", "==", false),
        orderBy("timestamp", "desc"),
      )
      console.log("NotificationBell: Created branch user query for branch:", user.branchCode)
    }

    const unsubscribe = onSnapshot(
      notificationQuery,
      (snapshot) => {
        console.log("NotificationBell: Received snapshot with", snapshot.docs.length, "notifications")

        const notificationData = snapshot.docs.map((doc) => {
          const data = doc.data()
          console.log("NotificationBell: Processing notification:", data)
          return {
            id: doc.id,
            ...data,
          } as Notification
        })

        setNotifications(notificationData)

        const unread = notificationData.filter((n) => !n.isRead).length
        setUnreadCount(unread)
        console.log("NotificationBell: Set unread count to:", unread)

        // Show browser notification for new unread notifications
        if (unread > 0 && "Notification" in window && Notification.permission === "granted") {
          const latestUnread = notificationData.find((n) => !n.isRead)
          if (latestUnread) {
            new Notification(latestUnread.title, {
              body: latestUnread.message,
              icon: "/maintenance-logo.png",
            })
          }
        }
      },
      (error) => {
        console.error("NotificationBell: Error listening to notifications:", error)
      },
    )

    return () => {
      console.log("NotificationBell: Cleaning up notification listener")
      unsubscribe()
    }
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      console.log("NotificationBell: Marking notification as read:", notificationId)
      await updateDoc(doc(db, "notifications", notificationId), {
        isRead: true,
      })
    } catch (error) {
      console.error("NotificationBell: Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      console.log("NotificationBell: Marking all notifications as read")
      const unreadNotifications = notifications.filter((n) => !n.isRead)

      for (const notification of unreadNotifications) {
        await updateDoc(doc(db, "notifications", notification.id), {
          isRead: true,
        })
      }
    } catch (error) {
      console.error("NotificationBell: Error marking all notifications as read:", error)
    }
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission()
      console.log("NotificationBell: Notification permission:", permission)
    }
  }

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Just now"

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

      if (diffInMinutes < 1) return "Just now"
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    } catch (error) {
      console.error("NotificationBell: Error formatting timestamp:", error)
      return "Just now"
    }
  }

  if (!user) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-xl" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 rounded-lg"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notifications yet</div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    notification.isRead
                      ? "bg-gray-50 hover:bg-gray-100"
                      : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-medium text-sm ${notification.isRead ? "text-gray-700" : "text-blue-900"}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2">{formatTimestamp(notification.timestamp)}</span>
                  </div>
                  <p className={`text-sm ${notification.isRead ? "text-gray-600" : "text-blue-800"}`}>
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
