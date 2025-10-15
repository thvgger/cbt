import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)

    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDatabase()

    const tests = db
      .prepare(
        `SELECT 
          t.*,
          c.id as class_id,
          c.name as class_name,
          (SELECT COUNT(*) FROM questions WHERE test_id = t.id) as question_count,
          (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id) as attempt_count
         FROM tests t
         LEFT JOIN classes c ON t.class_id = c.id
         WHERE t.created_by = ?
         ORDER BY t.created_at DESC`,
      )
      .all(user.userId)

    return NextResponse.json({ tests })
  } catch (error) {
    console.error("[v0] Error fetching tests:", error)
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)

    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

  const { title, description, duration_minutes, passing_score, calculator_allowed, questions, class_id } = await request.json()

    if (!title || !duration_minutes || !passing_score || !questions || questions.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = getDatabase()

    const testResult = db
      .prepare(
        class_id ?
          "INSERT INTO tests (title, description, duration_minutes, passing_score, calculator_allowed, created_by, class_id) VALUES (?, ?, ?, ?, ?, ?, ?)" :
          "INSERT INTO tests (title, description, duration_minutes, passing_score, calculator_allowed, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        ...(class_id ? [title, description || null, duration_minutes, passing_score, calculator_allowed ? 1 : 0, user.userId, class_id] : [title, description || null, duration_minutes, passing_score, calculator_allowed ? 1 : 0, user.userId])
      )

    const testId = testResult.lastInsertRowid

    const insertQuestion = db.prepare(
      "INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )

    questions.forEach((q: any, index: number) => {
      insertQuestion.run(
        testId,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        index + 1,
      )
    })

    return NextResponse.json({ testId })
  } catch (error) {
    console.error("[v0] Error creating test:", error)
    return NextResponse.json({ error: "Failed to create test" }, { status: 500 })
  }
}
