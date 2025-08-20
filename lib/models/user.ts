// User model with database operations
import { query } from "../database"
import type { User } from "../types"
import bcrypt from "bcryptjs"

export class UserModel {
  static async create(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: "admin" | "agent" | "viewer"
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 12)

    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at`,
      [userData.email, passwordHash, userData.firstName, userData.lastName, userData.role || "viewer"],
    )

    return this.mapRow(result.rows[0])
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query("SELECT * FROM users WHERE email = $1 AND is_active = true", [email])

    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query("SELECT * FROM users WHERE id = $1 AND is_active = true", [id])

    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async verifyPassword(email: string, password: string): Promise<User | null> {
    const result = await query("SELECT * FROM users WHERE email = $1 AND is_active = true", [email])

    if (!result.rows[0]) return null

    const isValid = await bcrypt.compare(password, result.rows[0].password_hash)
    return isValid ? this.mapRow(result.rows[0]) : null
  }

  static async updateRole(id: string, role: "admin" | "agent" | "viewer"): Promise<User | null> {
    const result = await query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2 AND is_active = true
       RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at`,
      [role, id],
    )

    return result.rows[0] ? this.mapRow(result.rows[0]) : null
  }

  static async list(limit = 50, offset = 0): Promise<User[]> {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
       FROM users WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    )

    return result.rows.map(this.mapRow)
  }

  private static mapRow(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
