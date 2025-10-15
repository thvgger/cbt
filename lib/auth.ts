import { getDatabase, type User } from "./db"
import bcrypt from "bcryptjs"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function getUserByEmail(email: string): User | undefined {
  const db = getDatabase()
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined
}

export function getUserById(id: number): User | undefined {
  const db = getDatabase()
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined
}

export function createUser(
  email: string,
  hashedPassword: string,
  name: string,
  role: "student" | "teacher" | "admin",
  class_id?: number | null
): User {
  const db = getDatabase()

  if (typeof class_id === "number") {
    const result = db
      .prepare("INSERT INTO users (email, password, name, role, class_id) VALUES (?, ?, ?, ?, ?)")
      .run(email, hashedPassword, name, role, class_id)
    return getUserById(result.lastInsertRowid as number)!
  }

  const result = db
    .prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)")
    .run(email, hashedPassword, name, role)

  return getUserById(result.lastInsertRowid as number)!
}
