import type { Timestamp } from "firebase/firestore"

export interface User {
  id: string
  email: string
  branchCode: string
  isManager: boolean
  name?: string
}

export interface MaintenanceRequest {
  id?: string
  branchCode: string
  problemType: string
  description: string
  imageUrl?: string
  status: string
  timestamp: Timestamp
  userId: string
  rating?: number
  feedback?: string
}

export interface NotificationData {
  id?: string
  userId: string
  requestId: string
  message: string
  timestamp: Timestamp
  read: boolean
  type: "status_update" | "new_request" | "request_approved" | "request_completed"
}
