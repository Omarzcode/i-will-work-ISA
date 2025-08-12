"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Database, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StorageStats {
  totalRequests: number
  completedRequests: number
  oldCompletedRequests: number
  totalNotifications: number
  estimatedCleanupSavings: number
}

export function CleanupDashboard() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const { toast } = useToast()

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/cleanup")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch storage stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleCleanup = async (type: "requests" | "notifications" | "full") => {
    setIsCleaningUp(true)
    try {
      const response = await fetch("/api/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      const result = await response.json()

      if (result.success || result.totalDeleted !== undefined) {
        const deletedCount = result.deletedCount || result.totalDeleted || 0
        toast({
          title: "Cleanup Successful! 🧹",
          description: `Deleted ${deletedCount} old records`,
        })
        fetchStats() // Refresh stats
      } else {
        throw new Error(result.message || "Cleanup failed")
      }
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      })
    } finally {
      setIsCleaningUp(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading storage statistics...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Storage Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total Requests</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats?.totalRequests || 0}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Completed</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{stats?.completedRequests || 0}</p>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Old Completed</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{stats?.oldCompletedRequests || 0}</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Notifications</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{stats?.totalNotifications || 0}</p>
            </div>
          </div>

          {/* Cleanup Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Cleanup Actions</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => handleCleanup("requests")}
                disabled={isCleaningUp}
                className="h-auto p-4 rounded-2xl bg-orange-600 hover:bg-orange-700 flex flex-col items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                <div className="text-center">
                  <div className="font-medium">Clean Old Requests</div>
                  <div className="text-xs opacity-90">Remove completed requests older than 30 days</div>
                </div>
                {stats?.oldCompletedRequests && stats.oldCompletedRequests > 0 && (
                  <Badge variant="secondary" className="bg-white/20">
                    {stats.oldCompletedRequests} items
                  </Badge>
                )}
              </Button>

              <Button
                onClick={() => handleCleanup("notifications")}
                disabled={isCleaningUp}
                className="h-auto p-4 rounded-2xl bg-purple-600 hover:bg-purple-700 flex flex-col items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                <div className="text-center">
                  <div className="font-medium">Clean Notifications</div>
                  <div className="text-xs opacity-90">Remove notifications older than 7 days</div>
                </div>
              </Button>

              <Button
                onClick={() => handleCleanup("full")}
                disabled={isCleaningUp}
                className="h-auto p-4 rounded-2xl bg-red-600 hover:bg-red-700 flex flex-col items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                <div className="text-center">
                  <div className="font-medium">Full Cleanup</div>
                  <div className="text-xs opacity-90">Clean both requests and notifications</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 Recommendations:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Run cleanup monthly to maintain optimal performance</li>
              <li>• Keep completed requests for 30 days for reference</li>
              <li>• Clean notifications weekly to reduce clutter</li>
              <li>• Monitor storage usage with 25 branches</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
