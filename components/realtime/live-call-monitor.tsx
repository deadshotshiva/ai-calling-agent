"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCallTranscripts, useCallStatus } from "@/hooks/use-realtime"
import { Phone, PhoneOff, User, Bot, Clock, Mic, MicOff } from "lucide-react"
import type { Call } from "@/lib/types"

interface LiveCallMonitorProps {
  call: Call
  onEndCall?: () => void
}

export function LiveCallMonitor({ call, onEndCall }: LiveCallMonitorProps) {
  const transcripts = useCallTranscripts(call.id)
  const liveStatus = useCallStatus(call.id)
  const [callDuration, setCallDuration] = useState(0)

  // Use live status if available, otherwise fall back to call status
  const currentStatus = liveStatus || call.status

  useEffect(() => {
    if (currentStatus === "answered" && call.startedAt) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(call.startedAt!).getTime()) / 1000)
        setCallDuration(elapsed)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [currentStatus, call.startedAt])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: Call["status"]) => {
    switch (status) {
      case "answered":
        return "default"
      case "ringing":
        return "secondary"
      case "completed":
        return "outline"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: Call["status"]) => {
    switch (status) {
      case "answered":
        return <Mic className="h-4 w-4" />
      case "ringing":
        return <Phone className="h-4 w-4 animate-pulse" />
      case "completed":
        return <PhoneOff className="h-4 w-4" />
      case "failed":
        return <PhoneOff className="h-4 w-4" />
      default:
        return <MicOff className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Call Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-100">
                {getStatusIcon(currentStatus)}
              </div>
              <div>
                <CardTitle className="text-lg">Live Call Monitor</CardTitle>
                <CardDescription>
                  {call.direction === "inbound" ? "Inbound" : "Outbound"} call with{" "}
                  {call.direction === "inbound" ? call.callerNumber : call.recipientNumber}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={getStatusColor(currentStatus)} className="flex items-center gap-1">
                {getStatusIcon(currentStatus)}
                {currentStatus}
              </Badge>
              {currentStatus === "answered" && onEndCall && (
                <Button variant="destructive" size="sm" onClick={onEndCall}>
                  <PhoneOff className="h-4 w-4 mr-1" />
                  End Call
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Duration: {formatDuration(callDuration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>Call ID: {call.id.slice(0, 8)}...</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Transcript */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Live Transcript
          </CardTitle>
          <CardDescription>Real-time conversation between caller and AI agent</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {transcripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bot className="h-8 w-8 mb-2" />
                <p>Waiting for conversation to start...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transcripts.map((transcript) => (
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
                        {!transcript.isFinal && (
                          <Badge variant="outline" className="text-xs">
                            typing...
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{transcript.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
