import type { Timestamp } from "firebase/firestore"

export interface User {
  uid: string;
  email: string;
  isManager: boolean;
  branchCode: string;
  displayName?: string;
  photoURL?: string;
}

export interface MaintenanceRequest {
  id?: string
  branchCode: string
  problemType: string
  description: string
  imageUrl?: string
  timestamp: Timestamp | any
  status: string
  userId: string
  priority?: string
  rating?: number
  feedback?: string
  completionMessage?: string
  userEmail?: string
}

export interface Notification {
  id?: string
  title: string
  message: string
  type: "new_request" | "status_update" | "system"
  timestamp: Timestamp | any
  read: boolean
  requestId?: string
  branchCode: string
  isForManager: boolean
}

export type PriorityLevel = "low" | "medium" | "high" | "urgent"

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
    description: "Needs prompt attention",
  },
  {
    value: "urgent",
    label: "Urgent",
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Immediate action required",
  },
]

export const PROBLEM_TYPES = [
  "Electrical",
  "Plumbing",
  "Air Conditioning",
  "Heating",
  "Lighting",
  "Security System",
  "Internet/Network",
  "Furniture",
  "Cleaning",
  "Other",
]

export const STATUS_OPTIONS = ["قيد المراجعة", "تمت الموافقة", "قيد التنفيذ", "تم الإنجاز", "مرفوض"]
