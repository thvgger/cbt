import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase()

    const user = await verifyAuth(request)

    // If user is an authenticated student, only return tests that are active and either unassigned or assigned to their class
    if (user && user.role === "student") {
      // Fetch student's class_id from DB (verifyAuth JWT doesn't include class)
      const u = db.prepare("SELECT class_id FROM users WHERE id = ?").get(user.userId) as { class_id?: number | null }
      const classId = u?.class_id ?? null

      // Only show tests the student hasn't attempted
      const tests = db.prepare(`
        SELECT t.* FROM tests t
        WHERE t.is_active = 1
          AND (t.class_id IS NULL OR t.class_id = ?)
          AND NOT EXISTS (
            SELECT 1 FROM test_attempts ta WHERE ta.test_id = t.id AND ta.user_id = ?
          )
        ORDER BY t.created_at DESC
      `).all(classId, user.userId)

      return NextResponse.json({ tests })
    }

    // If unauthenticated, only show public tests (no class)
    if (!user) {
      const tests = db
        .prepare("SELECT * FROM tests WHERE is_active = 1 AND class_id IS NULL ORDER BY created_at DESC")
        .all()
      return NextResponse.json({ tests })
    }

    // For teachers/admins, return all active tests
    const tests = db.prepare("SELECT * FROM tests WHERE is_active = 1 ORDER BY created_at DESC").all()
    return NextResponse.json({ tests })
  } catch (error) {
    console.error("[v0] Error fetching tests:", error)
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 })
  }
}
