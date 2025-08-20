// Voices API
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { VoiceModel } from "@/lib/models/voice"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get("provider") as "elevenlabs" | "openai" | null
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const voices = await VoiceModel.list({
      provider: provider || undefined,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: { voices },
    })
  } catch (error) {
    console.error("Get voices error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
