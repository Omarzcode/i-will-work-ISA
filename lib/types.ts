export interface User {
  uid: string
  email: string
  role: "manager" | "branch"
  branchCode?: string
  displayName?: string
}

export interface MaintenanceRequest {
  id: string
  title: string
  description: string
  category: "plumbing" | "electrical" | "hvac" | "equipment" | "cleaning" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "approved" | "in_progress" | "completed" | "rejected"
  branchCode: string
  branchName: string
  createdBy: string
  createdAt: any
  updatedAt: any
  assignedTo?: string
  estimatedCost?: number
  actualCost?: number
  completedAt?: any
  images?: string[]
  notes?: string
  rating?: number
  feedback?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "new_request" | "status_update" | "assignment" | "completion" | "error" | "success" | "warning" | "info"
  read: boolean
  createdAt: any
  recipientId?: string
  recipientRole?: "manager" | "branch" | "all"
  requestId?: string
  branchCode?: string
}

export interface Branch {
  code: string
  name: string
  address: string
  manager: string
  phone: string
}

export interface Analytics {
  totalRequests: number
  pendingRequests: number
  completedRequests: number
  averageCompletionTime: number
  totalCost: number
  requestsByCategory: Record<string, number>
  requestsByPriority: Record<string, number>
  requestsByStatus: Record<string, number>
  monthlyTrends: Array<{
    month: string
    requests: number
    cost: number
  }>
}
