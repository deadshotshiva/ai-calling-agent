// AI Agents API
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { AIAgentModel } from "@/lib/models/ai-agent"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const agents = await AIAgentModel.list({
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: { agents },
    })
  } catch (error) {
    console.error("Get agents error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "admin")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const { name, systemPrompt, voiceId, model, temperature, maxTokens } = await request.json()

    // Validate required fields
    if (!name || !systemPrompt || !voiceId) {
      return NextResponse.json(
        { success: false, error: "Name, system prompt, and voice ID are required" },
        { status: 400 },
      )
    }

    const agent = await AIAgentModel.create({
      name,
      systemPrompt,
      voiceId,
      model,
      temperature,
      maxTokens,
      createdBy: user.id,
    })

    return NextResponse.json({
      success: true,
      data: { agent },
    })
  } catch (error) {
    console.error("Create agent error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
