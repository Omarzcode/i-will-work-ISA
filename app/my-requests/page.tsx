"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Search,
  Calendar,
  ImageIcon,
  FileText,
  Star,
  Trash2,
  Eye,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Copy,
  Check,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function MyRequestsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingRequest, setCancellingRequest] = useState<string | null>(null)
  const [ratingRequest, setRatingRequest] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [submittingRating, setSubmittingRating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      const requestsQuery = query(
        collection(db, "requests"),
        where("branchCode", "==", user.branchCode),
        orderBy("timestamp", "desc"),
      )

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
          request.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.problemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    setFilteredRequests(filtered)
  }, [searchQuery, statusFilter, requests])

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

  const handleCancelRequest = async (requestId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to cancel requests.",
        variant: "destructive",
      })
      return
    }

    setCancellingRequest(requestId)
    try {
      await deleteDoc(doc(db, "requests", requestId))

      toast({
        title: "Request Cancelled ✅",
        description: "Your request has been cancelled and removed.",
      })
    } catch (error: any) {
      console.error("Error cancelling request:", error)

      let errorMessage = "Failed to cancel request. Please try again."

      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to cancel this request. It may have already been processed."
      } else if (error.code === "not-found") {
        errorMessage = "Request not found. It may have already been cancelled."
      } else if (error.code === "unauthenticated") {
        errorMessage = "Please log in again to cancel this request."
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setCancellingRequest(null)
    }
  }

  const handleRatingSubmit = async () => {
    if (!ratingRequest || rating === 0) return

    setSubmittingRating(true)
    try {
      await updateDoc(doc(db, "requests", ratingRequest), {
        rating: rating,
        feedback: feedback.trim() || null,
      })

      toast({
        title: "Rating Submitted 🌟",
        description: "Thank you for your feedback!",
      })

      setRatingRequest(null)
      setRating(0)
      setFeedback("")
    } catch (error: any) {
      console.error("Error submitting rating:", error)

      let errorMessage = "Failed to submit rating. Please try again."
      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to rate this request."
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmittingRating(false)
    }
  }

  const openRatingDialog = (request: MaintenanceRequest) => {
    setRatingRequest(request.id!)
    setRating(request.rating || 0)
    setFeedback(request.feedback || "")
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
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    if (weeks < 4) return `${weeks}w ago`
    if (months < 12) return `${months}mo ago`

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const canCancelRequest = (status: string) => {
    return status === "قيد المراجعة" || status === "تمت الموافقة"
  }

  const canRateRequest = (status: string) => {
    return status === "تم الإنجاز"
  }

  const renderStars = (currentRating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 sm:w-6 sm:h-6 cursor-pointer transition-colors ${
              star <= currentRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"
            }`}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Loading your requests...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const stats = getRequestStats()

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-gray-50">
        <div className="px-3 sm:px-6 lg:px-8 py-4 lg:py-8">
          {/* Header with stats - Mobile optimized */}
          <div className="mb-6">
            <div className="text-center lg:text-left mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">My Requests</h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                Track and manage your maintenance requests
              </p>
            </div>

            {/* Stats Cards - Mobile optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-6">
              <Card className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-xs font-medium text-gray-600">Total</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-xs font-medium text-gray-600">Pending</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">{stats.inProgress}</div>
                  <div className="text-xs font-medium text-gray-600">In Progress</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-xs font-medium text-gray-600">Completed</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters - Mobile optimized */}
          <div className="mb-6 space-y-3 lg:space-y-0 lg:flex lg:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                type="text"
                placeholder="Search by ID, problem type, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 lg:pl-12 h-9 sm:h-10 lg:h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-xs sm:text-sm bg-white/80 backdrop-blur-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 sm:h-10 lg:h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-xs sm:text-sm bg-white/80 backdrop-blur-sm lg:w-48">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="h-9 sm:h-10 lg:h-12 text-xs sm:text-sm">
                  All Status
                </SelectItem>
                <SelectItem value="قيد المراجعة" className="h-9 sm:h-10 lg:h-12 text-xs sm:text-sm">
                  Under Review
                </SelectItem>
                <SelectItem value="تمت الموافقة" className="h-9 sm:h-10 lg:h-12 text-xs sm:text-sm">
                  Approved
                </SelectItem>
                <SelectItem value="قيد التنفيذ" className="h-9 sm:h-10 lg:h-12 text-xs sm:text-sm">
                  In Progress
                </SelectItem>
                <SelectItem value="تم الإنجاز" className="h-9 sm:h-10 lg:h-12 text-xs sm:text-sm">
                  Completed
                </SelectItem>
                <SelectItem value="مرفوض" className="h-9 sm:h-10 lg:h-12 text-xs sm:text-sm">
                  Rejected
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requests List - Mobile optimized */}
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            {filteredRequests.length === 0 ? (
              <Card className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 mb-2">
                    No requests found
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-500 mb-4">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "You haven't submitted any requests yet"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Link href="/create-request">
                      <Button className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-8 sm:h-9 lg:h-10 px-4 sm:px-6 text-sm sm:text-sm lg:text-base">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Request
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card
                  key={request.id}
                  className="rounded-3xl border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm"
                >
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                              {request.problemType}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(request.id!, request.id!)}
                              className="h-6 px-2 text-xs rounded-lg"
                              title="Copy Request ID"
                            >
                              {copiedId === request.id ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span className="ml-1 font-mono text-xs">#{request.id?.slice(-8)}</span>
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge
                              className={`${getStatusColor(request.status)} border rounded-full px-2 sm:px-3 py-1 flex items-center gap-1 text-xs`}
                            >
                              {getStatusIcon(request.status)}
                              <span className="font-medium">{getStatusText(request.status)}</span>
                            </Badge>
                            {request.rating && (
                              <Badge className="bg-yellow-50 text-yellow-800 border-yellow-200 rounded-full px-2 sm:px-3 py-1 flex items-center gap-1 text-xs">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{request.rating}/5</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-full px-2 sm:px-3 py-1 text-xs whitespace-nowrap font-medium">
                            {getTimeAgo(request.timestamp)}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm lg:text-base text-gray-600 line-clamp-2 leading-relaxed">
                        {request.description}
                      </p>

                      {/* Completion message */}
                      {request.completionMessage && (
                        <div className="p-3 sm:p-4 bg-green-50 rounded-2xl border border-green-200">
                          <p className="text-xs sm:text-sm font-medium text-green-800 mb-1">✅ Completion Message:</p>
                          <p className="text-xs sm:text-sm text-green-700">{request.completionMessage}</p>
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-1 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(request.timestamp)}</span>
                        </div>
                        {request.imageUrl && (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>Photo</span>
                          </div>
                        )}
                      </div>

                      {/* Actions - Mobile optimized */}
                      <div className="flex flex-col gap-2 sm:w-auto sm:flex-row">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                              className="h-8 sm:h-9 lg:h-10 rounded-2xl border-2 text-xs sm:text-sm w-full"
                            >
                              <Eye className="w-3 h-3 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="mx-4 max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-base sm:text-lg lg:text-xl">Request Details</DialogTitle>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs font-medium text-gray-700">Request ID</label>
                                    <div className="mt-1 flex items-center gap-2">
                                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
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
                                    <label className="text-xs font-medium text-gray-700">Problem Type</label>
                                    <p className="text-xs sm:text-sm text-gray-900 mt-1">
                                      {selectedRequest.problemType}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-700">Status</label>
                                    <div className="mt-1">
                                      <Badge
                                        className={`${getStatusColor(selectedRequest.status)} border rounded-full px-3 py-1 flex items-center gap-1 w-fit text-xs`}
                                      >
                                        {getStatusIcon(selectedRequest.status)}
                                        <span className="font-medium">{getStatusText(selectedRequest.status)}</span>
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-700">Description</label>
                                  <p className="text-xs sm:text-sm text-gray-900 mt-2 leading-relaxed">
                                    {selectedRequest.description}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-700">Submitted</label>
                                  <div className="mt-1 flex items-center gap-2">
                                    <p className="text-xs sm:text-sm text-gray-900">
                                      {formatDate(selectedRequest.timestamp)}
                                    </p>
                                    <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-full px-2 py-1 text-xs whitespace-nowrap font-medium">
                                      {getTimeAgo(selectedRequest.timestamp)}
                                    </Badge>
                                  </div>
                                </div>
                                {selectedRequest.imageUrl && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-700">Attached Photo</label>
                                    <img
                                      src={selectedRequest.imageUrl || "/placeholder.svg"}
                                      alt="Request attachment"
                                      className="mt-2 w-full h-48 sm:h-64 object-cover rounded-2xl border"
                                    />
                                  </div>
                                )}
                                {selectedRequest.completionMessage && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-700">Completion Message</label>
                                    <div className="mt-2 p-3 sm:p-4 bg-green-50 rounded-2xl border border-green-200">
                                      <p className="text-xs sm:text-sm text-green-700">
                                        {selectedRequest.completionMessage}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {selectedRequest.rating && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-700">Your Rating & Feedback</label>
                                    <div className="mt-2 p-3 sm:p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        {renderStars(selectedRequest.rating)}
                                        <span className="text-xs font-medium text-yellow-800">
                                          ({selectedRequest.rating}/5)
                                        </span>
                                      </div>
                                      {selectedRequest.feedback && (
                                        <p className="text-xs sm:text-sm text-gray-700">{selectedRequest.feedback}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {/* Cancel Request Button */}
                        {canCancelRequest(request.status) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 sm:h-9 lg:h-10 rounded-2xl text-xs sm:text-sm w-full"
                                disabled={cancellingRequest === request.id}
                              >
                                <Trash2 className="w-3 h-3 mr-2" />
                                {cancellingRequest === request.id ? "Cancelling..." : "Cancel"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="mx-4 rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-base sm:text-lg">Cancel Request</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs sm:text-base">
                                  Are you sure you want to cancel this request? This action cannot be undone and the
                                  request will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col gap-3 sm:flex-row">
                                <AlertDialogCancel className="h-10 sm:h-9 lg:h-10 rounded-2xl text-xs sm:text-sm">
                                  Keep Request
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelRequest(request.id!)}
                                  disabled={cancellingRequest === request.id}
                                  className="bg-red-600 hover:bg-red-700 h-10 sm:h-9 lg:h-10 rounded-2xl text-xs sm:text-sm"
                                >
                                  {cancellingRequest === request.id ? "Cancelling..." : "Cancel Request"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Rate Service Button */}
                        {canRateRequest(request.status) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => openRatingDialog(request)}
                                className="bg-green-600 hover:bg-green-700 h-8 sm:h-9 lg:h-10 rounded-2xl text-xs sm:text-sm w-full"
                              >
                                <Star className="w-3 h-3 mr-2" />
                                {request.rating ? "Update Rating" : "Rate Service"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="mx-4 rounded-3xl">
                              <DialogHeader>
                                <DialogTitle className="text-base sm:text-lg lg:text-xl">Rate Service</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 sm:space-y-6">
                                <div>
                                  <label className="text-xs font-medium text-gray-700 mb-3 block">
                                    How would you rate this service?
                                  </label>
                                  <div className="flex justify-center">{renderStars(rating, true)}</div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                                    Additional Feedback (Optional)
                                  </label>
                                  <Textarea
                                    placeholder="Share your experience..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                    className="rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-xs sm:text-sm resize-none"
                                  />
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setRatingRequest(null)
                                      setRating(0)
                                      setFeedback("")
                                    }}
                                    disabled={submittingRating}
                                    className="h-10 sm:h-9 lg:h-10 rounded-2xl border-2 flex-1 text-xs sm:text-sm"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleRatingSubmit}
                                    disabled={rating === 0 || submittingRating}
                                    className="h-10 sm:h-9 lg:h-10 bg-green-600 hover:bg-green-700 rounded-2xl flex-1 text-xs sm:text-sm"
                                  >
                                    {submittingRating ? (
                                      <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Submitting...
                                      </div>
                                    ) : (
                                      "Submit Rating"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
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
