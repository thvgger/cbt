import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)

    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDatabase()
    const resolved = await params

    // Verify ownership
    const test = db.prepare("SELECT created_by FROM tests WHERE id = ?").get(resolved.id) as any

    if (!test || test.created_by !== user.userId) {
      return NextResponse.json({ error: "Test not found or unauthorized" }, { status: 404 })
    }

    const questions = db.prepare("SELECT * FROM questions WHERE test_id = ? ORDER BY order_index").all(resolved.id)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("[v0] Error fetching questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)

    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

  const { title, description, duration_minutes, passing_score, questions, class_id } = await request.json()

    const db = getDatabase()
    const resolved = await params

    // Verify ownership
    const test = db.prepare("SELECT created_by FROM tests WHERE id = ?").get(resolved.id) as any

    if (!test || test.created_by !== user.userId) {
      return NextResponse.json({ error: "Test not found or unauthorized" }, { status: 404 })
    }

    // Update test
    if (typeof class_id !== "undefined") {
      db.prepare("UPDATE tests SET title = ?, description = ?, duration_minutes = ?, passing_score = ?, class_id = ? WHERE id = ?").run(
        title,
        description || null,
        duration_minutes,
        passing_score,
        class_id,
        resolved.id,
      )
    } else {
      db.prepare("UPDATE tests SET title = ?, description = ?, duration_minutes = ?, passing_score = ? WHERE id = ?").run(
        title,
        description || null,
        duration_minutes,
        passing_score,
        resolved.id,
      )
    }

    // Delete old questions
    db.prepare("DELETE FROM questions WHERE test_id = ?").run(resolved.id)

    // Insert new questions
    const insertQuestion = db.prepare(
      "INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )

    questions.forEach((q: any, index: number) => {
      insertQuestion.run(
        resolved.id,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        index + 1,
      )
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating test:", error)
    return NextResponse.json({ error: "Failed to update test" }, { status: 500 })
  }
}
