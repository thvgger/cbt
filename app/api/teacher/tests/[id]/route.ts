import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Delete dependent answers for questions belonging to this test, and delete attempts for this test
    const deleteAnswers = db.prepare(
      "DELETE FROM answers WHERE question_id IN (SELECT id FROM questions WHERE test_id = ?)"
    )
    const deleteAttempts = db.prepare("DELETE FROM test_attempts WHERE test_id = ?")
    const deleteTest = db.prepare("DELETE FROM tests WHERE id = ?")

    const tx = db.transaction((testId: number) => {
      deleteAnswers.run(testId)
      deleteAttempts.run(testId)
      deleteTest.run(testId)
    })

    tx(resolved.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting test:", error)
    return NextResponse.json({ error: "Failed to delete test" }, { status: 500 })
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

    // Update test (include class_id when provided)
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

    // Replace questions if provided
    if (questions && Array.isArray(questions)) {
      // Delete dependent answers first to avoid FK constraint failures
      const deleteAnswers = db.prepare(
        "DELETE FROM answers WHERE question_id IN (SELECT id FROM questions WHERE test_id = ?)"
      )
      const deleteQuestions = db.prepare("DELETE FROM questions WHERE test_id = ?")
      const insertQuestion = db.prepare(
        "INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )

      const tx = db.transaction((testId: number, qs: any[]) => {
        deleteAnswers.run(testId)
        deleteQuestions.run(testId)

        qs.forEach((q: any, index: number) => {
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
      })

      tx(resolved.id, questions)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating test:", error)
    return NextResponse.json({ error: "Failed to update test" }, { status: 500 })
  }
}
