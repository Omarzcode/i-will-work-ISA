"use client"

import { useState } from "react"
import { useNotifications } from "@/hooks/useNotifications"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, CheckCheck, Clock, FileText, Settings, AlertCircle } from "lucide-react"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "new_request":
      return <FileText className="w-4 h-4 text-blue-600" />
    case "status_update":
      return <Clock className="w-4 h-4 text-green-600" />
    case "system":
      return <Settings className="w-4 h-4 text-purple-600" />
    default:
      return <AlertCircle className="w-4 h-4 text-gray-600" />
  }
}

const getTimeAgo = (timestamp: any) => {
  if (!timestamp) return "Unknown"

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString()
}

export function NotificationBell() {
  const { user } = useAuth()
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId)
    }
  }

  const handleViewAll = () => {
    console.log("View all notifications clicked")
    // You can implement navigation to a full notifications page here
    setOpen(false)
  }

  if (!user) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-2xl hover:bg-blue-50 active:bg-blue-100 transition-colors"
        >
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 border-2 border-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 rounded-3xl" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {user.isManager ? "Manager Notifications" : `Branch ${user.branchCode} Notifications`}
              </CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            {user.isManager && <p className="text-sm text-gray-600">New requests from all branches</p>}
            {!user.isManager && <p className="text-sm text-gray-600">Status updates for your requests</p>}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">No notifications yet</p>
                <p className="text-xs text-gray-400">
                  {user.isManager
                    ? "You'll be notified when new requests are submitted"
                    : "You'll be notified when your request status changes"}
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-80">
                  <div className="space-y-1 p-2">
                    {notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id!, notification.read)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                          notification.read
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                className={`text-sm font-medium truncate ${
                                  notification.read ? "text-gray-700" : "text-gray-900"
                                }`}
                              >
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                              )}
                            </div>
                            <p
                              className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                                notification.read ? "text-gray-500" : "text-gray-600"
                              }`}
                            >
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-400">{getTimeAgo(notification.timestamp)}</p>
                              {notification.read && <Check className="w-3 h-3 text-gray-400" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {notifications.length > 10 && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleViewAll}
                      className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-2xl"
                    >
                      View all notifications ({notifications.length})
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
