"use client"

import { useState, useEffect } from "react"
import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/useNotifications"
import { formatDistanceToNow } from "date-fns"

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, requestPermission, hasPermission } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [showPermissionAlert, setShowPermissionAlert] = useState(false)

  useEffect(() => {
    // Check if browser notifications are supported and permission status
    if (typeof window !== "undefined" && "Notification" in window) {
      setShowPermissionAlert(Notification.permission === "default" || Notification.permission === "denied")
    }
  }, [])

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId)
  }

  const handleEnableNotifications = async () => {
    const granted = await requestPermission()
    if (granted) {
      setShowPermissionAlert(false)
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
        return "📢"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-2xl">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-3xl" align="end">
        <Card className="border-0 shadow-lg rounded-3xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                    : "All caught up!"}
                </CardDescription>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:text-blue-700 rounded-2xl"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Permission Alert */}
            {showPermissionAlert && (
              <div className="p-4 border-b">
                <Alert className="border-blue-200 bg-blue-50 rounded-2xl">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Enable browser notifications for real-time alerts</span>
                      <Button
                        size="sm"
                        onClick={handleEnableNotifications}
                        className="ml-2 bg-blue-600 hover:bg-blue-700 rounded-xl"
                      >
                        Enable
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Notifications List */}
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        !notification.read ? "bg-blue-50/50" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${!notification.read ? "font-semibold text-gray-900" : "text-gray-700"}`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                        )}
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
