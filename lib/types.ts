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
