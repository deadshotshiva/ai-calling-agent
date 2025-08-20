// Start outbound call through VAPI
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { getVAPIService } from "@/lib/vapi-service"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "agent")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const { phoneNumberId, aiAgentId, recipientNumber, campaignId } = await request.json()

    // Validate required fields
    if (!phoneNumberId || !aiAgentId || !recipientNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number, AI agent, and recipient number are required" },
        { status: 400 },
      )
    }

    const vapiService = getVAPIService()
    const callId = await vapiService.initiateOutboundCall({
      phoneNumberId,
      aiAgentId,
      recipientNumber,
      campaignId,
    })

    return NextResponse.json({
      success: true,
      data: { callId },
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Start call error:", error)
    return NextResponse.json({ success: false, error: "Failed to start call" }, { status: 500 })
  }
}
