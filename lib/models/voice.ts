// Voice model with database operations
import { query } from "../database"
import type { Voice } from "../types"

export class VoiceModel {
  static async findById(id: string): Promise<Voice | null> {
    const result = await query("SELECT * FROM voices WHERE id = $1 AND is_active = true", [id])
    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async list(filters?: {
    provider?: "elevenlabs" | "openai"
    isActive?: boolean
    limit?: number
    offset?: number
  }): Promise<Voice[]> {
    let whereClause = "is_active = true"
    const values: any[] = []
    let paramIndex = 1

    if (filters?.provider) {
      whereClause += ` AND provider = $${paramIndex}`
      values.push(filters.provider)
      paramIndex++
    }

    const limit = filters?.limit || 50
    const offset = filters?.offset || 0

    const result = await query(
      `SELECT * FROM voices 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset],
    )

    return result.rows.map(this.mapRow)
  }

  static async create(voiceData: {
    name: string
    provider: "elevenlabs" | "openai"
    voiceId: string
    settings?: Record<string, any>
    createdBy: string
  }): Promise<Voice> {
    const result = await query(
      `INSERT INTO voices (name, provider, voice_id, settings, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        voiceData.name,
        voiceData.provider,
        voiceData.voiceId,
        JSON.stringify(voiceData.settings || {}),
        voiceData.createdBy,
      ],
    )

    return this.mapRow(result.rows[0])
  }

  private static mapRow(row: any): Voice {
    return {
      id: row.id,
      name: row.name,
      provider: row.provider,
      voiceId: row.voice_id,
      settings: JSON.parse(row.settings || "{}"),
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }
  }
}
