"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import type { MaintenanceRequest } from "@/lib/types"
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Calendar, ImageIcon, CheckCircle, Clock, AlertCircle, Star, Eye, Building } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function ManagerPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [completionMessage, setCompletionMessage] = useState("")

  useEffect(() => {
    if (user?.isManager) {
      // For managers, show ALL requests from ALL branches
      const requestsQuery = query(collection(db, "requests"), orderBy("timestamp", "desc"))

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

  useEffect(() => {
    let filtered = requests

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (request) =>
          request.problemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.branchCode.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    setFilteredRequests(filtered)
  }, [searchQuery, statusFilter, requests])

  const createNotificationForBranch = async (
    requestId: string,
    branchCode: string,
    newStatus: string,
    problemType: string,
  ) => {
    try {
      const statusMessages = {
        "تمت الموافقة": "Your request has been approved and will be processed soon.",
        "قيد التنفيذ": "Work has started on your request.",
        "تم الإنجاز": "Your request has been completed successfully.",
        مرفوض: "Your request has been rejected. Please contact support for more information.",
      }

      await addDoc(collection(db, "notifications"), {
        title: "Request Status Updated",
        message: `Your ${problemType} request status: ${getStatusText(newStatus)}. ${statusMessages[newStatus as keyof typeof statusMessages] || ""}`,
        type: "status_update",
        timestamp: serverTimestamp(),
        read: false,
        requestId: requestId,
        branchCode: branchCode,
        isForManager: false,
      })
      console.log("Notification created for branch:", branchCode)
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  const handleStatusUpdate = async (requestId: string, newStatus: string, message?: string) => {
    setUpdatingStatus(requestId)
    try {
      const request = requests.find((r) => r.id === requestId)
      if (!request) return

      const updateData: any = { status: newStatus }
      if (message && newStatus === "تم الإنجاز") {
        updateData.completionMessage = message
      }

      await updateDoc(doc(db, "requests", requestId), updateData)

      // Create notification for branch user
      await createNotificationForBranch(requestId, request.branchCode, newStatus, request.problemType)

      toast({
        title: "Status Updated",
        description: "Request status has been updated successfully.",
      })
      setCompletionMessage("")
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

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

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "قيد المراجعة":
        return { status: "تمت الموافقة", text: "Approve", color: "bg-blue-600 hover:bg-blue-700" }
      case "تمت الموافقة":
        return { status: "قيد التنفيذ", text: "Start Work", color: "bg-orange-600 hover:bg-orange-700" }
      case "قيد التنفيذ":
        return { status: "تم الإنجاز", text: "Mark Complete", color: "bg-green-600 hover:bg-green-700" }
      default:
        return null
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  const getStatusStats = () => {
    const stats = {
      pending: requests.filter((r) => r.status === "قيد المراجعة").length,
      approved: requests.filter((r) => r.status === "تمت الموافقة").length,
      inProgress: requests.filter((r) => r.status === "قيد التنفيذ").length,
      completed: requests.filter((r) => r.status === "تم الإنجاز").length,
    }
    return stats
  }

  const getAverageRating = () => {
    const ratedRequests = requests.filter((r) => r.rating && r.rating > 0)
    if (ratedRequests.length === 0) return "0.0"
    const totalRating = ratedRequests.reduce((sum, r) => sum + (r.rating || 0), 0)
    return (totalRating / ratedRequests.length).toFixed(1)
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

  const stats = getStatusStats()
  const averageRating = getAverageRating()

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage maintenance requests from all branches</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-2xl">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-2xl">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-2xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-2xl">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-900">{averageRating}</p>
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-2xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="قيد المراجعة">Under Review</SelectItem>
                <SelectItem value="تمت الموافقة">Approved</SelectItem>
                <SelectItem value="قيد التنفيذ">In Progress</SelectItem>
                <SelectItem value="تم الإنجاز">Completed</SelectItem>
                <SelectItem value="مرفوض">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card className="rounded-3xl">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No requests found</p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => {
                const nextStatus = getNextStatus(request.status)
                return (
                  <Card key={request.id} className="hover:shadow-md transition-shadow rounded-3xl">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2 text-blue-600">
                              <Building className="w-4 h-4" />
                              <span className="font-medium">{request.branchCode}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{request.problemType}</h3>
                            <Badge className={`${getStatusColor(request.status)} rounded-full`}>
                              {getStatusText(request.status)}
                            </Badge>
                            {request.rating && (
                              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium text-yellow-800">{request.rating}/5</span>
                              </div>
                            )}
                          </div>

                          <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>

                          {/* Show feedback if available */}
                          {request.feedback && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                              <p className="text-sm font-medium text-blue-800 mb-1">Customer Feedback:</p>
                              <p className="text-sm text-blue-700">{request.feedback}</p>
                            </div>
                          )}

                          {/* Show completion message if available */}
                          {request.completionMessage && (
                            <div className="mb-4 p-3 bg-green-50 rounded-2xl border border-green-200">
                              <p className="text-sm font-medium text-green-800 mb-1">Completion Message:</p>
                              <p className="text-sm text-green-700">{request.completionMessage}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(request.timestamp)}
                            </div>
                            {request.imageUrl && (
                              <div className="flex items-center gap-1">
                                <ImageIcon className="w-4 h-4" />
                                Photo attached
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedRequest(request)}
                                  className="rounded-2xl"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl rounded-3xl">
                                <DialogHeader>
                                  <DialogTitle>Request Details & Status Update</DialogTitle>
                                </DialogHeader>
                                {selectedRequest && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Branch Code</label>
                                        <p className="text-sm text-gray-900">{selectedRequest.branchCode}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Problem Type</label>
                                        <p className="text-sm text-gray-900">{selectedRequest.problemType}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Current Status</label>
                                      <Badge className={`${getStatusColor(selectedRequest.status)} rounded-full ml-2`}>
                                        {getStatusText(selectedRequest.status)}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Description</label>
                                      <p className="text-sm text-gray-900 mt-1">{selectedRequest.description}</p>
                                    </div>
                                    {selectedRequest.imageUrl && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Attached Photo</label>
                                        <img
                                          src={selectedRequest.imageUrl || "/placeholder.svg"}
                                          alt="Request attachment"
                                          className="mt-2 max-w-full h-64 object-cover rounded-2xl border"
                                        />
                                      </div>
                                    )}
                                    {selectedRequest.rating && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          Customer Rating & Feedback
                                        </label>
                                        <div className="mt-2 p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
                                          <div className="flex items-center gap-2 mb-2">
                                            {renderStars(selectedRequest.rating)}
                                            <span className="text-sm font-medium text-yellow-800">
                                              ({selectedRequest.rating}/5)
                                            </span>
                                          </div>
                                          {selectedRequest.feedback && (
                                            <p className="text-sm text-gray-700">{selectedRequest.feedback}</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {selectedRequest.completionMessage && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Completion Message</label>
                                        <div className="mt-2 p-3 bg-green-50 rounded-2xl border border-green-200">
                                          <p className="text-sm text-green-700">{selectedRequest.completionMessage}</p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Status Update Section */}
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Update Status</label>
                                      {selectedRequest.status === "تم الإنجاز" ? (
                                        <div className="mt-2 p-3 bg-green-50 rounded-2xl border border-green-200">
                                          <p className="text-sm text-green-700 font-medium">✅ Request Completed</p>
                                          <p className="text-sm text-green-600">
                                            This request has been marked as completed.
                                          </p>
                                        </div>
                                      ) : selectedRequest.status === "مرفوض" ? (
                                        <div className="mt-2 p-3 bg-red-50 rounded-2xl border border-red-200">
                                          <p className="text-sm text-red-700 font-medium">❌ Request Rejected</p>
                                          <p className="text-sm text-red-600">This request has been rejected.</p>
                                        </div>
                                      ) : (
                                        <div className="mt-2 space-y-3">
                                          {getNextStatus(selectedRequest.status) && (
                                            <>
                                              {selectedRequest.status === "قيد التنفيذ" && (
                                                <div>
                                                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                    Completion Message (Optional)
                                                  </label>
                                                  <Textarea
                                                    placeholder="Add a message about the completion..."
                                                    value={completionMessage}
                                                    onChange={(e) => setCompletionMessage(e.target.value)}
                                                    rows={3}
                                                    className="rounded-2xl"
                                                  />
                                                </div>
                                              )}
                                              <Button
                                                size="sm"
                                                onClick={() => {
                                                  const nextStatusData = getNextStatus(selectedRequest.status)!
                                                  handleStatusUpdate(
                                                    selectedRequest.id!,
                                                    nextStatusData.status,
                                                    selectedRequest.status === "قيد التنفيذ"
                                                      ? completionMessage
                                                      : undefined,
                                                  )
                                                }}
                                                disabled={updatingStatus === selectedRequest.id}
                                                className={`${getNextStatus(selectedRequest.status)!.color} rounded-2xl`}
                                              >
                                                {updatingStatus === selectedRequest.id
                                                  ? "Updating..."
                                                  : getNextStatus(selectedRequest.status)!.text}
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleStatusUpdate(selectedRequest.id!, "مرفوض")}
                                                disabled={updatingStatus === selectedRequest.id}
                                                className="ml-2 rounded-2xl"
                                              >
                                                Reject
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {/* Quick Status Update Button */}
                            {nextStatus && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(request.id!, nextStatus.status)}
                                disabled={updatingStatus === request.id}
                                className={`${nextStatus.color} rounded-2xl`}
                              >
                                {updatingStatus === request.id ? "Updating..." : nextStatus.text}
                              </Button>
                            )}

                            {/* Quick Reject Button (only for non-completed/rejected requests) */}
                            {request.status !== "تم الإنجاز" && request.status !== "مرفوض" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStatusUpdate(request.id!, "مرفوض")}
                                disabled={updatingStatus === request.id}
                                className="rounded-2xl"
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
