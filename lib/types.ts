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
  status: string
  timestamp: any
  imageUrl?: string
  rating?: number
  feedback?: string
  cancelReason?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  timestamp: any
  read: boolean
  type: "info" | "success" | "warning" | "error"
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
