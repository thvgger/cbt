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

    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as {
      count: number
    }
    const totalTeachers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get() as {
      count: number
    }
    const totalTests = db.prepare("SELECT COUNT(*) as count FROM tests").get() as { count: number }
    const totalAttempts = db.prepare("SELECT COUNT(*) as count FROM test_attempts").get() as { count: number }
    const avgScore = db.prepare("SELECT AVG(score) as avg FROM test_attempts").get() as { avg: number | null }

    const stats = {
      total_users: totalUsers.count,
      total_students: totalStudents.count,
      total_teachers: totalTeachers.count,
      total_tests: totalTests.count,
      total_attempts: totalAttempts.count,
      average_score: avgScore.avg || 0,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
