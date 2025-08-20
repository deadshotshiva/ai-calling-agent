// Phone numbers API
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { PhoneNumberModel } from "@/lib/models/phone-number"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("isActive")
    const countryCode = searchParams.get("countryCode")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const numbers = await PhoneNumberModel.list({
      isActive: isActive ? isActive === "true" : undefined,
      countryCode: countryCode || undefined,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: { numbers },
    })
  } catch (error) {
    console.error("Get numbers error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, "agent")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const { phoneNumber, vapiPhoneNumberId, countryCode, monthlyCost } = await request.json()

    // Validate required fields
    if (!phoneNumber || !vapiPhoneNumberId) {
      return NextResponse.json({ success: false, error: "Phone number and VAPI ID are required" }, { status: 400 })
    }

    const number = await PhoneNumberModel.create({
      phoneNumber,
      vapiPhoneNumberId,
      countryCode,
      monthlyCost,
      purchasedBy: user.id,
    })

    return NextResponse.json({
      success: true,
      data: { number },
    })
  } catch (error) {
    console.error("Create number error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
