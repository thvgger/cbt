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

    const rows = db
      .prepare(
        `
      SELECT u.id as teacher_id, u.name as teacher_name, u.email as teacher_email,
             COUNT(DISTINCT t.id) as tests_count,
             COUNT(ta.id) as attempts_count,
             AVG(ta.score) as avg_score,
             SUM(CASE WHEN ta.passed = 1 THEN 1 ELSE 0 END) as passed_count
      FROM users u
      LEFT JOIN tests t ON t.created_by = u.id
      LEFT JOIN test_attempts ta ON ta.test_id = t.id
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY tests_count DESC, attempts_count DESC
    `
      )
      .all()

    // compute pass_rate per teacher
    const teachers = rows.map((r: any) => ({
      teacher_id: r.teacher_id,
      teacher_name: r.teacher_name,
      teacher_email: r.teacher_email,
      tests_count: r.tests_count || 0,
      attempts_count: r.attempts_count || 0,
      avg_score: r.avg_score === null ? 0 : Number(r.avg_score),
      pass_rate: r.attempts_count ? (Number(r.passed_count || 0) / Number(r.attempts_count)) * 100 : 0,
    }))

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('[v0] Error fetching teacher stats:', error)
    return NextResponse.json({ error: 'Failed to fetch teacher stats' }, { status: 500 })
  }
}
