import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
    try {
        const user = await verifyAuth(request)
        if (!user || user.role !== "teacher") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const db = getDatabase()
        const resolved = await params
        const testId = Number(resolved.testId)

        const attempts = db.prepare(`
      SELECT ta.id as attempt_id, ta.score, ta.passed, ta.completed_at,
             u.id as student_id, u.name as student_name, u.email as student_email
      FROM test_attempts ta
      JOIN users u ON ta.user_id = u.id
      JOIN tests t ON ta.test_id = t.id
      WHERE ta.test_id = ? AND t.created_by = ?
      ORDER BY ta.completed_at DESC
      LIMIT 100
    `).all(testId, user.userId)

        return NextResponse.json({ attempts })
    } catch (error) {
        console.error("[v0] Error fetching attempts for test:", error)
        return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 })
    }
}
