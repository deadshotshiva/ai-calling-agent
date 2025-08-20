// Individual call API - Get, update, delete
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { CallModel } from "@/lib/models/call"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const call = await CallModel.findById(params.id)
    if (!call) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { call },
    })
  } catch (error) {
    console.error("Get call error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { status, durationSeconds, cost, recordingUrl, summary } = await request.json()

    const additionalData: any = {}
    if (durationSeconds !== undefined) additionalData.durationSeconds = durationSeconds
    if (cost !== undefined) additionalData.cost = cost
    if (recordingUrl) additionalData.recordingUrl = recordingUrl
    if (summary) additionalData.summary = summary

    // Set timestamps based on status
    if (status === "answered" && !additionalData.startedAt) {
      additionalData.startedAt = new Date()
    }
    if (["completed", "failed"].includes(status) && !additionalData.endedAt) {
      additionalData.endedAt = new Date()
    }

    const call = await CallModel.updateStatus(params.id, status, additionalData)
    if (!call) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { call },
    })
  } catch (error) {
    console.error("Update call error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
