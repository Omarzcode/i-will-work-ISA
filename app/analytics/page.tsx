"use client"

import { useState, useEffect } from "react"
import { collection, query, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import type { MaintenanceRequest } from "@/lib/types"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { FileText, Clock, CheckCircle, AlertCircle, XCircle, Star } from "lucide-react"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.isManager) return

    const q = query(collection(db, "requests"), orderBy("timestamp", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsList: MaintenanceRequest[] = []
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        requestsList.push({
          id: doc.id,
          ...data,
        } as MaintenanceRequest)
      })
      setRequests(requestsList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  if (!user?.isManager) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Access denied. Manager privileges required.</p>
        </div>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  // Calculate statistics
  const totalRequests = requests.length
  const pendingRequests = requests.filter((r) => r.status === "قيد المراجعة").length
  const inProgressRequests = requests.filter((r) => r.status === "قيد التنفيذ").length
  const completedRequests = requests.filter((r) => r.status === "تم الإنجاز").length
  const rejectedRequests = requests.filter((r) => r.status === "مرفوض").length
  const x=0
  // Calculate average rating
  const ratedRequests = requests.filter((r) => r.rating && r.rating > 0)
  const averageRating =
    ratedRequests.length > 0 ? ratedRequests.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedRequests.length : 0

  // Status distribution for pie chart
  const statusData = [
    { name: "Pending", value: pendingRequests, color: "#fbbf24" },
    { name: "In Progress", value: inProgressRequests, color: "#f97316" },
    { name: "Completed", value: completedRequests, color: "#10b981" },
    { name: "Rejected", value: rejectedRequests, color: "#ef4444" },
  ]

  // Problem type distribution
  const problemTypeData = requests.reduce((acc: any[], request) => {
    const existing = acc.find((item) => item.name === request.problemType)
    if (existing) {
      existing.value += 1
    } else {
      acc.push({ name: request.problemType, value: 1 })
    }
    return acc
  }, [])

  // Monthly trend (last 6 months)
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthName = date.toLocaleDateString("en-US", { month: "short" })
    const monthRequests = requests.filter((r) => {
      if (!r.timestamp) return false
      const requestDate = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp)
      return requestDate.getMonth() === date.getMonth() && requestDate.getFullYear() === date.getFullYear()
    }).length
    monthlyData.push({ month: monthName, requests: monthRequests })
  }

  // Branch performance
  const branchData = requests.reduce((acc: any[], request) => {
    const existing = acc.find((item) => item.branch === request.branchCode)
    if (existing) {
      existing.total += 1
      if (request.status === "تم الإنجاز") existing.completed += 1
    } else {
      acc.push({
        branch: request.branchCode,
        total: 1,
        completed: request.status === "تم الإنجاز" ? 1 : 0,
      })
    }
    return acc
  }, [])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Overview of maintenance requests and performance metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{inProgressRequests}</div>
              <p className="text-xs text-muted-foreground">Being worked on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedRequests}</div>
              <p className="text-xs text-muted-foreground">Successfully resolved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {ratedRequests.length > 0 ? `${ratedRequests.length} ratings` : "No ratings yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Request Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Request Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Problem Types */}
          <Card>
            <CardHeader>
              <CardTitle>Problem Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={problemTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Branch Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Branch Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branch" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" name="Total Requests" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {request.status === "قيد المراجعة" && <Clock className="h-5 w-5 text-yellow-600" />}
                      {request.status === "تمت الموافقة" && <CheckCircle className="h-5 w-5 text-blue-600" />}
                      {request.status === "قيد التنفيذ" && <AlertCircle className="h-5 w-5 text-orange-600" />}
                      {request.status === "تم الإنجاز" && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {request.status === "مرفوض" && <XCircle className="h-5 w-5 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{request.problemType}</p>
                      <p className="text-sm text-gray-500">Branch {request.branchCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        request.status === "قيد المراجعة"
                          ? "bg-yellow-100 text-yellow-800"
                          : request.status === "تمت الموافقة"
                            ? "bg-blue-100 text-blue-800"
                            : request.status === "قيد التنفيذ"
                              ? "bg-orange-100 text-orange-800"
                              : request.status === "تم الإنجاز"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                      }
                    >
                      {request.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {request.timestamp?.toDate?.()?.toLocaleDateString() || "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
