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
        // Get all attempts for tests created by this teacher
        const results = db.prepare(`
      SELECT ta.id as attempt_id, ta.score, ta.passed, ta.completed_at,
          u.id as student_id, u.name as student_name, u.email as student_email, u.class_id,
          c.name as class_name,
          t.id as test_id, t.title as test_title
      FROM test_attempts ta
      JOIN users u ON ta.user_id = u.id
      LEFT JOIN classes c ON u.class_id = c.id
      JOIN tests t ON ta.test_id = t.id
      WHERE t.created_by = ?
      ORDER BY ta.completed_at DESC
      LIMIT 200
    `).all(user.userId)
        return NextResponse.json({ results })
    } catch (error) {
        console.error("[v0] Error fetching teacher results:", error)
        return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
    }
}
