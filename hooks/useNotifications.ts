"use client"
import { useAuth } from "./useAuth"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export interface CreateNotificationParams {
  title: string
  message: string
  branchCode?: string
  isForManager?: boolean
}

export function useNotifications() {
  const { user } = useAuth()

  const createNotification = async (params: CreateNotificationParams) => {
    try {
      console.log("useNotifications: Creating notification with params:", params)

      if (!user) {
        console.error("useNotifications: No user found when creating notification")
        return
      }

      const notificationData = {
        title: params.title,
        message: params.message,
        timestamp: serverTimestamp(),
        isRead: false,
        branchCode: params.branchCode || null,
        isForManager: params.isForManager || false,
        createdBy: user.email,
      }

      console.log("useNotifications: Adding notification to Firestore:", notificationData)

      const docRef = await addDoc(collection(db, "notifications"), notificationData)

      console.log("useNotifications: Successfully created notification with ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("useNotifications: Error creating notification:", error)
      throw error
    }
  }

  return {
    createNotification,
  }
}
