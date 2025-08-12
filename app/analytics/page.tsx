"use client"

import { useState, useEffect } from "react"
import { collection, query, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import type { MaintenanceRequest } from "@/lib/types"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle, Building, Trash2, RefreshCw } from "lucide-react"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCleaningUp, setIsCleaningUp] = useState(false)

  useEffect(() => {
    if (user?.isManager) {
      const requestsQuery = query(collection(db, "requests"))

      const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        const requestsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MaintenanceRequest[]

        setRequests(requestsData)
        setIsLoading(false)
      })

      return () => unsubscribe()
    }
  }, [user])

  const handleCleanup = async () => {
    setIsCleaningUp(true)
    try {
      const response = await fetch("/api/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "requests", daysOld: 7 }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Cleanup Successful! 🧹",
          description: `Deleted ${result.deletedCount} old completed requests`,
        })
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

  if (!user?.isManager) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  // Calculate analytics
  const totalRequests = requests.length
  const pendingRequests = requests.filter((r) => r.status === "قيد المراجعة").length
  const inProgressRequests = requests.filter((r) => r.status === "قيد التنفيذ").length
  const completedRequests = requests.filter((r) => r.status === "تم الإنجاز").length

  // Calculate old completed requests (7+ days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const oldCompletedRequests = requests.filter((r) => {
    if (r.status !== "تم الإنجاز") return false
    const timestamp = r.timestamp
    if (!timestamp) return false
    const requestDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return requestDate < sevenDaysAgo
  }).length

  // Branch analytics
  const branchStats = requests.reduce(
    (acc, request) => {
      const branch = request.branchCode
      if (!acc[branch]) {
        acc[branch] = { total: 0, completed: 0, pending: 0 }
      }
      acc[branch].total++
      if (request.status === "تم الإنجاز") acc[branch].completed++
      if (request.status === "قيد المراجعة") acc[branch].pending++
      return acc
    },
    {} as Record<string, { total: number; completed: number; pending: number }>,
  )

  // Problem type analytics
  const problemTypeStats = requests.reduce(
    (acc, request) => {
      const type = request.problemType
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-gray-50">
        <div className="px-3 sm:px-6 lg:px-8 py-4 lg:py-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Overview of maintenance requests across all branches</p>
            </div>

            {/* Cleanup Button */}
            <div className="flex flex-col sm:flex-row gap-2">
              {oldCompletedRequests > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                  {oldCompletedRequests} old requests (7+ days)
                </Badge>
              )}
              <Button
                onClick={handleCleanup}
                disabled={isCleaningUp || oldCompletedRequests === 0}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-6"
              >
                {isCleaningUp ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clean Old Requests
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <Card className="rounded-2xl lg:rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-xl lg:text-2xl font-bold text-blue-600">{totalRequests}</p>
                  </div>
                  <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl lg:rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-xl lg:text-2xl font-bold text-yellow-600">{pendingRequests}</p>
                  </div>
                  <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl lg:rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-xl lg:text-2xl font-bold text-orange-600">{inProgressRequests}</p>
                  </div>
                  <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl lg:rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-xl lg:text-2xl font-bold text-green-600">{completedRequests}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Branch Performance */}
            <Card className="rounded-2xl lg:rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <Building className="w-5 h-5" />
                  Branch Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 pt-0">
                <div className="space-y-3 lg:space-y-4">
                  {Object.entries(branchStats)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .map(([branch, stats]) => (
                      <div key={branch} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 text-sm lg:text-base">{branch}</p>
                          <p className="text-xs lg:text-sm text-gray-600">
                            {stats.completed}/{stats.total} completed
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                          </p>
                          <p className="text-xs text-gray-500">{stats.pending} pending</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Problem Types */}
            <Card className="rounded-2xl lg:rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <TrendingUp className="w-5 h-5" />
                  Common Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 pt-0">
                <div className="space-y-3 lg:space-y-4">
                  {Object.entries(problemTypeStats)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <p className="text-sm lg:text-base text-gray-900 flex-1 mr-4">{type}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 lg:w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(count / Math.max(...Object.values(problemTypeStats))) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600 w-6 lg:w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
