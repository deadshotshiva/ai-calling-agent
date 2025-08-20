// Call transcripts API
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { CallModel } from "@/lib/models/call"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const transcripts = await CallModel.getTranscripts(params.id)

    return NextResponse.json({
      success: true,
      data: { transcripts },
    })
  } catch (error) {
    console.error("Get transcripts error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { speaker, content, timestampMs, confidence, isFinal } = await request.json()

    // Validate required fields
    if (!speaker || !content || timestampMs === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const transcript = await CallModel.addTranscript({
      callId: params.id,
      speaker,
      content,
      timestampMs,
      confidence,
      isFinal,
    })

    return NextResponse.json({
      success: true,
      data: { transcript },
    })
  } catch (error) {
    console.error("Add transcript error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
