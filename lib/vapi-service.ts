// VAPI service layer for business logic
import { getVAPIClient } from "./vapi-client"
import { AIAgentModel } from "./models/ai-agent"
import { PhoneNumberModel } from "./models/phone-number"
import { CallModel } from "./models/call"
import type { AIAgent, PurchasedNumber } from "./types"

export class VAPIService {
  private client = getVAPIClient()

  // Phone Number Operations
  async purchasePhoneNumber(areaCode?: string, purchasedBy?: string): Promise<PurchasedNumber> {
    try {
      // Buy number through VAPI
      const vapiNumber = await this.client.buyPhoneNumber(areaCode)

      // Store in our database
      const phoneNumber = await PhoneNumberModel.create({
        phoneNumber: vapiNumber.number,
        vapiPhoneNumberId: vapiNumber.id,
        countryCode: "US", // Default to US
        monthlyCost: vapiNumber.cost,
        purchasedBy: purchasedBy || "system",
      })

      return phoneNumber
    } catch (error) {
      console.error("Error purchasing phone number:", error)
      throw new Error("Failed to purchase phone number")
    }
  }

  async syncPhoneNumbers(): Promise<void> {
    try {
      const vapiNumbers = await this.client.getPhoneNumbers()

      for (const vapiNumber of vapiNumbers) {
        const existingNumber = await PhoneNumberModel.findByVapiId(vapiNumber.id)

        if (!existingNumber) {
          // Create new number record
          await PhoneNumberModel.create({
            phoneNumber: vapiNumber.number,
            vapiPhoneNumberId: vapiNumber.id,
            countryCode: "US",
            monthlyCost: vapiNumber.cost,
            purchasedBy: "system",
          })
        }
      }
    } catch (error) {
      console.error("Error syncing phone numbers:", error)
      throw new Error("Failed to sync phone numbers")
    }
  }

  // AI Agent Operations
  async createVAPIAssistant(aiAgent: AIAgent): Promise<string> {
    try {
      const vapiAssistant = await this.client.createAssistant({
        name: aiAgent.name,
        model: {
          provider: "openai",
          model: aiAgent.model as any,
          temperature: aiAgent.temperature,
          maxTokens: aiAgent.maxTokens,
          systemMessage: aiAgent.systemPrompt,
        },
        voice: {
          provider: "elevenlabs", // Default to ElevenLabs
          voiceId: aiAgent.voiceId,
        },
        firstMessage: "Hello! How can I help you today?",
        endCallMessage: "Thank you for calling. Have a great day!",
      })

      return vapiAssistant.id
    } catch (error) {
      console.error("Error creating VAPI assistant:", error)
      throw new Error("Failed to create VAPI assistant")
    }
  }

  async updateVAPIAssistant(vapiAssistantId: string, aiAgent: AIAgent): Promise<void> {
    try {
      await this.client.updateAssistant(vapiAssistantId, {
        name: aiAgent.name,
        model: {
          provider: "openai",
          model: aiAgent.model as any,
          temperature: aiAgent.temperature,
          maxTokens: aiAgent.maxTokens,
          systemMessage: aiAgent.systemPrompt,
        },
        voice: {
          provider: "elevenlabs",
          voiceId: aiAgent.voiceId,
        },
      })
    } catch (error) {
      console.error("Error updating VAPI assistant:", error)
      throw new Error("Failed to update VAPI assistant")
    }
  }

  // Call Operations
  async initiateOutboundCall(params: {
    phoneNumberId: string
    aiAgentId: string
    recipientNumber: string
    campaignId?: string
  }): Promise<string> {
    try {
      // Get phone number and AI agent
      const phoneNumber = await PhoneNumberModel.findById(params.phoneNumberId)
      const aiAgent = await AIAgentModel.findById(params.aiAgentId)

      if (!phoneNumber || !aiAgent) {
        throw new Error("Phone number or AI agent not found")
      }

      // Create VAPI assistant if not exists
      const vapiAssistantId = aiAgent.id // Assuming we store VAPI assistant ID

      // Create call record first
      const call = await CallModel.create({
        campaignId: params.campaignId,
        phoneNumberId: params.phoneNumberId,
        aiAgentId: params.aiAgentId,
        callerNumber: phoneNumber.phoneNumber,
        recipientNumber: params.recipientNumber,
        direction: "outbound",
      })

      // Initiate call through VAPI
      const vapiCall = await this.client.createCall({
        phoneNumberId: phoneNumber.vapiPhoneNumberId,
        assistantId: vapiAssistantId,
        customer: {
          number: params.recipientNumber,
        },
      })

      // Update call with VAPI call ID
      await CallModel.updateStatus(call.id, "initiated", {
        startedAt: new Date(),
      })

      return call.id
    } catch (error) {
      console.error("Error initiating outbound call:", error)
      throw new Error("Failed to initiate outbound call")
    }
  }

  async endCall(callId: string): Promise<void> {
    try {
      const call = await CallModel.findById(callId)
      if (!call || !call.vapiCallId) {
        throw new Error("Call not found or no VAPI call ID")
      }

      await this.client.endCall(call.vapiCallId)

      await CallModel.updateStatus(callId, "completed", {
        endedAt: new Date(),
      })
    } catch (error) {
      console.error("Error ending call:", error)
      throw new Error("Failed to end call")
    }
  }

  // Campaign Operations
  async startCampaign(campaignId: string): Promise<void> {
    try {
      // This would implement the campaign execution logic
      // For now, we'll just mark it as a placeholder
      console.log(`Starting campaign ${campaignId}`)

      // TODO: Implement campaign execution
      // 1. Get campaign details
      // 2. Process target contacts
      // 3. Schedule/initiate calls based on call schedule
      // 4. Handle rate limiting and retry logic
    } catch (error) {
      console.error("Error starting campaign:", error)
      throw new Error("Failed to start campaign")
    }
  }
}

// Singleton instance
let vapiService: VAPIService | null = null

export function getVAPIService(): VAPIService {
  if (!vapiService) {
    vapiService = new VAPIService()
  }
  return vapiService
}
