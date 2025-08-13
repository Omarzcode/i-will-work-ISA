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
  priority?: "low" | "medium" | "high" | "urgent"
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "new_request" | "status_update" | "success" | "warning" | "error" | "system"
  timestamp: any
  read: boolean
  requestId?: string
  branchCode?: string
  isForManager: boolean
  recipientId?: string
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

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800 border-red-200" },
] as const
