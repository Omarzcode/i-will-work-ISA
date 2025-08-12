"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, CheckCheck, BellRing, Settings } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, writeBatch } from "firebase/firestore"

interface Notification {
  id: string
  title: string
  message: string
  timestamp: any
  read: boolean
  type: string
  requestId?: string
  branchCode?: string
  isForManager: boolean
}

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  console.log("NotificationBell: Component loaded, user:", user?.email, "isManager:", user?.isManager)

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      console.log("NotificationBell: No user, clearing notifications")
      setNotifications([])
      setUnreadCount(0)
      return
    }

    console.log("NotificationBell: Setting up notifications for user:", {
      email: user.email,
      isManager: user.isManager,
      branchCode: user.branchCode,
    })

    const notificationsRef = collection(db, "notifications")
    let q

    if (user.isManager) {
      // Managers see notifications marked for managers
      q = query(notificationsRef, where("isForManager", "==", true), orderBy("timestamp", "desc"))
      console.log("NotificationBell: Created manager query")
    } else {
      // Branch users see notifications for their branch
      q = query(
        notificationsRef,
        where("branchCode", "==", user.branchCode),
        where("isForManager", "==", false),
        orderBy("timestamp", "desc"),
      )
      console.log("NotificationBell: Created branch user query for branch:", user.branchCode)
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("NotificationBell: Received snapshot with", snapshot.docs.length, "notifications")

        const notificationsList: Notification[] = []
        let unreadCounter = 0

        snapshot.forEach((doc) => {
          const data = doc.data()
          console.log("NotificationBell: Processing notification:", doc.id, data)

          const notification: Notification = {
            id: doc.id,
            title: data.title,
            message: data.message,
            type: data.type,
            read: data.read || false,
            timestamp: data.timestamp,
            requestId: data.requestId,
            branchCode: data.branchCode,
            isForManager: data.isForManager,
          }

          notificationsList.push(notification)
          if (!notification.read) {
            unreadCounter++
          }
        })

        console.log("NotificationBell: Processed notifications:", notificationsList.length, "unread:", unreadCounter)
        setNotifications(notificationsList.slice(0, 50)) // Limit to 50 notifications
        setUnreadCount(unreadCounter)

        // Show browser notification for new unread notifications
        if (unreadCounter > 0 && "Notification" in window && Notification.permission === "granted") {
          const latestUnread = notificationsList.find((n) => !n.read)
          if (latestUnread) {
            console.log("NotificationBell: Showing browser notification:", latestUnread.title)
            const browserNotification = new Notification(latestUnread.title, {
              body: latestUnread.message,
              icon: "/maintenance-logo.png",
              tag: latestUnread.id,
            })

            browserNotification.onclick = () => {
              window.focus()
              browserNotification.close()
            }

            setTimeout(() => {
              browserNotification.close()
            }, 5000)
          }
        }
      },
      (error) => {
        console.error("NotificationBell: Error in notifications listener:", error)
      },
    )

    return () => {
      console.log("NotificationBell: Cleaning up notifications listener")
      unsubscribe()
    }
  }, [user])

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === "granted") {
        new Notification("Notifications Enabled!", {
          body: "You'll now receive real-time notifications for updates.",
          icon: "/maintenance-logo.png",
        })
      }
    }
  }

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return ""
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_request":
        return "🔧"
      case "status_update":
        return "📋"
      case "success":
        return "✅"
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      default:
        return "ℹ️"
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      console.log("NotificationBell: Marking notification as read:", notificationId)
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, { read: true })
    } catch (error) {
      console.error("NotificationBell: Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      console.log("NotificationBell: Marking all notifications as read")
      const batch = writeBatch(db)
      const unreadNotifications = notifications.filter((n) => !n.read)

      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.update(notificationRef, { read: true })
      })

      await batch.commit()
      console.log("NotificationBell: All notifications marked as read")
    } catch (error) {
      console.error("NotificationBell: Error marking all notifications as read:", error)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-2xl">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-3xl" align="end">
        <Card className="border-0 shadow-none rounded-3xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {unreadCount} new
                  </Badge>
                )}
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-6 px-2 text-xs rounded-xl">
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Notification Permission Alert */}
            {notificationPermission !== "granted" && (
              <div className="p-3 border-b">
                <Alert className="rounded-2xl">
                  <BellRing className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <div className="flex items-center justify-between">
                      <span>Enable browser notifications for real-time alerts</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={requestNotificationPermission}
                        className="h-6 px-2 text-xs ml-2 bg-transparent rounded-xl"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Enable
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors rounded-2xl mx-2 my-1 ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                            <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                            {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-1">{notification.message}</p>
                          <p className="text-xs text-gray-400">{formatTimeAgo(notification.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
