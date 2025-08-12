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

export interface User {
  email: string
  isManager: boolean
  branchCode?: string
}

export const REQUEST_STATUSES = {
  PENDING: "قيد المراجعة",
  APPROVED: "تمت الموافقة",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "تم الإنجاز",
  REJECTED: "مرفوض",
  CANCELLED: "ملغي",
} as const

export const PROBLEM_TYPES = ["Electrical", "Plumbing", "Refrigeration", "Lighting", "Other"] as const
