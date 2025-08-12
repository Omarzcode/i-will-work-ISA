"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/hooks/useNotifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore"
import { format } from "date-fns"

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  problemType: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in-progress" | "completed" | "cancelled"
  location: string
  createdAt: any
  updatedAt: any
  userId: string
  userEmail: string
  branchCode: string
  branchName: string
  imageUrls: string[]
  rating?: number
  feedback?: string
  managerNotes?: string
}

export default function ManagerPage() {
  const { user } = useAuth()
  const { createNotification } = useNotifications()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [managerNotes, setManagerNotes] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (!user || user.role !== "manager") {
      console.log("ManagerPage: User not authorized or not manager")
      return
    }

    console.log("ManagerPage: Setting up requests listener for manager:", user.email)

    const requestsQuery = query(collection(db, "requests"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        console.log("ManagerPage: Received snapshot with", snapshot.docs.length, "requests")

        const requestsData = snapshot.docs.map((doc) => {
          const data = doc.data()
          console.log("ManagerPage: Processing request:", data)
          return {
            id: doc.id,
            ...data,
          } as MaintenanceRequest
        })

        setRequests(requestsData)
        setLoading(false)
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

  const updateRequestStatus = async (requestId: string, newStatus: string, request: MaintenanceRequest) => {
    if (!user) return

    console.log("ManagerPage: Updating request status:", { requestId, newStatus, request: request.title })
    setUpdatingStatus(requestId)

    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      }

      // Add manager notes if provided
      const notes = managerNotes[requestId]
      if (notes && notes.trim()) {
        updateData.managerNotes = notes.trim()
      }

      console.log("ManagerPage: Updating request with data:", updateData)
      await updateDoc(doc(db, "requests", requestId), updateData)

      // Create notification for the branch user
      try {
        console.log("ManagerPage: Creating notification for branch user")
        let notificationMessage = `Your request "${request.title}" has been updated to ${newStatus}`

        if (notes && notes.trim()) {
          notificationMessage += `. Manager notes: ${notes.trim()}`
        }

        await createNotification({
          title: "Request Status Updated",
          message: notificationMessage,
          branchCode: request.branchCode,
          isForManager: false,
        })
        console.log("ManagerPage: Successfully created branch user notification")
      } catch (notificationError) {
        console.error("ManagerPage: Error creating notification:", notificationError)
        // Don't fail the status update if notification fails
      }

      // Clear the manager notes for this request
      setManagerNotes((prev) => {
        const updated = { ...prev }
        delete updated[requestId]
        return updated
      })

      console.log("ManagerPage: Successfully updated request status")
    } catch (error) {
      console.error("ManagerPage: Error updating request status:", error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Please log in to access the manager dashboard.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (user.role !== "manager") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>You don't have permission to access this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading requests...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Manager Dashboard</h1>
        <p className="text-gray-600">Manage all maintenance requests across branches</p>
      </div>

      {requests.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No maintenance requests found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <Card key={request.id} className="rounded-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-blue-900">{request.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {request.branchName} • {request.userEmail}
                      {request.location && ` • ${request.location}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={`rounded-full ${getPriorityColor(request.priority)}`}>{request.priority}</Badge>
                    <Badge className={`rounded-full ${getStatusColor(request.status)}`}>{request.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-700 mb-2">{request.description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Type: {request.problemType}</span>
                    <span>
                      Created:{" "}
                      {request.createdAt ? format(request.createdAt.toDate(), "MMM d, yyyy h:mm a") : "Unknown"}
                    </span>
                  </div>
                </div>

                {request.imageUrls && request.imageUrls.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Images:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {request.imageUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url || "/placeholder.svg"}
                          alt={`Request image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {request.managerNotes && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">Manager Notes:</h4>
                    <p className="text-blue-800 text-sm">{request.managerNotes}</p>
                  </div>
                )}

                {request.rating && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-1">User Feedback:</h4>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-800">Rating:</span>
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
                    </div>
                    {request.feedback && <p className="text-green-800 text-sm">{request.feedback}</p>}
                  </div>
                )}

                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`status-${request.id}`}>Update Status</Label>
                    <Select
                      value={request.status}
                      onValueChange={(value) => updateRequestStatus(request.id, value, request)}
                      disabled={updatingStatus === request.id}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="pending" className="rounded-lg">
                          Pending
                        </SelectItem>
                        <SelectItem value="in-progress" className="rounded-lg">
                          In Progress
                        </SelectItem>
                        <SelectItem value="completed" className="rounded-lg">
                          Completed
                        </SelectItem>
                        <SelectItem value="cancelled" className="rounded-lg">
                          Cancelled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`notes-${request.id}`}>Manager Notes (Optional)</Label>
                    <Textarea
                      id={`notes-${request.id}`}
                      value={managerNotes[request.id] || ""}
                      onChange={(e) =>
                        setManagerNotes((prev) => ({
                          ...prev,
                          [request.id]: e.target.value,
                        }))
                      }
                      placeholder="Add notes for the user..."
                      className="rounded-lg"
                      rows={2}
                    />
                  </div>
                </div>

                {updatingStatus === request.id && <div className="text-sm text-blue-600">Updating status...</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
