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

    const tests = db
      .prepare(
        `SELECT 
          t.*,
          u.name as teacher_name,
          (SELECT COUNT(*) FROM questions WHERE test_id = t.id) as question_count,
          (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id) as attempt_count
         FROM tests t
         JOIN users u ON t.created_by = u.id
         ORDER BY t.created_at DESC`,
      )
      .all()

    return NextResponse.json({ tests })
  } catch (error) {
    console.error("[v0] Error fetching tests:", error)
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 })
  }
}
