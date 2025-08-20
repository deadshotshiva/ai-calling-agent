// Call model with database operations
import { query } from "../database"
import type { Call, Transcript } from "../types"

export class CallModel {
  static async create(callData: {
    vapiCallId?: string
    campaignId?: string
    phoneNumberId: string
    aiAgentId: string
    callerNumber: string
    recipientNumber: string
    direction: "inbound" | "outbound"
  }): Promise<Call> {
    const result = await query(
      `INSERT INTO calls (vapi_call_id, campaign_id, phone_number_id, ai_agent_id, caller_number, recipient_number, direction)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        callData.vapiCallId,
        callData.campaignId,
        callData.phoneNumberId,
        callData.aiAgentId,
        callData.callerNumber,
        callData.recipientNumber,
        callData.direction,
      ],
    )

    return this.mapRow(result.rows[0])
  }

  static async updateStatus(
    id: string,
    status: Call["status"],
    additionalData?: Partial<
      Pick<Call, "startedAt" | "endedAt" | "durationSeconds" | "cost" | "recordingUrl" | "summary">
    >,
  ): Promise<Call | null> {
    const updates = ["status = $2"]
    const values = [id, status]
    let paramIndex = 3

    if (additionalData?.startedAt) {
      updates.push(`started_at = $${paramIndex}`)
      values.push(additionalData.startedAt)
      paramIndex++
    }

    if (additionalData?.endedAt) {
      updates.push(`ended_at = $${paramIndex}`)
      values.push(additionalData.endedAt)
      paramIndex++
    }

    if (additionalData?.durationSeconds !== undefined) {
      updates.push(`duration_seconds = $${paramIndex}`)
      values.push(additionalData.durationSeconds)
      paramIndex++
    }

    if (additionalData?.cost !== undefined) {
      updates.push(`cost = $${paramIndex}`)
      values.push(additionalData.cost)
      paramIndex++
    }

    if (additionalData?.recordingUrl) {
      updates.push(`recording_url = $${paramIndex}`)
      values.push(additionalData.recordingUrl)
      paramIndex++
    }

    if (additionalData?.summary) {
      updates.push(`summary = $${paramIndex}`)
      values.push(additionalData.summary)
      paramIndex++
    }

    const result = await query(`UPDATE calls SET ${updates.join(", ")} WHERE id = $1 RETURNING *`, values)

    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async findById(id: string): Promise<Call | null> {
    const result = await query("SELECT * FROM calls WHERE id = $1", [id])
    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async findByVapiId(vapiCallId: string): Promise<Call | null> {
    const result = await query("SELECT * FROM calls WHERE vapi_call_id = $1", [vapiCallId])
    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async list(filters?: {
    direction?: "inbound" | "outbound"
    status?: Call["status"]
    phoneNumberId?: string
    limit?: number
    offset?: number
  }): Promise<Call[]> {
    let whereClause = "1=1"
    const values: any[] = []
    let paramIndex = 1

    if (filters?.direction) {
      whereClause += ` AND direction = $${paramIndex}`
      values.push(filters.direction)
      paramIndex++
    }

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`
      values.push(filters.status)
      paramIndex++
    }

    if (filters?.phoneNumberId) {
      whereClause += ` AND phone_number_id = $${paramIndex}`
      values.push(filters.phoneNumberId)
      paramIndex++
    }

    const limit = filters?.limit || 50
    const offset = filters?.offset || 0

    const result = await query(
      `SELECT * FROM calls 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset],
    )

    return result.rows.map(this.mapRow)
  }

  static async addTranscript(transcriptData: {
    callId: string
    speaker: "user" | "assistant"
    content: string
    timestampMs: number
    confidence?: number
    isFinal?: boolean
  }): Promise<Transcript> {
    const result = await query(
      `INSERT INTO transcripts (call_id, speaker, content, timestamp_ms, confidence, is_final)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        transcriptData.callId,
        transcriptData.speaker,
        transcriptData.content,
        transcriptData.timestampMs,
        transcriptData.confidence,
        transcriptData.isFinal || false,
      ],
    )

    return {
      id: result.rows[0].id,
      callId: result.rows[0].call_id,
      speaker: result.rows[0].speaker,
      content: result.rows[0].content,
      timestampMs: result.rows[0].timestamp_ms,
      confidence: result.rows[0].confidence,
      isFinal: result.rows[0].is_final,
      createdAt: result.rows[0].created_at,
    }
  }

  static async getTranscripts(callId: string): Promise<Transcript[]> {
    const result = await query("SELECT * FROM transcripts WHERE call_id = $1 ORDER BY timestamp_ms ASC", [callId])

    return result.rows.map((row) => ({
      id: row.id,
      callId: row.call_id,
      speaker: row.speaker,
      content: row.content,
      timestampMs: row.timestamp_ms,
      confidence: row.confidence,
      isFinal: row.is_final,
      createdAt: row.created_at,
    }))
  }

  private static mapRow(row: any): Call {
    return {
      id: row.id,
      vapiCallId: row.vapi_call_id,
      campaignId: row.campaign_id,
      phoneNumberId: row.phone_number_id,
      aiAgentId: row.ai_agent_id,
      callerNumber: row.caller_number,
      recipientNumber: row.recipient_number,
      direction: row.direction,
      status: row.status,
      durationSeconds: row.duration_seconds,
      cost: row.cost,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      recordingUrl: row.recording_url,
      summary: row.summary,
      metadata: row.metadata,
      createdAt: row.created_at,
    }
  }
}
