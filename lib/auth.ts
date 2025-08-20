// Authentication utilities and JWT handling
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { UserModel } from "./models/user"
import type { User } from "./types"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")
const JWT_EXPIRES_IN = "7d"

export interface AuthTokenPayload {
  userId: string
  email: string
  role: string
}

// Generate JWT token
export async function generateToken(user: User): Promise<string> {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

// Verify JWT token
export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as AuthTokenPayload
  } catch (error) {
    return null
  }
}

// Get current user from request
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const payload = await verifyToken(token)
    if (!payload) return null

    const user = await UserModel.findById(payload.userId)
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Check if user has required role
export function hasRole(user: User | null, requiredRole: string | string[]): boolean {
  if (!user) return false

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(user.role)
}

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  admin: ["admin", "agent", "viewer"],
  agent: ["agent", "viewer"],
  viewer: ["viewer"],
}

export function hasPermission(user: User | null, requiredRole: "admin" | "agent" | "viewer"): boolean {
  if (!user) return false
  return ROLE_HIERARCHY[user.role]?.includes(requiredRole) || false
}
