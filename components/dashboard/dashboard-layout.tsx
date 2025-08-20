"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Phone,
  Users,
  Zap,
  BarChart3,
  Settings,
  Menu,
  PhoneCall,
  Bot,
  PlayCircle,
  LogOut,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Active Calls",
    href: "/calls",
    icon: PhoneCall,
  },
  {
    name: "Phone Numbers",
    href: "/numbers",
    icon: Phone,
  },
  {
    name: "AI Agents",
    href: "/agents",
    icon: Bot,
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: PlayCircle,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Team",
    href: "/team",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-sidebar border-r border-sidebar-border">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">VoiceAI Pro</span>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-6">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* User Profile */}
          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">JD</span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">John Doe</p>
                      <p className="text-xs text-muted-foreground truncate">Admin</p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full bg-sidebar">
            {/* Logo */}
            <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold text-sidebar-foreground">VoiceAI Pro</span>
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-4 py-6">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border lg:px-8">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Phone className="w-4 h-4 mr-2" />
              Buy Number
            </Button>
            <Button size="sm">
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Campaign
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
