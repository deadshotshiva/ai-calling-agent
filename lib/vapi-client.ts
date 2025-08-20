// VAPI client for telephony integration
interface VAPIConfig {
  apiKey: string
  baseUrl?: string
}

interface VAPIPhoneNumber {
  id: string
  number: string
  provider: string
  cost: number
  createdAt: string
}

interface VAPICall {
  id: string
  phoneNumberId: string
  assistantId: string
  customer: {
    number: string
  }
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended"
  startedAt?: string
  endedAt?: string
  cost?: number
  transcript?: string
  recordingUrl?: string
}

interface VAPIAssistant {
  id: string
  name: string
  model: {
    provider: "openai"
    model: "gpt-4o" | "gpt-4" | "gpt-3.5-turbo"
    temperature: number
    maxTokens: number
    systemMessage: string
  }
  voice: {
    provider: "elevenlabs" | "openai"
    voiceId: string
    settings?: Record<string, any>
  }
  firstMessage?: string
  endCallMessage?: string
}

export class VAPIClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: VAPIConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || "https://api.vapi.ai"
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`VAPI API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Phone Number Management
  async getPhoneNumbers(): Promise<VAPIPhoneNumber[]> {
    return this.request<VAPIPhoneNumber[]>("/phone-number")
  }

  async buyPhoneNumber(areaCode?: string): Promise<VAPIPhoneNumber> {
    return this.request<VAPIPhoneNumber>("/phone-number", {
      method: "POST",
      body: JSON.stringify({
        areaCode,
        provider: "twilio", // or "vonage"
      }),
    })
  }

  async deletePhoneNumber(phoneNumberId: string): Promise<void> {
    await this.request(`/phone-number/${phoneNumberId}`, {
      method: "DELETE",
    })
  }

  // Assistant Management
  async createAssistant(assistant: Omit<VAPIAssistant, "id">): Promise<VAPIAssistant> {
    return this.request<VAPIAssistant>("/assistant", {
      method: "POST",
      body: JSON.stringify(assistant),
    })
  }

  async getAssistant(assistantId: string): Promise<VAPIAssistant> {
    return this.request<VAPIAssistant>(`/assistant/${assistantId}`)
  }

  async updateAssistant(assistantId: string, updates: Partial<VAPIAssistant>): Promise<VAPIAssistant> {
    return this.request<VAPIAssistant>(`/assistant/${assistantId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
  }

  async deleteAssistant(assistantId: string): Promise<void> {
    await this.request(`/assistant/${assistantId}`, {
      method: "DELETE",
    })
  }

  // Call Management
  async createCall(callData: {
    phoneNumberId: string
    assistantId: string
    customer: {
      number: string
      name?: string
    }
  }): Promise<VAPICall> {
    return this.request<VAPICall>("/call", {
      method: "POST",
      body: JSON.stringify(callData),
    })
  }

  async getCall(callId: string): Promise<VAPICall> {
    return this.request<VAPICall>(`/call/${callId}`)
  }

  async getCalls(filters?: {
    assistantId?: string
    phoneNumberId?: string
    limit?: number
    offset?: number
  }): Promise<VAPICall[]> {
    const params = new URLSearchParams()
    if (filters?.assistantId) params.append("assistantId", filters.assistantId)
    if (filters?.phoneNumberId) params.append("phoneNumberId", filters.phoneNumberId)
    if (filters?.limit) params.append("limit", filters.limit.toString())
    if (filters?.offset) params.append("offset", filters.offset.toString())

    const query = params.toString()
    return this.request<VAPICall[]>(`/call${query ? `?${query}` : ""}`)
  }

  async endCall(callId: string): Promise<VAPICall> {
    return this.request<VAPICall>(`/call/${callId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "ended" }),
    })
  }
}

// Singleton instance
let vapiClient: VAPIClient | null = null

export function getVAPIClient(): VAPIClient {
  if (!vapiClient) {
    const apiKey = process.env.VAPI_API_KEY
    if (!apiKey) {
      throw new Error("VAPI_API_KEY environment variable is required")
    }
    vapiClient = new VAPIClient({ apiKey })
  }
  return vapiClient
}
