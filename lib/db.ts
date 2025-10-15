import Database from "better-sqlite3"
import { join } from "path"
import { readFileSync } from "fs"

let db: any | null = null

export function getDatabase() {
  if (!db) {
    // Create database in the project root
    const dbPath = join(process.cwd(), "test-app.db")
    db = new Database(dbPath)

    // Enable foreign keys
    db.pragma("foreign_keys = ON")

    // Initialize database if needed
    initializeDatabase()
  }

  return db
}

function initializeDatabase() {
  if (!db) return

  try {
    // Check if tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get()

    if (!tables) {
      // Read and execute init script for fresh databases
      const initScript = readFileSync(join(process.cwd(), "scripts", "init-database.sql"), "utf-8")
      db.exec(initScript)
      console.log("[v0] Database initialized successfully")
    }

    // Runtime migrations for adding classes and user.class_id for existing DBs
    const classesTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='classes'")
      .get()

    if (!classesTable) {
      try {
        db.exec(
          `CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          );`
        )
        // Insert a default class if none exists
        const count = db.prepare("SELECT COUNT(*) as cnt FROM classes").get()
        if (!count || count.cnt === 0) {
          db.prepare("INSERT INTO classes (name) VALUES (?)").run("Default Class")
        }
        console.log("[v0] classes table ensured")
      } catch (err) {
        console.error("[v0] Failed to create classes table:", err)
      }
    }

    // Ensure users table has class_id column
    try {
      const pragma = db.prepare("PRAGMA table_info(users)").all()
      const hasClass = pragma.some((c: any) => c.name === "class_id")
      if (!hasClass) {
        db.exec("ALTER TABLE users ADD COLUMN class_id INTEGER")
        // Optionally set default class for demo student if present
        const defaultClass = db.prepare("SELECT id FROM classes ORDER BY id LIMIT 1").get()
        if (defaultClass) {
          db.prepare("UPDATE users SET class_id = ? WHERE email = ?").run(defaultClass.id, "student@test.com")
        }
        console.log("[v0] users.class_id column added")
      }
    } catch (err) {
      // SQLite doesn't support many ALTER operations; log and continue
      console.error("[v0] Error ensuring users.class_id column:", err)
    }
    
    // Ensure tests table has class_id column so tests can be associated with classes
    try {
      const testPragma = db.prepare("PRAGMA table_info(tests)").all()
      const hasTestClass = testPragma.some((c: any) => c.name === "class_id")
      if (!hasTestClass) {
        try {
          db.exec("ALTER TABLE tests ADD COLUMN class_id INTEGER")
          console.log("[v0] tests.class_id column added")
        } catch (err) {
          // If ALTER fails, log and continue — it's non-fatal for older DBs but features depending on it will error
          console.error("[v0] Error adding tests.class_id column:", err)
        }
      }
    } catch (err) {
      console.error("[v0] Error ensuring tests.class_id column:", err)
    }
  } catch (error) {
    console.error("[v0] Database initialization error:", error)
  }
}

// User types
export interface User {
  id: number
  email: string
  password: string
  name: string
  role: "student" | "teacher" | "admin"
  class_id?: number | null
  created_at: string
}

export interface Class {
  id: number
  name: string
  created_at: string
}

export interface Test {
  id: number
  title: string
  description: string | null
  duration_minutes: number
  passing_score: number
  created_by: number
  is_active: boolean
  created_at: string
}

export interface Question {
  id: number
  test_id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: "A" | "B" | "C" | "D"
  points: number
  order_index: number
  created_at: string
}

export interface TestAttempt {
  id: number
  user_id: number
  test_id: number
  score: number
  total_questions: number
  time_taken_seconds: number
  passed: boolean
  started_at: string
  completed_at: string
}

export interface Answer {
  id: number
  attempt_id: number
  question_id: number
  selected_answer: "A" | "B" | "C" | "D" | null
  is_correct: boolean
  created_at: string
}
