"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import type { MaintenanceRequest } from "@/lib/types"
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, FileText, Calendar, ImageIcon, Building, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function ManagerPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.isManager) {
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

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "requests", requestId), {
        status: newStatus,
      })
      toast({
        title: "Status Updated",
        description: "Request status has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update request status.",
        variant: "destructive",
      })
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

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage All Requests</h1>
            <p className="text-gray-600 mt-2">Review and manage maintenance requests from all branches</p>
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
                          <div className="flex items-center gap-2 text-blue-600">
                            <Building className="w-4 h-4" />
                            <span className="font-medium">{request.branchCode}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{request.problemType}</h3>
                          <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
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

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Request Details</DialogTitle>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Branch</label>
                                      <p className="text-sm text-gray-900">{selectedRequest.branchCode}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Problem Type</label>
                                      <p className="text-sm text-gray-900">{selectedRequest.problemType}</p>
                                    </div>
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
                                        className="mt-2 max-w-full h-64 object-cover rounded-lg border"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Update Status</label>
                                    <Select
                                      value={selectedRequest.status}
                                      onValueChange={(value) => updateRequestStatus(selectedRequest.id!, value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
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
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Select
                            value={request.status}
                            onValueChange={(value) => updateRequestStatus(request.id!, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
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
