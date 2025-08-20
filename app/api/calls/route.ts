// Calls API - List and create calls
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { CallModel } from "@/lib/models/call"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const direction = searchParams.get("direction") as "inbound" | "outbound" | null
    const status = searchParams.get("status") as any
    const phoneNumberId = searchParams.get("phoneNumberId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const calls = await CallModel.list({
      direction: direction || undefined,
      status: status || undefined,
      phoneNumberId: phoneNumberId || undefined,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: { calls },
    })
  } catch (error) {
    console.error("Get calls error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { campaignId, phoneNumberId, aiAgentId, recipientNumber, direction } = await request.json()

    // Validate required fields
    if (!phoneNumberId || !aiAgentId || !recipientNumber || !direction) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Create call record
    const call = await CallModel.create({
      campaignId,
      phoneNumberId,
      aiAgentId,
      callerNumber: phoneNumberId, // This would be the purchased number
      recipientNumber,
      direction,
    })

    return NextResponse.json({
      success: true,
      data: { call },
    })
  } catch (error) {
    console.error("Create call error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
