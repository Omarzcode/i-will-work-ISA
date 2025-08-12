"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/router" // Import router from next/router
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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function MyRequestsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter() // Declare router variable
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
          request.problemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    setFilteredRequests(filtered)
  }, [searchQuery, statusFilter, requests])

  const handleCancelRequest = async (requestId: string) => {
    setCancellingRequest(requestId)
    try {
      await deleteDoc(doc(db, "requests", requestId))
      toast({
        title: "Request Cancelled ✅",
        description: "Your request has been cancelled and removed.",
      })
    } catch (error) {
      console.error("Error cancelling request:", error)
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
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
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
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
            className={`w-6 h-6 cursor-pointer transition-colors lg:w-5 lg:h-5 ${
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">My Requests</h1>
              <p className="text-gray-600">Track and manage your maintenance requests</p>
            </div>

            {/* Stats Cards - Mobile optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6">
              <Card className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters - Mobile optimized */}
          <div className="mb-6 space-y-3 lg:space-y-0 lg:flex lg:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-base bg-white/80 backdrop-blur-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-base bg-white/80 backdrop-blur-sm lg:w-48">
                <Filter className="w-5 h-5 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="h-12 text-base">
                  All Status
                </SelectItem>
                <SelectItem value="قيد المراجعة" className="h-12 text-base">
                  Under Review
                </SelectItem>
                <SelectItem value="تمت الموافقة" className="h-12 text-base">
                  Approved
                </SelectItem>
                <SelectItem value="قيد التنفيذ" className="h-12 text-base">
                  In Progress
                </SelectItem>
                <SelectItem value="تم الإنجاز" className="h-12 text-base">
                  Completed
                </SelectItem>
                <SelectItem value="مرفوض" className="h-12 text-base">
                  Rejected
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requests List - Mobile optimized */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 lg:p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No requests found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "You haven't submitted any requests yet"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button
                      onClick={() => router.push("/create-request")}
                      className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 px-6"
                    >
                      Create Your First Request
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card
                  key={request.id}
                  className="rounded-3xl border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{request.problemType}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge
                              className={`${getStatusColor(request.status)} border rounded-full px-3 py-1 flex items-center gap-1`}
                            >
                              {getStatusIcon(request.status)}
                              <span className="font-medium">{getStatusText(request.status)}</span>
                            </Badge>
                            {request.rating && (
                              <Badge className="bg-yellow-50 text-yellow-800 border-yellow-200 rounded-full px-3 py-1 flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{request.rating}/5</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 line-clamp-2 leading-relaxed">{request.description}</p>

                      {/* Completion message */}
                      {request.completionMessage && (
                        <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                          <p className="text-sm font-medium text-green-800 mb-1">✅ Completion Message:</p>
                          <p className="text-sm text-green-700">{request.completionMessage}</p>
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(request.timestamp)}</span>
                        </div>
                        {request.imageUrl && (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-4 h-4" />
                            <span>Photo</span>
                          </div>
                        )}
                      </div>

                      {/* Actions - Mobile optimized */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                              className="h-10 rounded-2xl border-2 flex-1 lg:flex-none"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="mx-4 max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl">Request Details</DialogTitle>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Problem Type</label>
                                    <p className="text-base text-gray-900 mt-1">{selectedRequest.problemType}</p>
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
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Description</label>
                                  <p className="text-base text-gray-900 mt-2 leading-relaxed">
                                    {selectedRequest.description}
                                  </p>
                                </div>
                                {selectedRequest.imageUrl && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Attached Photo</label>
                                    <img
                                      src={selectedRequest.imageUrl || "/placeholder.svg"}
                                      alt="Request attachment"
                                      className="mt-2 w-full h-64 object-cover rounded-2xl border"
                                    />
                                  </div>
                                )}
                                {selectedRequest.completionMessage && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Completion Message</label>
                                    <div className="mt-2 p-4 bg-green-50 rounded-2xl border border-green-200">
                                      <p className="text-sm text-green-700">{selectedRequest.completionMessage}</p>
                                    </div>
                                  </div>
                                )}
                                {selectedRequest.rating && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Your Rating & Feedback</label>
                                    <div className="mt-2 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
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
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {/* Cancel Request Button */}
                        {canCancelRequest(request.status) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="h-10 rounded-2xl flex-1 lg:flex-none">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="mx-4 rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this request? This action cannot be undone and the
                                  request will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col gap-3 sm:flex-row">
                                <AlertDialogCancel className="h-12 rounded-2xl">Keep Request</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelRequest(request.id!)}
                                  disabled={cancellingRequest === request.id}
                                  className="bg-red-600 hover:bg-red-700 h-12 rounded-2xl"
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
                                className="bg-green-600 hover:bg-green-700 h-10 rounded-2xl flex-1 lg:flex-none"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                {request.rating ? "Update Rating" : "Rate Service"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="mx-4 rounded-3xl">
                              <DialogHeader>
                                <DialogTitle>Rate Service</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div>
                                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                                    How would you rate this service?
                                  </label>
                                  <div className="flex justify-center">{renderStars(rating, true)}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Additional Feedback (Optional)
                                  </label>
                                  <Textarea
                                    placeholder="Share your experience..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                    className="rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-base resize-none"
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
                                    className="h-12 rounded-2xl border-2 flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleRatingSubmit}
                                    disabled={rating === 0 || submittingRating}
                                    className="h-12 bg-green-600 hover:bg-green-700 rounded-2xl flex-1"
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
