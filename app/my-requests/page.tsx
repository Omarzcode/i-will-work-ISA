"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore"
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
import { Search, FileText, Calendar, ImageIcon, Trash2, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function MyRequestsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [ratingData, setRatingData] = useState<{ [key: string]: { rating: number; feedback: string } }>({})
  const [submittingRating, setSubmittingRating] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      const requestsQuery = query(
        collection(db, "requests"),
        where("userId", "==", user.id),
        orderBy("timestamp", "desc"),
      )

      const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        const requestsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MaintenanceRequest[]

        setRequests(requestsData)

        // Initialize rating data for completed requests
        const initialRatingData: { [key: string]: { rating: number; feedback: string } } = {}
        requestsData.forEach((request) => {
          if (request.id) {
            initialRatingData[request.id] = {
              rating: request.rating || 0,
              feedback: request.feedback || "",
            }
          }
        })
        setRatingData(initialRatingData)

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
    setCancellingId(requestId)
    try {
      await deleteDoc(doc(db, "requests", requestId))
      toast({
        title: "Request Cancelled",
        description: "Your maintenance request has been cancelled and removed.",
      })
    } catch (error) {
      console.error("Error cancelling request:", error)
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCancellingId(null)
    }
  }

  const handleRatingSubmit = async (requestId: string) => {
    const data = ratingData[requestId]
    if (!data || data.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      })
      return
    }

    setSubmittingRating(requestId)
    try {
      await updateDoc(doc(db, "requests", requestId), {
        rating: data.rating,
        feedback: data.feedback.trim() || null,
      })
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      })
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingRating(null)
    }
  }

  const updateRating = (requestId: string, rating: number) => {
    setRatingData((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        rating,
      },
    }))
  }

  const updateFeedback = (requestId: string, feedback: string) => {
    setRatingData((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        feedback,
      },
    }))
  }

  const canCancelRequest = (status: string) => {
    return status === "قيد المراجعة" || status === "تمت الموافقة"
  }

  const canRateRequest = (status: string) => {
    return status === "تم الإنجاز"
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

  const renderStars = (requestId: string, currentRating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= currentRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={interactive ? () => updateRating(requestId, star) : undefined}
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
            <p className="text-gray-600 mt-2">Track and manage your maintenance requests</p>
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
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-green-800">Rated {request.rating}/5</span>
                            </div>
                          )}
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

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Cancel Request Button */}
                          {canCancelRequest(request.status) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" disabled={cancellingId === request.id}>
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {cancellingId === request.id ? "Cancelling..." : "Cancel Request"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Request</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this maintenance request? This action cannot be
                                    undone and the request will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelRequest(request.id!)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Cancel Request
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Rate Service Button */}
                          {canRateRequest(request.status) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Star className="w-4 h-4 mr-1" />
                                  {request.rating ? "Update Rating" : "Rate Service"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Rate Our Service</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                      How would you rate our service?
                                    </label>
                                    {renderStars(request.id!, ratingData[request.id!]?.rating || 0, true)}
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                      Additional Comments (Optional)
                                    </label>
                                    <Textarea
                                      placeholder="Tell us about your experience..."
                                      value={ratingData[request.id!]?.feedback || ""}
                                      onChange={(e) => updateFeedback(request.id!, e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  <Button
                                    onClick={() => handleRatingSubmit(request.id!)}
                                    disabled={submittingRating === request.id}
                                    className="w-full"
                                  >
                                    {submittingRating === request.id ? "Submitting..." : "Submit Rating"}
                                  </Button>
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
