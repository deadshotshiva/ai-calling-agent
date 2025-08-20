// Campaign model with database operations
import { query } from "../database"
import type { Campaign } from "../types"

export class CampaignModel {
  static async create(campaignData: {
    name: string
    description?: string
    aiAgentId: string
    phoneNumberId: string
    targetContacts: any[]
    callSchedule?: any
    createdBy: string
  }): Promise<Campaign> {
    const result = await query(
      `INSERT INTO campaigns (name, description, ai_agent_id, phone_number_id, target_contacts, call_schedule, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        campaignData.name,
        campaignData.description,
        campaignData.aiAgentId,
        campaignData.phoneNumberId,
        JSON.stringify(campaignData.targetContacts),
        JSON.stringify(campaignData.callSchedule || {}),
        campaignData.createdBy,
      ],
    )

    return this.mapRow(result.rows[0])
  }

  static async findById(id: string): Promise<Campaign | null> {
    const result = await query("SELECT * FROM campaigns WHERE id = $1", [id])
    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async list(filters?: {
    status?: Campaign["status"]
    createdBy?: string
    limit?: number
    offset?: number
  }): Promise<Campaign[]> {
    let whereClause = "1=1"
    const values: any[] = []
    let paramIndex = 1

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`
      values.push(filters.status)
      paramIndex++
    }

    if (filters?.createdBy) {
      whereClause += ` AND created_by = $${paramIndex}`
      values.push(filters.createdBy)
      paramIndex++
    }

    const limit = filters?.limit || 50
    const offset = filters?.offset || 0

    const result = await query(
      `SELECT * FROM campaigns 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset],
    )

    return result.rows.map(this.mapRow)
  }

  static async updateStatus(id: string, status: Campaign["status"]): Promise<Campaign | null> {
    const result = await query(`UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [
      status,
      id,
    ])

    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async update(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    const updateFields = []
    const values = []
    let paramIndex = 1

    if (updates.name) {
      updateFields.push(`name = $${paramIndex}`)
      values.push(updates.name)
      paramIndex++
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`)
      values.push(updates.description)
      paramIndex++
    }

    if (updates.targetContacts) {
      updateFields.push(`target_contacts = $${paramIndex}`)
      values.push(JSON.stringify(updates.targetContacts))
      paramIndex++
    }

    if (updates.callSchedule) {
      updateFields.push(`call_schedule = $${paramIndex}`)
      values.push(JSON.stringify(updates.callSchedule))
      paramIndex++
    }

    if (updateFields.length === 0) {
      return null
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(
      `UPDATE campaigns SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    )

    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  private static mapRow(row: any): Campaign {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      aiAgentId: row.ai_agent_id,
      phoneNumberId: row.phone_number_id,
      status: row.status,
      targetContacts: JSON.parse(row.target_contacts || "[]"),
      callSchedule: JSON.parse(row.call_schedule || "{}"),
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
