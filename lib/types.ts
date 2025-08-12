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
  type: "new_request" | "status_update" | "success" | "warning" | "error" | "system"
  timestamp: any
  read: boolean
  requestId?: string
  branchCode?: string
  isForManager: boolean
}

export const PROBLEM_TYPES = [
  "Air Conditioning",
  "Electrical",
  "Plumbing",
  "Heating",
  "Lighting",
  "Security System",
  "Internet/Network",
  "Furniture",
  "Cleaning",
  "Other",
] as const

export const STATUS_OPTIONS = [
  "قيد المراجعة", // Under Review
  "تمت الموافقة", // Approved
  "قيد التنفيذ", // In Progress
  "تم الإنجاز", // Completed
  "مرفوض", // Rejected
] as const
