// Individual campaign API
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { CampaignModel } from "@/lib/models/campaign"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const campaign = await CampaignModel.findById(params.id)
    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { campaign },
    })
  } catch (error) {
    console.error("Get campaign error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "agent")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const updates = await request.json()

    const campaign = await CampaignModel.update(params.id, updates)
    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { campaign },
    })
  } catch (error) {
    console.error("Update campaign error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
