import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)

    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { answers } = await request.json()
    const db = getDatabase()

    // Get all questions with correct answers
    const resolved = await params
    // Ensure the student is allowed to submit this test based on class membership
    const test = db.prepare("SELECT class_id, passing_score FROM tests WHERE id = ?").get(resolved.id) as { class_id?: number | null; passing_score: number } | undefined
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    if (test.class_id !== null) {
      const u = db.prepare("SELECT class_id FROM users WHERE id = ?").get(user.userId) as { class_id?: number | null }
      const userClass = u?.class_id ?? null
      if (userClass !== test.class_id) {
        return NextResponse.json({ error: "Unauthorized to submit this test" }, { status: 401 })
      }
    }

    // Prevent multiple attempts: ensure student hasn't already submitted this test
    const existing = db.prepare("SELECT id FROM test_attempts WHERE user_id = ? AND test_id = ?").get(user.userId, resolved.id)
    if (existing) {
      return NextResponse.json({ error: 'Already attempted this test' }, { status: 409 })
    }

    const questions = db
      .prepare("SELECT id, correct_answer, points FROM questions WHERE test_id = ?")
      .all(resolved.id) as Array<{ id: number; correct_answer: string; points: number }>

    // Calculate score
    let correctCount = 0
    const answerRecords: Array<{ questionId: number; selectedAnswer: string | null; isCorrect: boolean }> = []

    questions.forEach((question) => {
      const selectedAnswer = answers[question.id] || null
      const isCorrect = selectedAnswer === question.correct_answer
      if (isCorrect) correctCount++

      answerRecords.push({
        questionId: question.id,
        selectedAnswer,
        isCorrect,
      })
    })

    const score = Math.round((correctCount / questions.length) * 100)
  const testRow = db.prepare("SELECT passing_score FROM tests WHERE id = ?").get(resolved.id) as { passing_score: number }
  const passed = score >= testRow.passing_score

    // Create test attempt
    const attemptResult = db
      .prepare(
        `INSERT INTO test_attempts (user_id, test_id, score, total_questions, time_taken_seconds, passed, started_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      )
      .run(user.userId, resolved.id, score, questions.length, 0, passed ? 1 : 0)

    const attemptId = attemptResult.lastInsertRowid

    // Save individual answers
    const insertAnswer = db.prepare(
      "INSERT INTO answers (attempt_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)",
    )

    answerRecords.forEach((record) => {
      insertAnswer.run(attemptId, record.questionId, record.selectedAnswer, record.isCorrect ? 1 : 0)
    })

    return NextResponse.json({ attemptId, score, passed })
  } catch (error) {
    console.error("[v0] Error submitting test:", error)
    return NextResponse.json({ error: "Failed to submit test" }, { status: 500 })
  }
}
