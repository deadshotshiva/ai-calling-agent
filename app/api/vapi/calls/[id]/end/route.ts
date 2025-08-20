// End call through VAPI
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { getVAPIService } from "@/lib/vapi-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "agent")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const vapiService = getVAPIService()
    await vapiService.endCall(params.id)

    return NextResponse.json({
      success: true,
      message: "Call ended successfully",
    })
  } catch (error) {
    console.error("End call error:", error)
    return NextResponse.json({ success: false, error: "Failed to end call" }, { status: 500 })
  }
}
