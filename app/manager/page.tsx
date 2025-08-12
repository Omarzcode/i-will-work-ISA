"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, orderBy, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { createBranchNotification } from "@/hooks/useNotifications"
import { toast } from "sonner"
import { Clock, MapPin, User, AlertCircle, CheckCircle, XCircle, Wrench } from "lucide-react"

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  problemType: string
  priority: "low" | "medium" | "high" | "urgent"
  location: string
  status: "pending" | "in-progress" | "completed" | "cancelled"
  userId: string
  userEmail: string
  userName: string
  branchCode: string
  branchName: string
  createdAt: any
  updatedAt: any
  images?: string[]
  managerNotes: string
  rating?: number
  feedback?: string
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "in-progress", label: "In Progress", icon: Wrench, color: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Completed", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-800" },
]

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

export default function ManagerPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  console.log("ManagerPage: Component loaded, user:", user?.email, "role:", user?.role)

  useEffect(() => {
    if (!user || user.role !== "manager") {
      console.log("ManagerPage: User not manager or not logged in")
      setLoading(false)
      return
    }

    console.log("ManagerPage: Setting up requests listener for manager")

    const requestsQuery = query(collection(db, "requests"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        console.log("ManagerPage: Received snapshot with", snapshot.docs.length, "requests")

        const requestsList = snapshot.docs.map((doc) => {
          const data = doc.data()
          console.log("ManagerPage: Processing request:", doc.id, data.title)

          return {
            id: doc.id,
            ...data,
          } as MaintenanceRequest
        })

        setRequests(requestsList)
        setLoading(false)
        console.log("ManagerPage: Updated requests list, total:", requestsList.length)
      },
      (error) => {
        console.error("ManagerPage: Error listening to requests:", error)
        setLoading(false)
      },
    )

    return () => {
      console.log("ManagerPage: Cleaning up requests listener")
      unsubscribe()
    }
  }, [user])

  const updateRequestStatus = async (requestId: string, newStatus: string, notes = "") => {
    if (!user) {
      console.error("ManagerPage: No user found for status update")
      return
    }

    console.log("ManagerPage: Updating request status:", requestId, "to:", newStatus)
    setUpdatingStatus(requestId)

    try {
      const request = requests.find((r) => r.id === requestId)
      if (!request) {
        console.error("ManagerPage: Request not found:", requestId)
        return
      }

      console.log("ManagerPage: Found request for update:", request.title, "Branch:", request.branchCode)

      // Update the request in Firestore
      await updateDoc(doc(db, "requests", requestId), {
        status: newStatus,
        managerNotes: notes,
        updatedAt: serverTimestamp(),
      })

      console.log("ManagerPage: Request updated in Firestore")

      // Create notification for branch user
      try {
        console.log("ManagerPage: Creating branch notification for:", request.branchCode)

        const statusLabels = {
          pending: "Pending",
          "in-progress": "In Progress",
          completed: "Completed",
          cancelled: "Cancelled",
        }

        const notificationTitle = "Request Status Updated"
        const notificationMessage = `Your request "${request.title}" has been updated to ${statusLabels[newStatus as keyof typeof statusLabels]}${notes ? `. Manager notes: ${notes}` : ""}`

        await createBranchNotification(notificationTitle, notificationMessage, request.branchCode, requestId)

        console.log("ManagerPage: Branch notification created successfully")
      } catch (notificationError) {
        console.error("ManagerPage: Error creating branch notification:", notificationError)
        // Don't fail the status update if notification fails
      }

      toast.success("Request status updated successfully!")
      console.log("ManagerPage: Status update completed successfully")
    } catch (error) {
      console.error("ManagerPage: Error updating request status:", error)
      toast.error("Failed to update request status")
    } finally {
      setUpdatingStatus(null)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString() + " " + date.toLocaleTimeString()
    } catch (error) {
      console.error("ManagerPage: Error formatting date:", error)
      return "Unknown"
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access the manager dashboard.</p>
        </div>
      </div>
    )
  }

  if (user.role !== "manager") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You need manager privileges to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Manager Dashboard</h1>
        <p className="text-blue-600">Manage all maintenance requests across branches</p>
      </div>

      <div className="grid gap-6">
        {requests.length === 0 ? (
          <Card className="rounded-xl border-blue-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Requests Found</h3>
              <p className="text-gray-500">There are no maintenance requests at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => {
            const StatusIcon = STATUS_OPTIONS.find((s) => s.value === request.status)?.icon || Clock

            return (
              <Card key={request.id} className="rounded-xl border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-blue-900 mb-2">{request.title}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={PRIORITY_COLORS[request.priority]}>{request.priority.toUpperCase()}</Badge>
                        <Badge className={STATUS_OPTIONS.find((s) => s.value === request.status)?.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {STATUS_OPTIONS.find((s) => s.value === request.status)?.label}
                        </Badge>
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          {request.problemType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Request Details</h4>
                        <p className="text-gray-700 mb-3">{request.description}</p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                            <span>{request.location}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <User className="w-4 h-4 mr-2 text-blue-500" />
                            <span>
                              {request.userName} ({request.userEmail})
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                            <span>Created: {formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Branch Information</h4>
                        <p className="text-gray-700">
                          {request.branchName} ({request.branchCode})
                        </p>
                      </div>

                      {request.images && request.images.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-2">Images</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {request.images.map((imageUrl, index) => (
                              <img
                                key={index}
                                src={imageUrl || "/placeholder.svg"}
                                alt={`Request image ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-blue-200"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {request.rating && (
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-2">User Rating</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-lg ${star <= request.rating! ? "text-yellow-400" : "text-gray-300"}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">({request.rating}/5)</span>
                          </div>
                          {request.feedback && (
                            <p className="text-gray-700 mt-2 text-sm italic">"{request.feedback}"</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Update Status</h4>
                        <Select
                          value={request.status}
                          onValueChange={(newStatus) => {
                            const notes = request.managerNotes || ""
                            updateRequestStatus(request.id, newStatus, notes)
                          }}
                          disabled={updatingStatus === request.id}
                        >
                          <SelectTrigger className="rounded-lg border-blue-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status.value} value={status.value} className="rounded-md">
                                <div className="flex items-center">
                                  <status.icon className="w-4 h-4 mr-2" />
                                  {status.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Manager Notes</h4>
                        <Textarea
                          value={request.managerNotes}
                          onChange={(e) => {
                            // Update local state immediately for better UX
                            setRequests((prev) =>
                              prev.map((r) => (r.id === request.id ? { ...r, managerNotes: e.target.value } : r)),
                            )
                          }}
                          placeholder="Add notes about this request..."
                          rows={4}
                          className="rounded-lg border-blue-200 focus:border-blue-500"
                        />
                        <Button
                          onClick={() => updateRequestStatus(request.id, request.status, request.managerNotes)}
                          disabled={updatingStatus === request.id}
                          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                          {updatingStatus === request.id ? "Updating..." : "Save Notes"}
                        </Button>
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
  )
}
