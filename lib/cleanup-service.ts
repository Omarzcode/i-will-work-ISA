import { collection, query, where, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export class CleanupService {
  private static instance: CleanupService

  static getInstance(): CleanupService {
    if (!CleanupService.instance) {
      CleanupService.instance = new CleanupService()
    }
    return CleanupService.instance
  }

  // Clean up completed requests older than specified days
  async cleanupCompletedRequests(daysOld = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      console.log(`🧹 Starting cleanup of completed requests older than ${daysOld} days...`)

      // Query for completed requests older than cutoff date
      const completedQuery = query(
        collection(db, "requests"),
        where("status", "==", "تم الإنجاز"),
        where("timestamp", "<", Timestamp.fromDate(cutoffDate)),
      )

      const snapshot = await getDocs(completedQuery)
      const deletePromises: Promise<void>[] = []

      snapshot.docs.forEach((docSnapshot) => {
        deletePromises.push(deleteDoc(doc(db, "requests", docSnapshot.id)))
      })

      await Promise.all(deletePromises)

      console.log(`✅ Cleaned up ${snapshot.docs.length} completed requests`)
      return {
        success: true,
        deletedCount: snapshot.docs.length,
        message: `Successfully deleted ${snapshot.docs.length} old completed requests`,
      }
    } catch (error) {
      console.error("❌ Error during cleanup:", error)
      return {
        success: false,
        deletedCount: 0,
        message: `Cleanup failed: ${error}`,
      }
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications(daysOld = 7) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      console.log(`🧹 Starting cleanup of notifications older than ${daysOld} days...`)

      const notificationsQuery = query(
        collection(db, "notifications"),
        where("timestamp", "<", Timestamp.fromDate(cutoffDate)),
      )

      const snapshot = await getDocs(notificationsQuery)
      const deletePromises: Promise<void>[] = []

      snapshot.docs.forEach((docSnapshot) => {
        deletePromises.push(deleteDoc(doc(db, "notifications", docSnapshot.id)))
      })

      await Promise.all(deletePromises)

      console.log(`✅ Cleaned up ${snapshot.docs.length} old notifications`)
      return {
        success: true,
        deletedCount: snapshot.docs.length,
        message: `Successfully deleted ${snapshot.docs.length} old notifications`,
      }
    } catch (error) {
      console.error("❌ Error during notification cleanup:", error)
      return {
        success: false,
        deletedCount: 0,
        message: `Notification cleanup failed: ${error}`,
      }
    }
  }

  // Get storage statistics
  async getStorageStats() {
    try {
      const requestsSnapshot = await getDocs(collection(db, "requests"))
      const notificationsSnapshot = await getDocs(collection(db, "notifications"))

      const completedRequests = requestsSnapshot.docs.filter((doc) => doc.data().status === "تم الإنجاز")

      const oldCompletedRequests = completedRequests.filter((doc) => {
        const timestamp = doc.data().timestamp
        if (!timestamp) return false

        const requestDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        return requestDate < thirtyDaysAgo
      })

      return {
        totalRequests: requestsSnapshot.docs.length,
        completedRequests: completedRequests.length,
        oldCompletedRequests: oldCompletedRequests.length,
        totalNotifications: notificationsSnapshot.docs.length,
        estimatedCleanupSavings: oldCompletedRequests.length,
      }
    } catch (error) {
      console.error("❌ Error getting storage stats:", error)
      return null
    }
  }

  // Run full cleanup (requests + notifications)
  async runFullCleanup() {
    console.log("🚀 Starting full cleanup process...")

    const requestsResult = await this.cleanupCompletedRequests(30) // 30 days for requests
    const notificationsResult = await this.cleanupOldNotifications(7) // 7 days for notifications

    return {
      requests: requestsResult,
      notifications: notificationsResult,
      totalDeleted: requestsResult.deletedCount + notificationsResult.deletedCount,
    }
  }
}

// Export singleton instance
export const cleanupService = CleanupService.getInstance()
