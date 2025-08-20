"use client"

import { useEffect, useState, useCallback } from "react"
import { getWebSocketClient } from "@/lib/websocket-client"
import type { WebSocketMessage, Transcript, Call } from "@/lib/types"

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false)
  const [wsClient] = useState(() => getWebSocketClient())

  useEffect(() => {
    const connect = async () => {
      try {
        await wsClient.connect()
        setIsConnected(true)
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error)
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      wsClient.disconnect()
      setIsConnected(false)
    }
  }, [wsClient])

  const subscribe = useCallback(
    (eventType: string, callback: (data: any) => void) => {
      return wsClient.subscribe(eventType, callback)
    },
    [wsClient],
  )

  const subscribeToCall = useCallback(
    (callId: string, callback: (message: WebSocketMessage) => void) => {
      return wsClient.subscribeToCall(callId, callback)
    },
    [wsClient],
  )

  return {
    isConnected,
    subscribe,
    subscribeToCall,
    send: wsClient.send.bind(wsClient),
  }
}

export function useCallTranscripts(callId: string) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const { subscribeToCall } = useRealtime()

  useEffect(() => {
    if (!callId) return

    // Fetch initial transcripts
    const fetchTranscripts = async () => {
      try {
        const response = await fetch(`/api/calls/${callId}/transcripts`)
        const data = await response.json()
        if (data.success) {
          setTranscripts(data.data.transcripts)
        }
      } catch (error) {
        console.error("Failed to fetch transcripts:", error)
      }
    }

    fetchTranscripts()

    // Subscribe to real-time transcript updates
    const unsubscribe = subscribeToCall(callId, (message) => {
      if (message.type === "transcript") {
        const newTranscript = message.data as Transcript
        setTranscripts((prev) => {
          // Check if transcript already exists (avoid duplicates)
          const exists = prev.some((t) => t.id === newTranscript.id)
          if (exists) return prev

          // Insert transcript in correct chronological order
          const updated = [...prev, newTranscript].sort((a, b) => a.timestampMs - b.timestampMs)
          return updated
        })
      }
    })

    return unsubscribe
  }, [callId, subscribeToCall])

  return transcripts
}

export function useCallStatus(callId: string) {
  const [callStatus, setCallStatus] = useState<Call["status"] | null>(null)
  const { subscribeToCall } = useRealtime()

  useEffect(() => {
    if (!callId) return

    const unsubscribe = subscribeToCall(callId, (message) => {
      if (message.type === "call-status") {
        setCallStatus(message.data.status)
      }
    })

    return unsubscribe
  }, [callId, subscribeToCall])

  return callStatus
}

export function useLiveMetrics() {
  const [metrics, setMetrics] = useState({
    activeCalls: 0,
    callsToday: 0,
    successRate: 0,
  })
  const { subscribe } = useRealtime()

  useEffect(() => {
    const unsubscribe = subscribe("metrics-update", (data) => {
      setMetrics(data)
    })

    return unsubscribe
  }, [subscribe])

  return metrics
}
