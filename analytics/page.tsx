"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import type { MaintenanceRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3,
  PieChart,
} from "lucide-react"

interface AnalyticsData {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  inProgressRequests: number
  completedRequests: number
  rejectedRequests: number
  branchStats: { [key: string]: number }
  problemTypeStats: { [key: string]: number }
  monthlyStats: { [key: string]: number }
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    rejectedRequests: 0,
    branchStats: {},
    problemTypeStats: {},
    monthlyStats: {},
  })
  const [isLoading, setIsLoading] = useState(true)

  // Redirect non-managers
  useEffect(() => {
    if (user && !user.isManager) {
      router.push("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    if (user?.isManager) {
      const requestsQuery = query(collection(db, "requests"))

      const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MaintenanceRequest[]

        // Calculate analytics
        const branchStats: { [key: string]: number } = {}
        const problemTypeStats: { [key: string]: number } = {}
        const monthlyStats: { [key: string]: number } = {}

        requests.forEach((request) => {
          // Branch statistics
          branchStats[request.branchCode] = (branchStats[request.branchCode] || 0) + 1

          // Problem type statistics
          problemTypeStats[request.problemType] = (problemTypeStats[request.problemType] || 0) + 1

          // Monthly statistics
          if (request.timestamp) {
            const date = request.timestamp.toDate ? request.timestamp.toDate() : new Date(request.timestamp)
            const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "short" })
            monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1
          }
        })

        setAnalyticsData({
          totalRequests: requests.length,
          pendingRequests: requests.filter((r) => r.status === "قيد المراجعة").length,
          approvedRequests: requests.filter((r) => r.status === "تمت الموافقة").length,
          inProgressRequests: requests.filter((r) => r.status === "قيد التنفيذ").length,
          completedRequests: requests.filter((r) => r.status === "تم الإنجاز").length,
          rejectedRequests: requests.filter((r) => r.status === "مرفوض").length,
          branchStats,
          problemTypeStats,
          monthlyStats,
        })

        setIsLoading(false)
      })

      return () => unsubscribe()
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const completionRate =
    analyticsData.totalRequests > 0
      ? Math.round((analyticsData.completedRequests / analyticsData.totalRequests) * 100)
      : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-300 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 mr-4"
              onClick={() => router.push("/manager")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-3xl font-bold text-blue-600">{analyticsData.totalRequests}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Branches</p>
                  <p className="text-3xl font-bold text-purple-600">{Object.keys(analyticsData.branchStats).length}</p>
                </div>
                <Users className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
                  <p className="text-3xl font-bold text-orange-600">2.4h</p>
                </div>
                <Clock className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Request Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Pending Review</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-600">{analyticsData.pendingRequests}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Approved</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{analyticsData.approvedRequests}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">In Progress</span>
                  </div>
                  <span className="text-xl font-bold text-orange-600">{analyticsData.inProgressRequests}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Completed</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{analyticsData.completedRequests}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium">Rejected</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">{analyticsData.rejectedRequests}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top Problem Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analyticsData.problemTypeStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="font-medium">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(count / Math.max(...Object.values(analyticsData.problemTypeStats))) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-600">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Branch Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Branch Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analyticsData.branchStats)
                .sort(([, a], [, b]) => b - a)
                .map(([branch, count]) => (
                  <div key={branch} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{branch} Branch</span>
                      <span className="text-lg font-bold text-blue-600">{count}</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(analyticsData.branchStats))) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
