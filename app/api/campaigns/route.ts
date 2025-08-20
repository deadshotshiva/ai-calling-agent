// Campaigns API
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { CampaignModel } from "@/lib/models/campaign"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as any
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const campaigns = await CampaignModel.list({
      status: status || undefined,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: { campaigns },
    })
  } catch (error) {
    console.error("Get campaigns error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "agent")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const { name, description, aiAgentId, phoneNumberId, targetContacts, callSchedule } = await request.json()

    // Validate required fields
    if (!name || !aiAgentId || !phoneNumberId || !targetContacts?.length) {
      return NextResponse.json(
        { success: false, error: "Name, AI agent, phone number, and target contacts are required" },
        { status: 400 },
      )
    }

    const campaign = await CampaignModel.create({
      name,
      description,
      aiAgentId,
      phoneNumberId,
      targetContacts,
      callSchedule,
      createdBy: user.id,
    })

    return NextResponse.json({
      success: true,
      data: { campaign },
    })
  } catch (error) {
    console.error("Create campaign error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
