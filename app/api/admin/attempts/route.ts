import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDatabase()

    const attempts = db
      .prepare(
        `SELECT 
          ta.id,
          ta.score,
          ta.passed,
          ta.completed_at,
          u.name as student_name,
          t.title as test_title
         FROM test_attempts ta
         JOIN users u ON ta.user_id = u.id
         JOIN tests t ON ta.test_id = t.id
         ORDER BY ta.completed_at DESC
         LIMIT 100`,
      )
      .all()

    return NextResponse.json({ attempts })
  } catch (error) {
    console.error("[v0] Error fetching attempts:", error)
    return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 })
  }
}
