export interface User {
  uid: string
  email: string
  branchCode: string
  isManager: boolean
}

export interface MaintenanceRequest {
  id?: string
  branchCode: string
  problemType: string
  description: string
  imageUrl?: string
  timestamp: any
  status: string
  userId: string
  rating?: number
  feedback?: string
  completionMessage?: string
}

export interface Notification {
  id?: string
  title: string
  message: string
  timestamp: any
  read: boolean
  type: "new_request" | "status_update" | "info" | "success" | "warning" | "error"
  requestId?: string
  branchCode?: string
  isForManager?: boolean
}

export const PROBLEM_TYPES = [
  "Air Conditioning",
  "Plumbing",
  "Electrical",
  "Equipment Malfunction",
  "Cleaning",
  "Furniture",
  "Security",
  "Other",
]
