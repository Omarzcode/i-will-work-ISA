import { type NextRequest, NextResponse } from "next/server"
import { cleanupService } from "@/lib/cleanup-service"

export async function GET() {
  try {
    const stats = await cleanupService.getStorageStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching storage stats:", error)
    return NextResponse.json({ error: "Failed to fetch storage stats" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, daysOld } = await request.json()

    let result
    switch (type) {
      case "requests":
        result = await cleanupService.cleanupCompletedRequests(daysOld || 7)
        break
      case "full":
        result = await cleanupService.runFullCleanup()
        break
      default:
        return NextResponse.json({ error: "Invalid cleanup type" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error during cleanup:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
