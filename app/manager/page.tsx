"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/hooks/useNotifications"
import { useToast } from "@/hooks/use-toast"
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ImageIcon,
  ArrowRight,
  Play,
  Check,
  Search,
  Copy,
  X,
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
      return <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
    case "high":
      return <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
    case "medium":
      return <Flag className="w-3 h-3 sm:w-4 sm:h-4" />
    case "low":
      return <Circle className="w-3 h-3 sm:w-4 sm:h-4" />
    default:
      return <Circle className="w-3 h-3 sm:w-4 sm:h-4" />
  }
}

const getPriorityColor = (priority: string) => {
  const priorityOption = PRIORITY_OPTIONS.find((p) => p.value === priority)
  return priorityOption?.color || "bg-gray-100 text-gray-800 border-gray-200"
}

// Time ago function
const getTimeAgo = (timestamp: any) => {
  if (!timestamp) return "Unknown"

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`
  if (diffInMonths < 12) return `${diffInMonths}mo ago`

  return date.toLocaleDateString()
}

// Get next status in the workflow
const getNextStatus = (currentStatus: string) => {
  switch (currentStatus) {
    case "قيد المراجعة":
      return { status: "معتمد", label: "Approve", icon: CheckCircle, color: "bg-green-600 hover:bg-green-700" }
    case "معتمد":
      return { status: "قيد التنفيذ", label: "Start Work", icon: Play, color: "bg-blue-600 hover:bg-blue-700" }
    case "قيد التنفيذ":
      return { status: "مكتمل", label: "Complete", icon: Check, color: "bg-green-600 hover:bg-green-700" }
    default:
      return null
  }
}

// Get reject option for pending requests
const getRejectOption = (currentStatus: string) => {
  if (currentStatus === "قيد المراجعة") {
    return { status: "مرفوض", label: "Reject", icon: XCircle, color: "bg-red-600 hover:bg-red-700" }
  }
  return null
}

// Image Viewer Component
const ImageViewer = ({
  isOpen,
  onClose,
  src,
  alt,
}: {
  isOpen: boolean
  onClose: () => void
  src: string
  alt: string
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[99999] p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>,
    document.body,
  )
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
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)

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

  // Copy request ID to clipboard
  const copyRequestId = async (requestId: string) => {
    try {
      await navigator.clipboard.writeText(requestId)
      toast({
        title: "✅ Copied",
        description: "Request ID copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to copy request ID",
        variant: "destructive",
      })
    }
  }

  // Open image viewer
  const openImageViewer = (src: string, alt: string) => {
    console.log("Opening image viewer with:", src, alt) // Debug log
    setSelectedImage({ src, alt })
    setImageViewerOpen(true)
  }

  // Close image viewer
  const closeImageViewer = () => {
    setImageViewerOpen(false)
    setSelectedImage(null)
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
            rating: data.rating || 0,
            feedback: data.feedback || "",
            userEmail: data.userEmail || "",
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
    setUpdatingRequest(requestId)
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
    } finally {
      setUpdatingRequest(null)
    }
  }

  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    if (statusOption) {
      const IconComponent = statusOption.icon
      return <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />
    }
    return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
  }

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    return statusOption?.color || "bg-gray-100 text-gray-800"
  }

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const matchesId = request.id?.toLowerCase().includes(query)
      const matchesProblemType = request.problemType.toLowerCase().includes(query)
      const matchesDescription = request.description.toLowerCase().includes(query)
      const matchesBranch = request.branchCode.toLowerCase().includes(query)

      if (!matchesId && !matchesProblemType && !matchesDescription && !matchesBranch) {
        return false
      }
    }

    // Other filters
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-sm sm:text-base text-gray-600">You need manager privileges to access this page.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">Loading requests...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <>
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-gray-50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
            {/* Header - Mobile Optimized */}
            <div className="space-y-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600 mb-3">Manage maintenance requests from all branches</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 rounded-full px-2 py-1 text-xs sm:px-3 sm:text-sm">
                    Manager View
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full px-2 py-1 text-xs sm:px-3 sm:text-sm">
                    {filteredRequests.length} Requests
                  </Badge>
                </div>
              </div>
              <div className="w-full">
                <Button
                  onClick={cleanupOldRequests}
                  variant="outline"
                  className="w-full sm:w-auto rounded-2xl border-2 hover:bg-red-50 hover:border-red-200 bg-transparent text-sm h-10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clean Old Requests
                </Button>
              </div>
            </div>

            {/* Search and Filters - Mobile Optimized */}
            <Card className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm mb-6">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Search by Request ID, Problem Type, Description, or Branch
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-2xl border-2 h-10 sm:h-11 text-sm"
                      />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="rounded-2xl border-2 h-10 sm:h-11 text-sm">
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
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="rounded-2xl border-2 h-10 sm:h-11 text-sm">
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

                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Branch</label>
                      <Select value={branchFilter} onValueChange={setBranchFilter}>
                        <SelectTrigger className="rounded-2xl border-2 h-10 sm:h-11 text-sm">
                          <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          {uniqueBranches.map((branch) => (
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requests Grid - Mobile Optimized */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredRequests.map((request) => {
                const nextStatus = getNextStatus(request.status)
                const rejectOption = getRejectOption(request.status)

                return (
                  <Card key={request.id} className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                            {request.problemType}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full px-2 py-1 text-xs flex items-center gap-1 flex-shrink-0">
                              <MapPin className="w-3 h-3" />
                              {request.branchCode}
                            </Badge>
                            <Badge
                              className={`${getPriorityColor(request.priority || "medium")} border rounded-full px-2 py-1 text-xs flex items-center gap-1 flex-shrink-0`}
                            >
                              {getPriorityIcon(request.priority || "medium")}
                              <span className="truncate">
                                {PRIORITY_OPTIONS.find((p) => p.value === request.priority)?.label || "Medium"}
                              </span>
                            </Badge>
                          </div>
                          {/* Request ID */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">ID:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 truncate max-w-24">
                              {request.id?.slice(-8)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyRequestId(request.id || "")}
                              className="h-6 w-6 p-0 hover:bg-gray-200"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {/* Time ago badge - positioned in top right */}
                        <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-full px-2 py-1 text-xs flex-shrink-0 whitespace-nowrap">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(request.timestamp)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                        {request.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge
                          className={`${getStatusColor(request.status)} border rounded-full px-2 py-1 text-xs flex items-center gap-1 flex-shrink-0`}
                        >
                          {getStatusIcon(request.status)}
                          <span className="truncate">
                            {statusOptions.find((s) => s.value === request.status)?.label || request.status}
                          </span>
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {request.imageUrl && (
                            <button
                              onClick={() => openImageViewer(request.imageUrl!, `${request.problemType} image`)}
                              className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span className="hidden sm:inline">Photo</span>
                            </button>
                          )}
                          {request.rating && request.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span>{request.rating}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="hidden sm:inline">
                              {request.timestamp?.toDate?.()?.toLocaleDateString() || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Action Buttons - Mobile Optimized */}
                      <div className="space-y-2">
                        {nextStatus && (
                          <Button
                            onClick={() => updateRequestStatus(request.id!, nextStatus.status, request)}
                            disabled={updatingRequest === request.id}
                            className={`${nextStatus.color} text-white rounded-2xl text-xs sm:text-sm h-10 w-full flex items-center justify-center gap-2`}
                          >
                            {updatingRequest === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                              <>
                                <nextStatus.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                {nextStatus.label}
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                              </>
                            )}
                          </Button>
                        )}

                        {rejectOption && (
                          <Button
                            onClick={() => updateRequestStatus(request.id!, rejectOption.status, request)}
                            disabled={updatingRequest === request.id}
                            variant="outline"
                            className={`${rejectOption.color} text-white border-red-600 rounded-2xl text-xs sm:text-sm h-10 w-full flex items-center justify-center gap-2`}
                          >
                            {updatingRequest === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                            ) : (
                              <>
                                <rejectOption.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                {rejectOption.label}
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-2xl border-2 bg-transparent text-xs sm:text-sm h-10"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">View Details</span>
                              <span className="sm:hidden">Details</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="mx-4 max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-lg sm:text-xl font-semibold">Request Details</DialogTitle>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="sm:col-span-2">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                      Request ID
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm bg-gray-100 px-3 py-2 rounded-lg font-mono text-gray-700 flex-1">
                                        {selectedRequest.id}
                                      </code>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyRequestId(selectedRequest.id || "")}
                                        className="h-10 px-3"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                      Problem Type
                                    </label>
                                    <p className="text-sm sm:text-base text-gray-900">{selectedRequest.problemType}</p>
                                  </div>
                                  <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                      Branch
                                    </label>
                                    <p className="text-sm sm:text-base text-gray-900">{selectedRequest.branchCode}</p>
                                  </div>
                                  <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                      Priority
                                    </label>
                                    <Badge
                                      className={`${getPriorityColor(selectedRequest.priority || "medium")} border rounded-full px-2 py-1 text-xs`}
                                    >
                                      {getPriorityIcon(selectedRequest.priority || "medium")}
                                      <span className="ml-1">
                                        {PRIORITY_OPTIONS.find((p) => p.value === selectedRequest.priority)?.label ||
                                          "Medium"}
                                      </span>
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                      Current Status
                                    </label>
                                    <Badge
                                      className={`${getStatusColor(selectedRequest.status)} border rounded-full px-2 py-1 text-xs`}
                                    >
                                      {getStatusIcon(selectedRequest.status)}
                                      <span className="ml-1">
                                        {statusOptions.find((s) => s.value === selectedRequest.status)?.label}
                                      </span>
                                    </Badge>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                      Submitted
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm sm:text-base text-gray-900">
                                        {selectedRequest.timestamp?.toDate?.()?.toLocaleDateString() || "N/A"}
                                      </p>
                                      <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-full px-2 py-1 text-xs">
                                        {getTimeAgo(selectedRequest.timestamp)}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Description
                                  </label>
                                  <p className="text-sm sm:text-base text-gray-900 bg-gray-50 p-3 sm:p-4 rounded-2xl leading-relaxed">
                                    {selectedRequest.description}
                                  </p>
                                </div>

                                {selectedRequest.imageUrl && (
                                  <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                      Attached Image
                                    </label>
                                    <img
                                      src={selectedRequest.imageUrl || "/placeholder.svg"}
                                      alt="Request attachment"
                                      className="w-full h-64 object-cover rounded-2xl border cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() =>
                                        openImageViewer(
                                          selectedRequest.imageUrl!,
                                          `${selectedRequest.problemType} image`,
                                        )
                                      }
                                    />
                                  </div>
                                )}

                                {selectedRequest.rating && selectedRequest.rating > 0 && (
                                  <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                      User Rating
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <span
                                            key={star}
                                            className={`text-lg ${
                                              star <= (selectedRequest.rating || 0)
                                                ? "text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          >
                                            ★
                                          </span>
                                        ))}
                                      </div>
                                      <span className="text-sm text-gray-600">{selectedRequest.rating}/5 stars</span>
                                    </div>
                                    {selectedRequest.feedback && (
                                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">
                                        "{selectedRequest.feedback}"
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div>
                                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Update Status
                                  </label>
                                  <Select
                                    value={selectedRequest.status}
                                    onValueChange={(newStatus) =>
                                      updateRequestStatus(selectedRequest.id!, newStatus, selectedRequest)
                                    }
                                  >
                                    <SelectTrigger className="rounded-2xl border-2 h-10 sm:h-11">
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
                )
              })}
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Requests Found</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {searchQuery.trim()
                    ? "No maintenance requests match your search query."
                    : "No maintenance requests match your current filters."}
                </p>
              </div>
            )}
          </div>
        </div>
      </AppLayout>

      {/* Image Viewer - Rendered outside AppLayout using Portal */}
      {selectedImage && (
        <ImageViewer
          isOpen={imageViewerOpen}
          onClose={closeImageViewer}
          src={selectedImage.src || "/placeholder.svg"}
          alt={selectedImage.alt}
        />
      )}
    </>
  )
}
