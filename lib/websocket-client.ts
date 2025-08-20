"use client"

import type { WebSocketMessage } from "./types"

export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log("[WebSocket] Connected")
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error("[WebSocket] Failed to parse message:", error)
          }
        }

        this.ws.onclose = () => {
          console.log("[WebSocket] Connection closed")
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error("[WebSocket] Error:", error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type)
    if (listeners) {
      listeners.forEach((callback) => callback(message.data))
    }

    // Also trigger call-specific listeners
    const callListeners = this.listeners.get(`call-${message.callId}`)
    if (callListeners) {
      callListeners.forEach((callback) => callback(message))
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error("[WebSocket] Reconnection failed:", error)
        })
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  subscribe(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(eventType)
        }
      }
    }
  }

  subscribeToCall(callId: string, callback: (message: WebSocketMessage) => void) {
    return this.subscribe(`call-${callId}`, callback)
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn("[WebSocket] Cannot send message - connection not open")
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners.clear()
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"
    wsClient = new WebSocketClient(wsUrl)
  }
  return wsClient
}
