// TypeScript types for the AI Calling Platform

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "admin" | "agent" | "viewer"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PurchasedNumber {
  id: string
  phoneNumber: string
  vapiPhoneNumberId: string
  countryCode: string
  isActive: boolean
  monthlyCost: number
  purchasedBy: string
  purchasedAt: Date
  createdAt: Date
}

export interface Voice {
  id: string
  name: string
  provider: "elevenlabs" | "openai"
  voiceId: string
  settings: Record<string, any>
  isActive: boolean
  createdBy: string
  createdAt: Date
}

export interface AIAgent {
  id: string
  name: string
  systemPrompt: string
  voiceId: string
  model: string
  temperature: number
  maxTokens: number
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Campaign {
  id: string
  name: string
  description?: string
  aiAgentId: string
  phoneNumberId: string
  status: "draft" | "active" | "paused" | "completed"
  targetContacts: Contact[]
  callSchedule: Record<string, any>
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Contact {
  name: string
  phoneNumber: string
  email?: string
  metadata?: Record<string, any>
}

export interface Call {
  id: string
  vapiCallId?: string
  campaignId?: string
  phoneNumberId: string
  aiAgentId: string
  callerNumber: string
  recipientNumber: string
  direction: "inbound" | "outbound"
  status: "initiated" | "ringing" | "answered" | "completed" | "failed" | "transferred"
  durationSeconds: number
  cost: number
  startedAt?: Date
  endedAt?: Date
  recordingUrl?: string
  summary?: string
  metadata: Record<string, any>
  createdAt: Date
}

export interface Transcript {
  id: string
  callId: string
  speaker: "user" | "assistant"
  content: string
  timestampMs: number
  confidence?: number
  isFinal: boolean
  createdAt: Date
}

export interface CallTransfer {
  id: string
  callId: string
  transferredToUserId: string
  transferReason?: string
  transferredAt: Date
  acceptedAt?: Date
  status: "pending" | "accepted" | "declined" | "completed"
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// VAPI webhook types
export interface VAPIWebhookEvent {
  type: "call-started" | "call-ended" | "transcript" | "function-call"
  callId: string
  timestamp: string
  data: Record<string, any>
}

// Real-time WebSocket message types
export interface WebSocketMessage {
  type: "transcript" | "call-status" | "agent-response"
  callId: string
  data: any
  timestamp: string
}
