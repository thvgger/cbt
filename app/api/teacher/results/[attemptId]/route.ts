import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
    try {
        const user = await verifyAuth(request)
        if (!user || user.role !== "teacher") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        const db = getDatabase()
        const resolved = await params
        const attemptId = Number.parseInt(resolved.attemptId)
        // Get attempt details
        const attempt = db.prepare(`
      SELECT ta.*, u.name as student_name, t.title as test_title
      FROM test_attempts ta
      JOIN users u ON ta.user_id = u.id
      JOIN tests t ON ta.test_id = t.id
      WHERE ta.id = ?
    `).get(attemptId)
        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
        }
        // Get answers for this attempt
        const answers = db.prepare(`
      SELECT a.*, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.attempt_id = ?
      ORDER BY q.order_index
    `).all(attemptId)
        return NextResponse.json({ attempt, answers })
    } catch (error) {
        console.error("[v0] Error fetching attempt details:", error)
        return NextResponse.json({ error: "Failed to fetch attempt details" }, { status: 500 })
    }
}
