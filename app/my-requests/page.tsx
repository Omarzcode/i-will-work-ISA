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
import { Search, Calendar, ImageIcon, Star, Trash2, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function MyRequestsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [cancellingRequest, setCancellingRequest] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      const requestsQuery = query(
        collection(db, "requests"),
        where("userId", "==", user.uid),
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

  const handleRatingSubmit = async (requestId: string) => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingRating(true)
    try {
      await updateDoc(doc(db, "requests", requestId), {
        rating: rating,
        feedback: feedback.trim() || null,
      })
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      })
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
      setIsSubmittingRating(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    setCancellingRequest(requestId)
    try {
      await deleteDoc(doc(db, "requests", requestId))
      toast({
        title: "Request Cancelled",
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

  const renderStars = (currentRating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 cursor-pointer transition-colors ${
              star <= currentRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"
            }`}
            onClick={() => interactive && onStarClick && onStarClick(star)}
          />
        ))}
      </div>
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

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
            <p className="text-gray-600 mt-2">Track your maintenance requests</p>
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
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No requests found</p>
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
                          {request.rating && (
                            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                              <Star className="w-4 h-4 fill-green-500 text-green-500" />
                              <span className="text-sm font-medium text-green-700">Rated {request.rating}/5</span>
                            </div>
                          )}
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>

                        {/* Show completion message if available */}
                        {request.completionMessage && (
                          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
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
                          {/* Cancel Request Button */}
                          {canCancelRequest(request.status) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Cancel Request
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Request</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this request? This action cannot be undone and the
                                    request will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelRequest(request.id!)}
                                    disabled={cancellingRequest === request.id}
                                    className="bg-red-600 hover:bg-red-700"
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
                                  variant={request.rating ? "outline" : "default"}
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setRating(request.rating || 0)
                                    setFeedback(request.feedback || "")
                                  }}
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  {request.rating ? "Update Rating" : "Rate Service"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rate Your Service Experience</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                      How would you rate the service?
                                    </label>
                                    {renderStars(rating, true, setRating)}
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                      Additional feedback (optional)
                                    </label>
                                    <Textarea
                                      placeholder="Share your experience..."
                                      value={feedback}
                                      onChange={(e) => setFeedback(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      onClick={() => handleRatingSubmit(selectedRequest?.id!)}
                                      disabled={isSubmittingRating || rating === 0}
                                    >
                                      {isSubmittingRating ? "Submitting..." : "Submit Rating"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
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
