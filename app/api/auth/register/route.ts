// Registration API endpoint
import { type NextRequest, NextResponse } from "next/server"
import { UserModel } from "@/lib/models/user"
import { generateToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, role } = await request.json()

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long" },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email)
    if (existingUser) {
      return NextResponse.json({ success: false, error: "User with this email already exists" }, { status: 409 })
    }

    // Create new user
    const user = await UserModel.create({
      email,
      password,
      firstName,
      lastName,
      role: role || "viewer", // Default to viewer role
    })

    const token = await generateToken(user)

    // Set HTTP-only cookie
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
