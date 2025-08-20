"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { PhoneCall, PhoneIncoming, PhoneOutgoing, Clock, DollarSign, Search, Eye } from "lucide-react"
import Link from "next/link"
import type { Call } from "@/lib/types"

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false)
  const [initiateLoading, setInitiateLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [directionFilter, setDirectionFilter] = useState<string>("all")
  const { toast } = useToast()

  // Form state for initiating calls
  const [callForm, setCallForm] = useState({
    phoneNumberId: "",
    aiAgentId: "",
    recipientNumber: "",
  })

  useEffect(() => {
    fetchCalls()
  }, [statusFilter, directionFilter])

  const fetchCalls = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (directionFilter !== "all") params.append("direction", directionFilter)

      const response = await fetch(`/api/calls?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setCalls(data.data.calls)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch calls",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch calls",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateCall = async () => {
    if (!callForm.phoneNumberId || !callForm.aiAgentId || !callForm.recipientNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setInitiateLoading(true)
    try {
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...callForm,
          direction: "outbound",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Call initiated successfully",
        })
        setInitiateDialogOpen(false)
        setCallForm({ phoneNumberId: "", aiAgentId: "", recipientNumber: "" })
        fetchCalls()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to initiate call",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate call",
        variant: "destructive",
      })
    } finally {
      setInitiateLoading(false)
    }
  }

  const getStatusColor = (status: Call["status"]) => {
    switch (status) {
      case "completed":
        return "default"
      case "answered":
        return "default"
      case "failed":
        return "destructive"
      case "transferred":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, "")
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      const number = cleaned.slice(1)
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
    }
    return phoneNumber
  }

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.callerNumber.includes(searchTerm) ||
      call.recipientNumber.includes(searchTerm) ||
      call.id.includes(searchTerm)
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all inbound and outbound calls</p>
        </div>
        <Dialog open={initiateDialogOpen} onOpenChange={setInitiateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700">
              <PhoneCall className="h-4 w-4" />
              Initiate Call
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initiate Outbound Call</DialogTitle>
              <DialogDescription>Start a new outbound call using your AI agents.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="phoneNumberId">Phone Number</Label>
                <Select
                  value={callForm.phoneNumberId}
                  onValueChange={(value) => setCallForm((prev) => ({ ...prev, phoneNumberId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">+1 (555) 123-4567</SelectItem>
                    <SelectItem value="2">+1 (555) 987-6543</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="aiAgentId">AI Agent</Label>
                <Select
                  value={callForm.aiAgentId}
                  onValueChange={(value) => setCallForm((prev) => ({ ...prev, aiAgentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Sarah AI - Customer Service</SelectItem>
                    <SelectItem value="2">Mike AI - Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="recipientNumber">Recipient Number</Label>
                <Input
                  id="recipientNumber"
                  placeholder="+1 (555) 000-0000"
                  value={callForm.recipientNumber}
                  onChange={(e) => setCallForm((prev) => ({ ...prev, recipientNumber: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInitiateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInitiateCall} disabled={initiateLoading}>
                {initiateLoading ? "Initiating..." : "Start Call"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by phone number or call ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="initiated">Initiated</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calls</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calls List */}
      {filteredCalls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PhoneCall className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Calls Found</h3>
            <p className="text-gray-600 text-center mb-6">
              {calls.length === 0
                ? "No calls have been made yet. Start your first call to see it here."
                : "No calls match your current filters. Try adjusting your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCalls.map((call) => (
            <Card key={call.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                      {call.direction === "inbound" ? (
                        <PhoneIncoming className="h-5 w-5 text-green-600" />
                      ) : (
                        <PhoneOutgoing className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {call.direction === "inbound"
                            ? formatPhoneNumber(call.callerNumber)
                            : formatPhoneNumber(call.recipientNumber)}
                        </span>
                        <Badge variant={getStatusColor(call.status)}>{call.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {call.durationSeconds > 0 ? formatDuration(call.durationSeconds) : "0:00"}
                        </span>
                        {call.cost > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />${call.cost.toFixed(4)}
                          </span>
                        )}
                        <span>{new Date(call.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/calls/${call.id}`}>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
