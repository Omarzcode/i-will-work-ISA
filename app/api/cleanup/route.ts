import { type NextRequest, NextResponse } from "next/server"
import { cleanupService } from "@/lib/cleanup-service"

// API route for manual cleanup (managers only)
export async function POST(request: NextRequest) {
  try {
    // You can add authentication check here
    const { type, daysOld } = await request.json()

    let result

    switch (type) {
      case "requests":
        result = await cleanupService.cleanupCompletedRequests(daysOld || 30)
        break
      case "notifications":
        result = await cleanupService.cleanupOldNotifications(daysOld || 7)
        break
      case "full":
        result = await cleanupService.runFullCleanup()
        break
      default:
        return NextResponse.json({ error: "Invalid cleanup type" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Cleanup API error:", error)
    return NextResponse.json({ error: "Cleanup failed", details: error }, { status: 500 })
  }
}

// Get storage statistics
export async function GET() {
  try {
    const stats = await cleanupService.getStorageStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Storage stats API error:", error)
    return NextResponse.json({ error: "Failed to get storage stats", details: error }, { status: 500 })
  }
}
