// Authentication context provider
"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
