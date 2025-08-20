import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get active calls count
    const activeCallsResult = await query(
      "SELECT COUNT(*) as count FROM calls WHERE status IN ('initiated', 'ringing', 'answered')",
    )
    const activeCalls = Number.parseInt(activeCallsResult.rows[0].count)

    // Get calls today count
    const callsTodayResult = await query("SELECT COUNT(*) as count FROM calls WHERE DATE(created_at) = CURRENT_DATE")
    const callsToday = Number.parseInt(callsTodayResult.rows[0].count)

    // Calculate success rate
    const successRateResult = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(*) as total
      FROM calls 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `)
    const { completed, total } = successRateResult.rows[0]
    const successRate = total > 0 ? (completed / total) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        activeCalls,
        callsToday,
        successRate: Number.parseFloat(successRate.toFixed(1)),
      },
    })
  } catch (error) {
    console.error("Get metrics error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
