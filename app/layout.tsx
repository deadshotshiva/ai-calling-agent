import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, DM_Sans } from "next/font/google"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "VoiceFlow AI - AI Calling Agent Platform",
  description:
    "Professional AI Calling Agent SaaS Platform for managing inbound and outbound calls with intelligent voice agents",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable} antialiased`}>
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
