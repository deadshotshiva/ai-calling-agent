// AI Agent model with database operations
import { query } from "../database"
import type { AIAgent } from "../types"

export class AIAgentModel {
  static async create(agentData: {
    name: string
    systemPrompt: string
    voiceId: string
    model?: string
    temperature?: number
    maxTokens?: number
    createdBy: string
  }): Promise<AIAgent> {
    const result = await query(
      `INSERT INTO ai_agents (name, system_prompt, voice_id, model, temperature, max_tokens, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        agentData.name,
        agentData.systemPrompt,
        agentData.voiceId,
        agentData.model || "gpt-4o",
        agentData.temperature || 0.7,
        agentData.maxTokens || 1000,
        agentData.createdBy,
      ],
    )

    return this.mapRow(result.rows[0])
  }

  static async findById(id: string): Promise<AIAgent | null> {
    const result = await query("SELECT * FROM ai_agents WHERE id = $1 AND is_active = true", [id])
    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async list(filters?: {
    isActive?: boolean
    createdBy?: string
    limit?: number
    offset?: number
  }): Promise<AIAgent[]> {
    let whereClause = "is_active = true"
    const values: any[] = []
    let paramIndex = 1

    if (filters?.createdBy) {
      whereClause += ` AND created_by = $${paramIndex}`
      values.push(filters.createdBy)
      paramIndex++
    }

    const limit = filters?.limit || 50
    const offset = filters?.offset || 0

    const result = await query(
      `SELECT * FROM ai_agents 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset],
    )

    return result.rows.map(this.mapRow)
  }

  static async update(id: string, updates: Partial<AIAgent>): Promise<AIAgent | null> {
    const updateFields = []
    const values = []
    let paramIndex = 1

    if (updates.name) {
      updateFields.push(`name = $${paramIndex}`)
      values.push(updates.name)
      paramIndex++
    }

    if (updates.systemPrompt) {
      updateFields.push(`system_prompt = $${paramIndex}`)
      values.push(updates.systemPrompt)
      paramIndex++
    }

    if (updates.voiceId) {
      updateFields.push(`voice_id = $${paramIndex}`)
      values.push(updates.voiceId)
      paramIndex++
    }

    if (updates.model) {
      updateFields.push(`model = $${paramIndex}`)
      values.push(updates.model)
      paramIndex++
    }

    if (updates.temperature !== undefined) {
      updateFields.push(`temperature = $${paramIndex}`)
      values.push(updates.temperature)
      paramIndex++
    }

    if (updates.maxTokens !== undefined) {
      updateFields.push(`max_tokens = $${paramIndex}`)
      values.push(updates.maxTokens)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return null
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(
      `UPDATE ai_agents SET ${updateFields.join(", ")} WHERE id = $${paramIndex} AND is_active = true RETURNING *`,
      values,
    )

    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(`UPDATE ai_agents SET is_active = false WHERE id = $1`, [id])

    return result.rowCount > 0
  }

  private static mapRow(row: any): AIAgent {
    return {
      id: row.id,
      name: row.name,
      systemPrompt: row.system_prompt,
      voiceId: row.voice_id,
      model: row.model,
      temperature: Number.parseFloat(row.temperature),
      maxTokens: row.max_tokens,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
