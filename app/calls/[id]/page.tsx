"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Phone, Clock, DollarSign, Download, PhoneIncoming, PhoneOutgoing, User, Bot } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import type { Call, Transcript } from "@/lib/types"
import { LiveCallMonitor } from "@/components/realtime/live-call-monitor"
import { useCallStatus } from "@/hooks/use-realtime"

export default function CallDetailPage() {
  const params = useParams()
  const callId = params.id as string
  const [call, setCall] = useState<Call | null>(null)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const liveStatus = useCallStatus(callId)

  useEffect(() => {
    if (callId) {
      fetchCallDetails()
      fetchTranscripts()
    }
  }, [callId])

  useEffect(() => {
    if (liveStatus && call) {
      setCall((prev) => (prev ? { ...prev, status: liveStatus } : null))
    }
  }, [liveStatus, call])

  const fetchCallDetails = async () => {
    try {
      const response = await fetch(`/api/calls/${callId}`)
      const data = await response.json()

      if (data.success) {
        setCall(data.data.call)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch call details",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch call details",
        variant: "destructive",
      })
    }
  }

  const fetchTranscripts = async () => {
    try {
      const response = await fetch(`/api/calls/${callId}/transcripts`)
      const data = await response.json()

      if (data.success) {
        setTranscripts(data.data.transcripts)
      }
    } catch (error) {
      console.error("Failed to fetch transcripts:", error)
    } finally {
      setLoading(false)
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

  const handleEndCall = async () => {
    if (!call) return

    try {
      const response = await fetch(`/api/calls/${call.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Call ended successfully",
        })
        fetchCallDetails()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end call",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/calls">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Calls
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Not Found</h3>
            <p className="text-gray-600 text-center">The requested call could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/calls">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Calls
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Call Details</h1>
            <p className="text-gray-600 mt-1">Call ID: {call.id}</p>
          </div>
        </div>
        {call.recordingUrl && (
          <Button variant="outline" className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Download Recording
          </Button>
        )}
      </div>

      {call && (call.status === "answered" || call.status === "ringing") && (
        <LiveCallMonitor call={call} onEndCall={handleEndCall} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Overview */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {call.direction === "inbound" ? (
                  <PhoneIncoming className="h-5 w-5 text-green-600" />
                ) : (
                  <PhoneOutgoing className="h-5 w-5 text-blue-600" />
                )}
                {call.direction === "inbound" ? "Inbound Call" : "Outbound Call"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant={getStatusColor(call.status)}>{call.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">From</span>
                <span className="font-medium">{formatPhoneNumber(call.callerNumber)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">To</span>
                <span className="font-medium">{formatPhoneNumber(call.recipientNumber)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duration
                </span>
                <span className="font-medium">
                  {call.durationSeconds > 0 ? formatDuration(call.durationSeconds) : "0:00"}
                </span>
              </div>
              {call.cost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Cost
                  </span>
                  <span className="font-medium">${call.cost.toFixed(4)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Started</span>
                <span className="font-medium">
                  {call.startedAt ? new Date(call.startedAt).toLocaleString() : "N/A"}
                </span>
              </div>
              {call.endedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ended</span>
                  <span className="font-medium">{new Date(call.endedAt).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {call.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Call Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{call.summary}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Transcript */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Call Transcript</CardTitle>
              <CardDescription>Real-time conversation transcript between the caller and AI agent</CardDescription>
            </CardHeader>
            <CardContent>
              {transcripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Bot className="h-8 w-8 mb-2" />
                  <p>No transcript available for this call</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {transcripts.map((transcript, index) => (
                    <div key={transcript.id} className="flex gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 flex-shrink-0">
                        {transcript.speaker === "user" ? (
                          <User className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Bot className="h-4 w-4 text-cyan-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {transcript.speaker === "user" ? "Caller" : "AI Agent"}
                          </span>
                          <span className="text-xs text-gray-500">{Math.floor(transcript.timestampMs / 1000)}s</span>
                        </div>
                        <p className="text-sm text-gray-700">{transcript.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
