"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/hooks/useNotifications"
import { useToast } from "@/hooks/use-toast"
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageViewer } from "@/components/ui/image-viewer"
import {
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  Calendar,
  MapPin,
  FileText,
  Zap,
  Flag,
  Circle,
  Trash2,
} from "lucide-react"
import type { MaintenanceRequest } from "@/lib/types"
import { PRIORITY_OPTIONS } from "@/lib/types"

const statusOptions = [
  { value: "قيد المراجعة", label: "Under Review", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "معتمد", label: "Approved", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "قيد التنفيذ", label: "In Progress", icon: Wrench, color: "bg-blue-100 text-blue-800" },
  { value: "مكتمل", label: "Completed", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "مرفوض", label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-800" },
]

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "urgent":
      return <Zap className="w-4 h-4" />
    case "high":
      return <AlertTriangle className="w-4 h-4" />
    case "medium":
      return <Flag className="w-4 h-4" />
    case "low":
      return <Circle className="w-4 h-4" />
    default:
      return <Circle className="w-4 h-4" />
  }
}

const getPriorityColor = (priority: string) => {
  const priorityOption = PRIORITY_OPTIONS.find((p) => p.value === priority)
  return priorityOption?.color || "bg-gray-100 text-gray-800 border-gray-200"
}

export default function ManagerPage() {
  const { user } = useAuth()
  const { createNotification } = useNotifications()
  const { toast } = useToast()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("all")

  // Cleanup old requests
  const cleanupOldRequests = async () => {
    try {
      const response = await fetch("/api/cleanup", {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "✅ Cleanup Complete",
          description: `Cleaned up ${result.deletedCount} old requests`,
        })
      } else {
        throw new Error("Cleanup failed")
      }
    } catch (error) {
      console.error("Error during cleanup:", error)
      toast({
        title: "❌ Cleanup Failed",
        description: "Failed to clean up old requests",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!user?.isManager) return

    console.log("Manager page: Setting up requests listener")

    const q = query(collection(db, "requests"), orderBy("timestamp", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Requests snapshot received, docs count:", snapshot.docs.length)

        const requestsList: MaintenanceRequest[] = []
        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          const request: MaintenanceRequest = {
            id: docSnapshot.id,
            branchCode: data.branchCode || "",
            problemType: data.problemType || "",
            description: data.description || "",
            imageUrl: data.imageUrl || "",
            timestamp: data.timestamp,
            status: data.status || "قيد المراجعة",
            userId: data.userId || "",
            priority: data.priority || "medium",
          }
          requestsList.push(request)
        })

        console.log("Processed requests:", requestsList.length)
        setRequests(requestsList)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching requests:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  const updateRequestStatus = async (requestId: string, newStatus: string, request: MaintenanceRequest) => {
    try {
      console.log("Updating request status:", requestId, "to:", newStatus)

      await updateDoc(doc(db, "requests", requestId), {
        status: newStatus,
      })

      // Create notification for the branch user (isForManager: false)
      const statusOption = statusOptions.find((s) => s.value === newStatus)
      const statusLabel = statusOption?.label || newStatus

      await createNotification({
        title: `📋 Request ${statusLabel}`,
        message: `Your ${request.problemType} request has been ${statusLabel.toLowerCase()}. Check your requests page for details.`,
        type: "status_update",
        read: false,
        requestId: requestId,
        branchCode: request.branchCode,
        isForManager: false, // This goes to branch users
      })

      console.log("Status updated and notification created")

      toast({
        title: "✅ Status Updated",
        description: `Request status changed to ${statusLabel}`,
      })
    } catch (error) {
      console.error("Error updating request status:", error)
      toast({
        title: "❌ Error",
        description: "Failed to update request status",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    if (statusOption) {
      const IconComponent = statusOption.icon
      return <IconComponent className="w-4 h-4" />
    }
    return <Clock className="w-4 h-4" />
  }

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    return statusOption?.color || "bg-gray-100 text-gray-800"
  }

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== "all" && request.status !== statusFilter) return false
    if (priorityFilter !== "all" && request.priority !== priorityFilter) return false
    if (branchFilter !== "all" && request.branchCode !== branchFilter) return false
    return true
  })

  // Get unique branch codes for filter
  const uniqueBranches = [...new Set(requests.map((r) => r.branchCode))].sort()

  if (!user?.isManager) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You need manager privileges to access this page.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading requests...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-gray-50">
        <div className="px-3 sm:px-6 lg:px-8 py-4 lg:py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
              <p className="text-gray-600">Manage maintenance requests from all branches</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 rounded-full px-3 py-1">
                  Manager View
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full px-3 py-1">
                  {filteredRequests.length} Requests
                </Badge>
              </div>
            </div>
            <div className="mt-4 lg:mt-0">
              <Button
                onClick={cleanupOldRequests}
                variant="outline"
                className="rounded-2xl border-2 hover:bg-red-50 hover:border-red-200 bg-transparent"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clean Old Requests
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="rounded-2xl border-2">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="rounded-2xl border-2">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {PRIORITY_OPTIONS.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="rounded-2xl border-2">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {uniqueBranches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          Branch {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">{request.problemType}</CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full px-2 py-1 text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          Branch {request.branchCode}
                        </Badge>
                        <Badge
                          className={`${getPriorityColor(request.priority || "medium")} border rounded-full px-2 py-1 text-xs`}
                        >
                          {getPriorityIcon(request.priority || "medium")}
                          <span className="ml-1">
                            {PRIORITY_OPTIONS.find((p) => p.value === request.priority)?.label || "Medium"}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{request.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <Badge className={`${getStatusColor(request.status)} border rounded-full px-3 py-1`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-2">
                        {statusOptions.find((s) => s.value === request.status)?.label || request.status}
                      </span>
                    </Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {request.timestamp?.toDate?.()?.toLocaleDateString() || "N/A"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-2xl border-2 bg-transparent"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl rounded-3xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold">Request Details</DialogTitle>
                        </DialogHeader>
                        {selectedRequest && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Problem Type</label>
                                <p className="text-gray-900">{selectedRequest.problemType}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                <p className="text-gray-900">Branch {selectedRequest.branchCode}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <Badge
                                  className={`${getPriorityColor(selectedRequest.priority || "medium")} border rounded-full px-2 py-1`}
                                >
                                  {getPriorityIcon(selectedRequest.priority || "medium")}
                                  <span className="ml-1">
                                    {PRIORITY_OPTIONS.find((p) => p.value === selectedRequest.priority)?.label ||
                                      "Medium"}
                                  </span>
                                </Badge>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                                <Badge
                                  className={`${getStatusColor(selectedRequest.status)} border rounded-full px-2 py-1`}
                                >
                                  {getStatusIcon(selectedRequest.status)}
                                  <span className="ml-1">
                                    {statusOptions.find((s) => s.value === selectedRequest.status)?.label}
                                  </span>
                                </Badge>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                              <p className="text-gray-900 bg-gray-50 p-4 rounded-2xl">{selectedRequest.description}</p>
                            </div>

                            {selectedRequest.imageUrl && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Attached Image</label>
                                <ImageViewer src={selectedRequest.imageUrl || "/placeholder.svg"} alt="Request image" />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                              <Select
                                value={selectedRequest.status}
                                onValueChange={(newStatus) =>
                                  updateRequestStatus(selectedRequest.id, newStatus, selectedRequest)
                                }
                              >
                                <SelectTrigger className="rounded-2xl border-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                      <div className="flex items-center gap-2">
                                        <status.icon className="w-4 h-4" />
                                        {status.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Found</h3>
              <p className="text-gray-600">No maintenance requests match your current filters.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
