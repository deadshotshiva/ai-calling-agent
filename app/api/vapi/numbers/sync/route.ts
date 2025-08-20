// Sync phone numbers from VAPI
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { getVAPIService } from "@/lib/vapi-service"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "admin")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const vapiService = getVAPIService()
    await vapiService.syncPhoneNumbers()

    return NextResponse.json({
      success: true,
      message: "Phone numbers synced successfully",
    })
  } catch (error) {
    console.error("Sync phone numbers error:", error)
    return NextResponse.json({ success: false, error: "Failed to sync phone numbers" }, { status: 500 })
  }
}
