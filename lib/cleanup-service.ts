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

  // Extract ImgBB image ID from URL
  private extractImgBBId(url: string): string | null {
    try {
      // ImgBB URLs format: https://i.ibb.co/[ID]/[filename]
      const match = url.match(/https:\/\/i\.ibb\.co\/([^/]+)\//)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  // Delete image from ImgBB (Note: ImgBB free accounts don't support delete API)
  private async deleteImgBBImage(imageUrl: string): Promise<boolean> {
    try {
      const imageId = this.extractImgBBId(imageUrl)
      if (!imageId) {
        console.warn("Could not extract ImgBB ID from URL:", imageUrl)
        return false
      }

      // Note: ImgBB free accounts don't have delete API
      // This is a placeholder for when you upgrade to paid plan
      // For now, we'll just log the images that should be deleted
      console.log(`📸 Image marked for deletion: ${imageId} (${imageUrl})`)

      // If you have ImgBB paid account, uncomment and use this:
      /*
      const response = await fetch(`https://api.imgbb.com/1/image/${imageId}?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
        method: 'DELETE'
      })
      return response.ok
      */

      return true // Return true for now since we can't actually delete
    } catch (error) {
      console.error("Error deleting ImgBB image:", error)
      return false
    }
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
      const imageDeletePromises: Promise<boolean>[] = []
      let imagesDeleted = 0

      // Process each request
      for (const docSnapshot of snapshot.docs) {
        const requestData = docSnapshot.data()

        // If request has an image, try to delete it from ImgBB
        if (requestData.imageUrl) {
          console.log(`🖼️ Processing image for request ${docSnapshot.id}: ${requestData.imageUrl}`)
          imageDeletePromises.push(this.deleteImgBBImage(requestData.imageUrl))
        }

        // Add request deletion to promises
        deletePromises.push(deleteDoc(doc(db, "requests", docSnapshot.id)))
      }

      // Wait for all image deletions to complete
      const imageResults = await Promise.allSettled(imageDeletePromises)
      imagesDeleted = imageResults.filter((result) => result.status === "fulfilled" && result.value).length

      // Wait for all request deletions to complete
      await Promise.all(deletePromises)

      console.log(`✅ Cleaned up ${snapshot.docs.length} completed requests`)
      console.log(`🖼️ Processed ${imagesDeleted} images for deletion`)

      return {
        success: true,
        deletedCount: snapshot.docs.length,
        imagesProcessed: imagesDeleted,
        message: `Successfully deleted ${snapshot.docs.length} old completed requests and processed ${imagesDeleted} images`,
      }
    } catch (error) {
      console.error("❌ Error during cleanup:", error)
      return {
        success: false,
        deletedCount: 0,
        imagesProcessed: 0,
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
      const requestsWithImages = requestsSnapshot.docs.filter((doc) => doc.data().imageUrl)

      const oldCompletedRequests = completedRequests.filter((doc) => {
        const timestamp = doc.data().timestamp
        if (!timestamp) return false

        const requestDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        return requestDate < thirtyDaysAgo
      })

      const oldCompletedWithImages = oldCompletedRequests.filter((doc) => doc.data().imageUrl)

      return {
        totalRequests: requestsSnapshot.docs.length,
        completedRequests: completedRequests.length,
        oldCompletedRequests: oldCompletedRequests.length,
        totalNotifications: notificationsSnapshot.docs.length,
        totalImagesStored: requestsWithImages.length,
        oldImagesForCleanup: oldCompletedWithImages.length,
        estimatedCleanupSavings: oldCompletedRequests.length,
        estimatedImageCleanup: oldCompletedWithImages.length,
      }
    } catch (error) {
      console.error("❌ Error getting storage stats:", error)
      return null
    }
  }

  // Run full cleanup (requests + notifications + images)
  async runFullCleanup() {
    console.log("🚀 Starting full cleanup process...")

    const requestsResult = await this.cleanupCompletedRequests(30) // 30 days for requests
    const notificationsResult = await this.cleanupOldNotifications(7) // 7 days for notifications

    return {
      requests: requestsResult,
      notifications: notificationsResult,
      totalDeleted: requestsResult.deletedCount + notificationsResult.deletedCount,
      totalImagesProcessed: requestsResult.imagesProcessed || 0,
    }
  }
}

// Export singleton instance
export const cleanupService = CleanupService.getInstance()
