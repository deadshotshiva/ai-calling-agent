// Start campaign API
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { CampaignModel } from "@/lib/models/campaign"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "agent")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const campaign = await CampaignModel.updateStatus(params.id, "active")
    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    // TODO: Integrate with VAPI to start actual calls
    // This would trigger the campaign execution logic

    return NextResponse.json({
      success: true,
      data: { campaign },
      message: "Campaign started successfully",
    })
  } catch (error) {
    console.error("Start campaign error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
