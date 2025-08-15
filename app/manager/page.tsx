"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, Timestamp } from "firebase/firestore"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Search,
  Calendar,
  ImageIcon,
  FileText,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  Eye,
  Edit,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImageViewer } from "@/components/ui/image-viewer"

export default function ManagerPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [branchFilter, setBranchFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [managingRequest, setManagingRequest] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [completionMessage, setCompletionMessage] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.isManager) return

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
  }, [user])

  useEffect(() => {
    let filtered = requests

    // Search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (request) =>
          request.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.problemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.branchCode.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((request) => request.priority === priorityFilter)
    }

    // Branch filter
    if (branchFilter !== "all") {
      filtered = filtered.filter((request) => request.branchCode === branchFilter)
    }

    setFilteredRequests(filtered)
  }, [searchQuery, statusFilter, priorityFilter, branchFilter, requests])

  const handleStatusUpdate = async () => {
    if (!managingRequest || !newStatus) return

    setUpdatingStatus(true)
    try {
      const updateData: any = { status: newStatus }
      if (newStatus === "تم الإنجاز" && completionMessage.trim()) {
        updateData.completionMessage = completionMessage.trim()
      }

      await updateDoc(doc(db, "requests", managingRequest), updateData)

      // Create notification
      const request = requests.find((r) => r.id === managingRequest)
      if (request) {
        await addDoc(collection(db, "notifications"), {
          title: "Request Status Updated",
          message: `Your ${request.problemType} request has been updated to: ${newStatus}`,
          type: "status_update",
          timestamp: Timestamp.now(),
          read: false,
          requestId: managingRequest,
          branchCode: request.branchCode,
          isForManager: false,
        })
      }

      toast({
        title: "Status Updated ✅",
        description: "Request status has been updated successfully.",
      })

      setManagingRequest(null)
      setNewStatus("")
      setCompletionMessage("")
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update request status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const copyToClipboard = async (text: string, requestId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(requestId)
      toast({
        title: "Copied!",
        description: "Request ID copied to clipboard",
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "قيد المراجعة":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "تمت الموافقة":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "قيد التنفيذ":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "تم الإنجاز":
        return "bg-green-100 text-green-800 border-green-200"
      case "مرفوض":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "قيد المراجعة":
        return <Clock className="w-4 h-4" />
      case "تمت الموافقة":
        return <CheckCircle className="w-4 h-4" />
      case "قيد التنفيذ":
        return <AlertCircle className="w-4 h-4" />
      case "تم الإنجاز":
        return <CheckCircle className="w-4 h-4" />
      case "مرفوض":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
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

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return ""

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()

    const minutes = Math.floor(diffInMs / (1000 * 60))
    const hours = Math.floor(diffInMs / (1000 * 60 * 60))
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getUniqueValues = (key: keyof MaintenanceRequest) => {
    return [...new Set(requests.map((request) => request[key]).filter(Boolean))]
  }

  if (!user?.isManager) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-12">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Denied</h3>
              <p className="text-gray-500">Manager privileges required to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Loading requests...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const getRequestStats = () => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "قيد المراجعة").length,
      inProgress: requests.filter((r) => r.status === "قيد التنفيذ").length,
      completed: requests.filter((r) => r.status === "تم الإنجاز").length,
    }
  }

  const stats = getRequestStats()

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Manage Requests</h1>
            <p className="text-gray-600">Review and manage all maintenance requests</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm font-medium text-gray-600">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm font-medium text-gray-600">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                <div className="text-sm font-medium text-gray-600">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm font-medium text-gray-600">Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by ID, problem type, description, or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 lg:w-48">
                <Filter className="w-5 h-5 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="قيد المراجعة">Under Review</SelectItem>
                <SelectItem value="تمت الموافقة">Approved</SelectItem>
                <SelectItem value="قيد التنفيذ">In Progress</SelectItem>
                <SelectItem value="تم الإنجاز">Completed</SelectItem>
                <SelectItem value="مرفوض">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 lg:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 lg:w-48">
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {getUniqueValues("branchCode").map((branch) => (
                  <SelectItem key={branch} value={branch as string}>
                    Branch {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No requests found</h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || branchFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "No maintenance requests have been submitted yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{request.problemType}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(request.id!, request.id!)}
                              className="h-6 px-2 text-xs"
                            >
                              {copiedId === request.id ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span className="ml-1 font-mono">{request.id?.slice(-8)}</span>
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge
                              className={`${getStatusColor(request.status)} border rounded-full px-3 py-1 flex items-center gap-1`}
                            >
                              {getStatusIcon(request.status)}
                              <span className="font-medium">{getStatusText(request.status)}</span>
                            </Badge>
                            {request.priority && (
                              <Badge className={`${getPriorityColor(request.priority)} border rounded-full px-3 py-1`}>
                                {request.priority}
                              </Badge>
                            )}
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200 rounded-full px-3 py-1">
                              Branch {request.branchCode}
                            </Badge>
                            {request.rating && (
                              <Badge className="bg-yellow-50 text-yellow-800 border-yellow-200 rounded-full px-3 py-1">
                                ⭐ {request.rating}/5
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-full px-3 py-1 text-sm whitespace-nowrap">
                            {getTimeAgo(request.timestamp)}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 line-clamp-2 leading-relaxed">{request.description}</p>

                      {/* Completion message */}
                      {request.completionMessage && (
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                          <p className="text-sm font-medium text-green-800 mb-1">✅ Completion Message:</p>
                          <p className="text-sm text-green-700">{request.completionMessage}</p>
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(request.timestamp)}</span>
                        </div>
                        {request.imageUrl && (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-4 h-4" />
                            <span>Photo attached</span>
                          </div>
                        )}
                        {request.userEmail && (
                          <div className="flex items-center gap-1">
                            <span>By: {request.userEmail}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                              className="h-10 rounded-xl border-2"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Request Details</DialogTitle>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Request ID</label>
                                    <div className="mt-1 flex items-center gap-2">
                                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                                        {selectedRequest.id}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(selectedRequest.id!, selectedRequest.id!)}
                                        className="h-6 px-2"
                                      >
                                        {copiedId === selectedRequest.id ? (
                                          <Check className="w-3 h-3 text-green-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Problem Type</label>
                                    <p className="text-sm text-gray-900 mt-1">{selectedRequest.problemType}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <div className="mt-1">
                                      <Badge
                                        className={`${getStatusColor(selectedRequest.status)} border rounded-full px-3 py-1 flex items-center gap-1 w-fit`}
                                      >
                                        {getStatusIcon(selectedRequest.status)}
                                        <span className="font-medium">{getStatusText(selectedRequest.status)}</span>
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Priority</label>
                                    <div className="mt-1">
                                      <Badge
                                        className={`${getPriorityColor(selectedRequest.priority || "low")} border rounded-full px-3 py-1 w-fit`}
                                      >
                                        {selectedRequest.priority || "Not set"}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Branch Code</label>
                                    <p className="text-sm text-gray-900 mt-1">{selectedRequest.branchCode}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Submitted</label>
                                    <p className="text-sm text-gray-900 mt-1">
                                      {formatDate(selectedRequest.timestamp)}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-gray-700">Description</label>
                                  <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                                    {selectedRequest.description}
                                  </p>
                                </div>

                                {selectedRequest.imageUrl && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Attached Photo</label>
                                    <ImageViewer
                                      src={selectedRequest.imageUrl || "/placeholder.svg"}
                                      alt="Request attachment"
                                      className="mt-2 w-full h-64 object-cover rounded-xl border"
                                    />
                                  </div>
                                )}

                                {selectedRequest.completionMessage && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Completion Message</label>
                                    <div className="mt-2 p-4 bg-green-50 rounded-xl border border-green-200">
                                      <p className="text-sm text-green-700">{selectedRequest.completionMessage}</p>
                                    </div>
                                  </div>
                                )}

                                {selectedRequest.rating && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Customer Rating</label>
                                    <div className="mt-2 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">⭐</span>
                                        <span className="font-medium text-yellow-800">
                                          {selectedRequest.rating}/5 stars
                                        </span>
                                      </div>
                                      {selectedRequest.feedback && (
                                        <p className="text-sm text-gray-700">{selectedRequest.feedback}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setManagingRequest(request.id!)
                                setNewStatus(request.status)
                                setCompletionMessage(request.completionMessage || "")
                              }}
                              className="h-10 bg-blue-600 hover:bg-blue-700 rounded-xl"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>Manage Request</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Update Status</label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger className="h-12 rounded-xl border-2">
                                    <SelectValue placeholder="Select new status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="قيد المراجعة">Under Review</SelectItem>
                                    <SelectItem value="تمت الموافقة">Approved</SelectItem>
                                    <SelectItem value="قيد التنفيذ">In Progress</SelectItem>
                                    <SelectItem value="تم الإنجاز">Completed</SelectItem>
                                    <SelectItem value="مرفوض">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {newStatus === "تم الإنجاز" && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Completion Message (Optional)
                                  </label>
                                  <Textarea
                                    placeholder="Add a completion message for the user..."
                                    value={completionMessage}
                                    onChange={(e) => setCompletionMessage(e.target.value)}
                                    rows={4}
                                    className="rounded-xl border-2 resize-none"
                                  />
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setManagingRequest(null)
                                    setNewStatus("")
                                    setCompletionMessage("")
                                  }}
                                  disabled={updatingStatus}
                                  className="h-12 rounded-xl border-2 flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleStatusUpdate}
                                  disabled={!newStatus || updatingStatus}
                                  className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl flex-1"
                                >
                                  {updatingStatus ? (
                                    <div className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                      Updating...
                                    </div>
                                  ) : (
                                    "Update Status"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
