import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export const createNotification = async (
  title: string,
  message: string,
  isForManager: boolean,
  branchCode?: string,
  type: "request_created" | "status_updated" = "request_created",
  requestId?: string,
) => {
  try {
    console.log("createNotification: Starting notification creation")
    console.log("createNotification: Parameters:", {
      title,
      message,
      isForManager,
      branchCode,
      type,
      requestId,
    })

    const notificationData = {
      title,
      message,
      isForManager,
      branchCode: branchCode || null,
      type,
      requestId: requestId || null,
      timestamp: serverTimestamp(),
      read: false,
    }

    console.log("createNotification: Creating notification with data:", notificationData)

    const docRef = await addDoc(collection(db, "notifications"), notificationData)

    console.log("createNotification: Notification created successfully with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("createNotification: Error creating notification:", error)
    throw error
  }
}

export const createManagerNotification = async (title: string, message: string, requestId?: string) => {
  console.log("createManagerNotification: Creating manager notification")
  return createNotification(title, message, true, undefined, "request_created", requestId)
}

export const createBranchNotification = async (
  title: string,
  message: string,
  branchCode: string,
  requestId?: string,
) => {
  console.log("createBranchNotification: Creating branch notification for:", branchCode)
  return createNotification(title, message, false, branchCode, "status_updated", requestId)
}
