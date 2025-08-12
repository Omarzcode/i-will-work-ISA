"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, orderBy, where, onSnapshot, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import type { MaintenanceRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Clock, CheckCircle, AlertCircle, ArrowRight, Settings } from "lucide-react"

interface DashboardStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  completedRequests: number
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    completedRequests: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      try {
        const requestsQuery = user.isManager
          ? query(collection(db, "requests"), orderBy("timestamp", "desc"), limit(10))
          : query(
              collection(db, "requests"),
              where("branchCode", "==", user.branchCode),
              orderBy("timestamp", "desc"),
              limit(10),
            )

        const unsubscribe = onSnapshot(
          requestsQuery,
          (snapshot) => {
            const requestsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as MaintenanceRequest[]

            setRequests(requestsData)

            setStats({
              totalRequests: requestsData.length,
              pendingRequests: requestsData.filter((r) => r.status === "قيد المراجعة").length,
              approvedRequests: requestsData.filter((r) => r.status === "تمت الموافقة").length,
              completedRequests: requestsData.filter((r) => r.status === "تم الإنجاز").length,
            })

            setIsLoading(false)
            setError(null)
          },
          (error) => {
            console.error("Firestore error:", error)
            setError("Failed to load data. Please check your internet connection and try again.")
            setIsLoading(false)
          },
        )

        return () => unsubscribe()
      } catch (error) {
        console.error("Query setup error:", error)
        setError("Failed to setup data connection. Please refresh the page.")
        setIsLoading(false)
      }
    }
  }, [user, loading, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "قيد المراجعة":
        return "bg-yellow-100 text-yellow-800"
      case "تمت الموافقة":
        return "bg-blue-100 text-blue-800"
      case "قيد التنفيذ":
        return "bg-orange-100 text-orange-800"
      case "تم الإنجاز":
        return "bg-green-100 text-green-800"
      case "مرفوض":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "قيد المراجعة":
        return "Under Review"
      case "تمت الموافقة":
        return "Approved"
      case "قيد التنفيذ":
        return "In Progress"
      case "تم الإنجاز":
        return "Completed"
      case "مرفوض":
        return "Rejected"
      default:
        return status
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-sky-300 to-blue-500 text-white lg:hidden">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold">{user?.isManager ? "Admin Dashboard" : "Welcome Back"}</h1>
              <p className="text-white/80 text-sm">{user?.branchCode || "User"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="hidden lg:block mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{user?.isManager ? "Admin Dashboard" : "Welcome Back"}</h1>
          <p className="text-gray-600">{user?.branchCode || "User"}</p>
        </div>

        <div className="mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-600">Total</p>
                    <p className="text-xl lg:text-2xl font-bold text-blue-600">{stats.totalRequests}</p>
                  </div>
                  <FileText className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-xl lg:text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
                  </div>
                  <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-xl lg:text-2xl font-bold text-blue-600">{stats.approvedRequests}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-xl lg:text-2xl font-bold text-green-600">{stats.completedRequests}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            <Button
              onClick={() => router.push("/create-request")}
              className="h-12 lg:h-16 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
              New Request
            </Button>
            <Button variant="outline" onClick={() => router.push("/my-requests")} className="h-12 lg:h-16">
              <FileText className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
              View All Requests
            </Button>
            {user?.isManager && (
              <Button variant="outline" onClick={() => router.push("/analytics")} className="h-12 lg:h-16">
                <Settings className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                Analytics
              </Button>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Recent Requests</h2>
            <Button
              variant="ghost"
              onClick={() => router.push("/my-requests")}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-3 lg:space-y-4">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="p-6 lg:p-8 text-center">
                  <AlertCircle className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No requests available</p>
                </CardContent>
              </Card>
            ) : (
              requests.slice(0, 5).map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 lg:gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate">
                            {request.problemType}
                          </h3>
                          <Badge className={`${getStatusColor(request.status)} text-xs`}>
                            {getStatusText(request.status)}
                          </Badge>
                        </div>
                        <p className="text-xs lg:text-sm text-gray-600 mb-1 lg:mb-2">Branch: {request.branchCode}</p>
                        <p className="text-xs lg:text-sm text-gray-500 line-clamp-2">{request.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
