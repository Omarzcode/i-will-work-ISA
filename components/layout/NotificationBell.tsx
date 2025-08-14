"use client"

import { useState } from "react"
import { Bell, CheckCheck, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/hooks/useNotifications"

export function NotificationBell() {
  const { user } = useAuth()
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId)
  }

  const handleViewAll = () => {
    console.log("View all notifications clicked")
    // TODO: Navigate to notifications page
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_request":
        return "📝"
      case "status_update":
        return "📋"
      case "success":
        return "✅"
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      default:
        return "🔔"
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
      return "Just now"
    }
  }

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {user?.isManager ? "Manager View - New Requests" : `Branch ${user?.branchCode} - Status Updates`}
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {notifications.length === 0 ? "No notifications" : `${notifications.length} total, ${unreadCount} unread`}
          </p>
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-xl mb-2 cursor-pointer transition-colors ${
                    notification.read
                      ? "bg-gray-50 hover:bg-gray-100"
                      : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                  }`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`text-sm font-medium truncate ${notification.read ? "text-gray-700" : "text-gray-900"}`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                        )}
                      </div>
                      <p
                        className={`text-xs mb-2 line-clamp-2 ${notification.read ? "text-gray-500" : "text-gray-700"}`}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{formatTimestamp(notification.timestamp)}</span>
                        {notification.branchCode && (
                          <Badge className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            Branch {notification.branchCode}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAll}
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              View All Notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
