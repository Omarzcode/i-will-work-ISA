export interface User {
  uid: string
  email: string
  branchCode: string
  isManager: boolean
}

export interface MaintenanceRequest {
  id: string
  branchCode: string
  problemType: string
  description: string
  imageUrl?: string
  timestamp: any
  status: string
  userId: string
  priority?: "low" | "medium" | "high" | "urgent"
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "new_request" | "status_update"
  read: boolean
  timestamp: any
  branchCode: string
  requestId?: string
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

export const PRIORITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Can wait a few days",
  },
  {
    value: "medium",
    label: "Medium",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Should be addressed soon",
  },
  {
    value: "high",
    label: "High",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    description: "Needs attention today",
  },
  {
    value: "urgent",
    label: "Urgent",
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Immediate attention required",
  },
] as const

export type PriorityLevel = "low" | "medium" | "high" | "urgent"
