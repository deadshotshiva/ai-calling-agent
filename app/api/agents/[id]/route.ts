// Individual AI Agent API
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { AIAgentModel } from "@/lib/models/ai-agent"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const agent = await AIAgentModel.findById(params.id)
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { agent },
    })
  } catch (error) {
    console.error("Get agent error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "admin")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const updates = await request.json()

    const agent = await AIAgentModel.update(params.id, updates)
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { agent },
    })
  } catch (error) {
    console.error("Update agent error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "admin")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const success = await AIAgentModel.delete(params.id)
    if (!success) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Agent deleted successfully",
    })
  } catch (error) {
    console.error("Delete agent error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
