"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, orderBy, where, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import type { MaintenanceRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, FileText, Calendar, ImageIcon, Star, X, MessageSquare, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function MyRequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      try {
        const requestsQuery = query(
          collection(db, "requests"),
          where("branchCode", "==", user.branchCode),
          orderBy("timestamp", "desc"),
        )

        const unsubscribe = onSnapshot(
          requestsQuery,
          (snapshot) => {
            const requestsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as MaintenanceRequest[]

            setRequests(requestsData)
            setFilteredRequests(requestsData)
            setIsLoading(false)
            setError(null)
          },
          (error) => {
            console.error("Firestore error:", error)
            setError("Failed to load requests. Please check your internet connection and try again.")
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
  }, [user])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRequests(requests)
    } else {
      const filtered = requests.filter(
        (request) =>
          request.problemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.status.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredRequests(filtered)
    }
  }, [searchQuery, requests])

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
      case "ملغي":
        return "bg-gray-100 text-gray-800"
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
      case "ملغي":
        return "Cancelled"
      default:
        return status
    }
  }

  const handleRatingSubmit = async () => {
    if (!selectedRequest || !selectedRequest.id || rating === 0) return

    try {
      await updateDoc(doc(db, "requests", selectedRequest.id), {
        rating,
        feedback: feedback.trim(),
      })

      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      })

      setIsRatingDialogOpen(false)
      setRating(0)
      setFeedback("")
      setSelectedRequest(null)
    } catch (error) {
      console.error("Rating submission error:", error)
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancelRequest = async () => {
    if (!selectedRequest || !selectedRequest.id || !cancelReason.trim()) return

    try {
      await updateDoc(doc(db, "requests", selectedRequest.id), {
        status: "ملغي",
        cancelReason: cancelReason.trim(),
      })

      toast({
        title: "Request cancelled",
        description: "Your request has been cancelled successfully.",
      })

      setIsCancelDialogOpen(false)
      setCancelReason("")
      setSelectedRequest(null)
    } catch (error) {
      console.error("Cancel request error:", error)
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const canCancelRequest = (status: string) => {
    return status === "قيد المراجعة" || status === "تمت الموافقة"
  }

  const canRateRequest = (request: MaintenanceRequest) => {
    return request.status === "تم الإنجاز" && !request.rating
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
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
      {/* Header - Removed back button that was causing logout */}
      <div className="bg-gradient-to-r from-sky-300 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <h1 className="text-2xl font-bold">My Requests</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{searchQuery ? "No requests match your search" : "No requests found"}</p>
                {!searchQuery && (
                  <Button onClick={() => router.push("/create-request")} className="mt-4 bg-blue-600 hover:bg-blue-700">
                    Create Your First Request
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{request.problemType}</h3>
                        <Badge className={getStatusColor(request.status)}>{getStatusText(request.status)}</Badge>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>

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

                      {request.rating && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= request.rating! ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">Rated {request.rating}/5</span>
                        </div>
                      )}

                      {request.feedback && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Your Feedback</span>
                          </div>
                          <p className="text-sm text-gray-600">{request.feedback}</p>
                        </div>
                      )}

                      {request.cancelReason && (
                        <div className="bg-red-50 p-3 rounded-lg mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <X className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-red-700">Cancellation Reason</span>
                          </div>
                          <p className="text-sm text-red-600">{request.cancelReason}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {canRateRequest(request) && (
                          <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Star className="w-4 h-4 mr-1" />
                                Rate Service
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        )}

                        {canCancelRequest(request.status) && (
                          <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel Request
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </div>

                  {request.imageUrl && (
                    <div className="mt-4">
                      <img
                        src={request.imageUrl || "/placeholder.svg"}
                        alt="Request attachment"
                        className="w-full max-w-md h-48 object-cover rounded-lg border"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement
                          target.src = "/placeholder.svg?height=200&width=300&text=Image+Not+Found"
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Service Experience</DialogTitle>
            <DialogDescription>
              Please rate the quality of service you received and share any additional feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">How would you rate the service?</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-8 h-8 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Additional Comments (Optional)</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRatingSubmit} disabled={rating === 0} className="bg-green-600 hover:bg-green-700">
                Submit Rating
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Request</DialogTitle>
            <DialogDescription>
              This action will cancel your maintenance request. Please provide a reason for the cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this request? Please provide a reason for cancellation.
            </p>
            <div>
              <label className="text-sm font-medium mb-2 block">Reason for Cancellation</label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Problem resolved on its own, No longer needed..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                Keep Request
              </Button>
              <Button onClick={handleCancelRequest} disabled={!cancelReason.trim()} variant="destructive">
                Cancel Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
