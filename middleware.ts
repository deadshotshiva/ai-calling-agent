// Authentication middleware for protected routes
import { NextResponse } from "next/server"
import type { NextRequest } from "next/request"
import { verifyToken } from "./lib/auth"

// Define protected routes and their required roles
const PROTECTED_ROUTES = {
  "/": ["admin", "agent", "viewer"], // Dashboard
  "/calls": ["admin", "agent", "viewer"],
  "/numbers": ["admin", "agent"],
  "/agents": ["admin"],
  "/campaigns": ["admin", "agent"],
  "/analytics": ["admin", "agent", "viewer"],
  "/team": ["admin"],
  "/settings": ["admin"],
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/api/auth/login", "/api/auth/register"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow API routes that don't require auth
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/me")) {
    return NextResponse.next()
  }

  // Get auth token from cookies
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    // Redirect to login if invalid token
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("auth-token")
    return response
  }

  // Check role-based access for protected routes
  const requiredRoles = PROTECTED_ROUTES[pathname as keyof typeof PROTECTED_ROUTES]
  if (requiredRoles && !requiredRoles.includes(payload.role)) {
    // Redirect to dashboard if insufficient permissions
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
