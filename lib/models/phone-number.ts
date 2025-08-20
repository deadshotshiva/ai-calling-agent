// Phone number model with database operations
import { query } from "../database"
import type { PurchasedNumber } from "../types"

export class PhoneNumberModel {
  static async create(numberData: {
    phoneNumber: string
    vapiPhoneNumberId: string
    countryCode?: string
    monthlyCost?: number
    purchasedBy: string
  }): Promise<PurchasedNumber> {
    const result = await query(
      `INSERT INTO purchased_numbers (phone_number, vapi_phone_number_id, country_code, monthly_cost, purchased_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        numberData.phoneNumber,
        numberData.vapiPhoneNumberId,
        numberData.countryCode || "US",
        numberData.monthlyCost || 0,
        numberData.purchasedBy,
      ],
    )

    return this.mapRow(result.rows[0])
  }

  static async findById(id: string): Promise<PurchasedNumber | null> {
    const result = await query("SELECT * FROM purchased_numbers WHERE id = $1", [id])
    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async findByVapiId(vapiPhoneNumberId: string): Promise<PurchasedNumber | null> {
    const result = await query("SELECT * FROM purchased_numbers WHERE vapi_phone_number_id = $1", [vapiPhoneNumberId])
    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async list(filters?: {
    isActive?: boolean
    countryCode?: string
    limit?: number
    offset?: number
  }): Promise<PurchasedNumber[]> {
    let whereClause = "1=1"
    const values: any[] = []
    let paramIndex = 1

    if (filters?.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex}`
      values.push(filters.isActive)
      paramIndex++
    }

    if (filters?.countryCode) {
      whereClause += ` AND country_code = $${paramIndex}`
      values.push(filters.countryCode)
      paramIndex++
    }

    const limit = filters?.limit || 50
    const offset = filters?.offset || 0

    const result = await query(
      `SELECT * FROM purchased_numbers 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset],
    )

    return result.rows.map(this.mapRow)
  }

  static async updateStatus(id: string, isActive: boolean): Promise<PurchasedNumber | null> {
    const result = await query(`UPDATE purchased_numbers SET is_active = $1 WHERE id = $2 RETURNING *`, [isActive, id])

    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  private static mapRow(row: any): PurchasedNumber {
    return {
      id: row.id,
      phoneNumber: row.phone_number,
      vapiPhoneNumberId: row.vapi_phone_number_id,
      countryCode: row.country_code,
      isActive: row.is_active,
      monthlyCost: Number.parseFloat(row.monthly_cost),
      purchasedBy: row.purchased_by,
      purchasedAt: row.purchased_at,
      createdAt: row.created_at,
    }
  }
}
