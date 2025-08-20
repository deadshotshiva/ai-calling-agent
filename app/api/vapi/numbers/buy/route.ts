// Buy phone number through VAPI
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { getVAPIService } from "@/lib/vapi-service"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "agent")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const { areaCode } = await request.json()

    const vapiService = getVAPIService()
    const phoneNumber = await vapiService.purchasePhoneNumber(areaCode, user.id)

    return NextResponse.json({
      success: true,
      data: { phoneNumber },
      message: "Phone number purchased successfully",
    })
  } catch (error) {
    console.error("Buy phone number error:", error)
    return NextResponse.json({ success: false, error: "Failed to purchase phone number" }, { status: 500 })
  }
}
