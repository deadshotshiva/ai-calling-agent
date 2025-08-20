"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, PhoneCall, Users, BarChart3, Settings, Mic, PhoneIncoming, PhoneOutgoing, Clock } from "lucide-react"
import { DashboardMetrics } from "@/components/realtime/dashboard-metrics"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-accent rounded-lg">
              <Phone className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans">VoiceFlow AI</h1>
              <p className="text-sm text-primary-foreground/80">AI Calling Agent Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              System Online
            </Badge>
            <Button variant="secondary" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="px-6">
          <div className="flex gap-8">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "calls", label: "Call Management", icon: PhoneCall },
              { id: "agents", label: "AI Agents", icon: Mic },
              { id: "numbers", label: "Phone Numbers", icon: Phone },
              { id: "users", label: "Users", icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <DashboardMetrics />

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneIncoming className="w-5 h-5" />
                    Recent Inbound Calls
                  </CardTitle>
                  <CardDescription>Latest incoming calls handled by AI agents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { number: "+1 (555) 123-4567", agent: "Sarah AI", duration: "3:42", status: "completed" },
                      { number: "+1 (555) 987-6543", agent: "Mike AI", duration: "2:18", status: "transferred" },
                      { number: "+1 (555) 456-7890", agent: "Emma AI", duration: "5:33", status: "completed" },
                    ].map((call, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{call.number}</p>
                          <p className="text-sm text-muted-foreground">Agent: {call.agent}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{call.duration}</p>
                          <Badge variant={call.status === "completed" ? "default" : "secondary"}>{call.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneOutgoing className="w-5 h-5" />
                    Outbound Campaigns
                  </CardTitle>
                  <CardDescription>Active and scheduled outbound call campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Customer Follow-up", progress: 75, total: 200, completed: 150 },
                      { name: "Product Demo Calls", progress: 45, total: 100, completed: 45 },
                      { name: "Survey Campaign", progress: 90, total: 300, completed: 270 },
                    ].map((campaign, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {campaign.completed}/{campaign.total}
                          </p>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{ width: `${campaign.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex-col gap-2">
                    <PhoneCall className="w-6 h-6" />
                    Start Outbound Campaign
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <Phone className="w-6 h-6" />
                    Buy Phone Number
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <Mic className="w-6 h-6" />
                    Configure AI Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab !== "overview" && (
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                This section is under development. The {activeTab} management interface will be available soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Clock className="w-8 h-8 mr-2" />
                Feature in development
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
