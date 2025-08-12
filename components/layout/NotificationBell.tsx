"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, CheckCheck, BellRing, Settings, Dot } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

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
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
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

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12 rounded-2xl hover:bg-blue-50 active:bg-blue-100 transition-colors lg:h-10 lg:w-10"
        >
          <Bell className="h-6 w-6 text-gray-700 lg:h-5 lg:w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs bg-red-500 text-white rounded-full border-2 border-white lg:h-5 lg:w-5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse lg:hidden"></div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-3xl shadow-xl border-0 lg:w-96" align="end" sideOffset={8}>
        <Card className="border-0 shadow-none rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-blue-900">Notifications</CardTitle>
                {unreadCount > 0 && <p className="text-sm text-blue-600">{unreadCount} new notifications</p>}
              </div>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 px-3 text-xs rounded-xl hover:bg-blue-200 text-blue-700"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Notification Permission Alert - Mobile optimized */}
            {notificationPermission !== "granted" && (
              <div className="p-4 border-b bg-amber-50">
                <Alert className="rounded-2xl border-amber-200 bg-amber-50">
                  <BellRing className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium">Enable push notifications for real-time alerts</span>
                      <Button
                        size="sm"
                        onClick={requestNotificationPermission}
                        className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl self-start"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Enable
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <ScrollArea className="h-96 lg:h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-700 mb-1">No notifications yet</p>
                  <p className="text-sm text-gray-500">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100 ${
                        !notification.read ? "bg-blue-50 border-l-4 border-blue-500" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                              !notification.read ? "bg-blue-100" : "bg-gray-100"
                            }`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p
                              className={`font-medium text-sm leading-tight ${
                                !notification.read ? "text-blue-900" : "text-gray-900"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs text-gray-500">{formatTimeAgo(notification.timestamp)}</span>
                              {!notification.read && <Dot className="w-4 h-4 text-blue-500 fill-current" />}
                            </div>
                          </div>
                          <p
                            className={`text-sm leading-relaxed ${
                              !notification.read ? "text-blue-700" : "text-gray-600"
                            }`}
                          >
                            {notification.message}
                          </p>
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
