"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "firebase/firestore"

interface Notification {
  id: string
  title: string
  message: string
  timestamp: any
  read: boolean
  type: "request_created" | "status_updated"
  requestId?: string
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

    console.log(
      "NotificationBell: Setting up notifications for user:",
      user.email,
      "Role:",
      user.role,
      "Branch:",
      user.branchCode,
    )

    let notificationsQuery

    if (user.role === "manager") {
      // Managers see all notifications for managers
      notificationsQuery = query(
        collection(db, "notifications"),
        where("isForManager", "==", true),
        orderBy("timestamp", "desc"),
      )
      console.log("NotificationBell: Manager query created")
    } else {
      // Branch users see notifications for their branch
      notificationsQuery = query(
        collection(db, "notifications"),
        where("branchCode", "==", user.branchCode),
        where("isForManager", "==", false),
        orderBy("timestamp", "desc"),
      )
      console.log("NotificationBell: Branch user query created for branch:", user.branchCode)
    }

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        console.log("NotificationBell: Received snapshot with", snapshot.docs.length, "notifications")

        const notificationsList = snapshot.docs.map((doc) => {
          const data = doc.data()
          console.log("NotificationBell: Processing notification:", doc.id, data)

          return {
            id: doc.id,
            title: data.title || "Notification",
            message: data.message || "",
            timestamp: data.timestamp,
            read: data.read || false,
            type: data.type || "request_created",
            requestId: data.requestId,
          }
        })

        setNotifications(notificationsList)
        const unread = notificationsList.filter((n) => !n.read).length
        setUnreadCount(unread)
        console.log("NotificationBell: Updated notifications count:", notificationsList.length, "Unread:", unread)

        // Show browser notification for new unread notifications
        if (unread > 0 && "Notification" in window && Notification.permission === "granted") {
          const latestUnread = notificationsList.find((n) => !n.read)
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
        read: true,
      })
    } catch (error) {
      console.error("NotificationBell: Error marking notification as read:", error)
    }
  }

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

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission()
      console.log("NotificationBell: Notification permission:", permission)
    }
  }

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  if (!user) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-blue-50"
          onClick={() => console.log("NotificationBell: Bell clicked, notifications:", notifications.length)}
        >
          <Bell className="h-5 w-5 text-blue-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-xl border-blue-200" align="end">
        <div className="p-4 border-b border-blue-100">
          <h3 className="font-semibold text-blue-900">Notifications</h3>
          {unreadCount > 0 && <p className="text-sm text-blue-600">{unreadCount} unread</p>}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    notification.read
                      ? "bg-gray-50 hover:bg-gray-100"
                      : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-medium text-sm ${notification.read ? "text-gray-700" : "text-blue-900"}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2">{formatTimestamp(notification.timestamp)}</span>
                  </div>
                  <p className={`text-sm ${notification.read ? "text-gray-600" : "text-blue-700"}`}>
                    {notification.message}
                  </p>
                  {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
