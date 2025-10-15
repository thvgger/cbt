import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDatabase()
    const resolved = await params
    const test = db.prepare("SELECT * FROM tests WHERE id = ?").get(resolved.id)

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    const user = await verifyAuth(request)

    // If student, ensure they belong to the class assigned to the test (or allow if test has no class)
    if (user && user.role === "student") {
      const u = db.prepare("SELECT class_id FROM users WHERE id = ?").get(user.userId) as { class_id?: number | null }
      const classId = u?.class_id ?? null

      if (test.class_id !== null && test.class_id !== classId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // If unauthenticated, only allow access to classless tests
    if (!user && test.class_id !== null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ test })
  } catch (error) {
    console.error("[v0] Error fetching test:", error)
    return NextResponse.json({ error: "Failed to fetch test" }, { status: 500 })
  }
}
