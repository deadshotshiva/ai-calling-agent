// VAPI webhook handler
import { type NextRequest, NextResponse } from "next/server"
import { CallModel } from "@/lib/models/call"
import { PhoneNumberModel } from "@/lib/models/phone-number"
import { AIAgentModel } from "@/lib/models/ai-agent"

interface VAPIWebhookPayload {
  type: "call-start" | "call-end" | "transcript" | "function-call" | "hang" | "speech-start" | "speech-end"
  call: {
    id: string
    phoneNumberId: string
    assistantId: string
    customer: {
      number: string
    }
    status: string
    startedAt?: string
    endedAt?: string
    cost?: number
    transcript?: string
    recordingUrl?: string
  }
  transcript?: {
    role: "user" | "assistant"
    transcript: string
    timestampMs: number
  }
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (implement based on VAPI documentation)
    const signature = request.headers.get("x-vapi-signature")
    const body = await request.text()

    // TODO: Implement signature verification
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    // }

    const payload: VAPIWebhookPayload = JSON.parse(body)

    console.log(`[VAPI Webhook] Received ${payload.type} event for call ${payload.call.id}`)

    switch (payload.type) {
      case "call-start":
        await handleCallStart(payload)
        break

      case "call-end":
        await handleCallEnd(payload)
        break

      case "transcript":
        await handleTranscript(payload)
        break

      case "hang":
        await handleCallHang(payload)
        break

      default:
        console.log(`[VAPI Webhook] Unhandled event type: ${payload.type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("VAPI webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleCallStart(payload: VAPIWebhookPayload) {
  try {
    // Find or create call record
    let call = await CallModel.findByVapiId(payload.call.id)

    if (!call) {
      // Find phone number and AI agent
      const phoneNumber = await PhoneNumberModel.findByVapiId(payload.call.phoneNumberId)
      const aiAgent = await AIAgentModel.findById(payload.call.assistantId)

      if (!phoneNumber || !aiAgent) {
        console.error("Phone number or AI agent not found for call", payload.call.id)
        return
      }

      // Create new call record
      call = await CallModel.create({
        vapiCallId: payload.call.id,
        phoneNumberId: phoneNumber.id,
        aiAgentId: aiAgent.id,
        callerNumber: payload.call.customer.number,
        recipientNumber: phoneNumber.phoneNumber,
        direction: "inbound", // Assuming inbound for webhook calls
      })
    }

    // Update call status
    await CallModel.updateStatus(call.id, "answered", {
      startedAt: payload.call.startedAt ? new Date(payload.call.startedAt) : new Date(),
    })

    console.log(`[VAPI] Call ${payload.call.id} started`)
  } catch (error) {
    console.error("Error handling call start:", error)
  }
}

async function handleCallEnd(payload: VAPIWebhookPayload) {
  try {
    const call = await CallModel.findByVapiId(payload.call.id)
    if (!call) {
      console.error("Call not found:", payload.call.id)
      return
    }

    // Calculate duration
    const startTime = call.startedAt ? new Date(call.startedAt).getTime() : Date.now()
    const endTime = payload.call.endedAt ? new Date(payload.call.endedAt).getTime() : Date.now()
    const durationSeconds = Math.floor((endTime - startTime) / 1000)

    // Update call with final details
    await CallModel.updateStatus(call.id, "completed", {
      endedAt: payload.call.endedAt ? new Date(payload.call.endedAt) : new Date(),
      durationSeconds,
      cost: payload.call.cost || 0,
      recordingUrl: payload.call.recordingUrl,
      summary: payload.call.transcript,
    })

    console.log(`[VAPI] Call ${payload.call.id} ended - Duration: ${durationSeconds}s`)
  } catch (error) {
    console.error("Error handling call end:", error)
  }
}

async function handleTranscript(payload: VAPIWebhookPayload) {
  try {
    if (!payload.transcript) return

    const call = await CallModel.findByVapiId(payload.call.id)
    if (!call) {
      console.error("Call not found for transcript:", payload.call.id)
      return
    }

    // Add transcript entry
    await CallModel.addTranscript({
      callId: call.id,
      speaker: payload.transcript.role === "user" ? "user" : "assistant",
      content: payload.transcript.transcript,
      timestampMs: payload.transcript.timestampMs,
      isFinal: true,
    })

    console.log(`[VAPI] Transcript added for call ${payload.call.id}`)
  } catch (error) {
    console.error("Error handling transcript:", error)
  }
}

async function handleCallHang(payload: VAPIWebhookPayload) {
  try {
    const call = await CallModel.findByVapiId(payload.call.id)
    if (!call) {
      console.error("Call not found:", payload.call.id)
      return
    }

    await CallModel.updateStatus(call.id, "completed", {
      endedAt: new Date(),
    })

    console.log(`[VAPI] Call ${payload.call.id} hung up`)
  } catch (error) {
    console.error("Error handling call hang:", error)
  }
}
