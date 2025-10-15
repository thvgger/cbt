import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolved = await params
    const id = Number(resolved.id)
    const db = getDatabase()

    const test = db
      .prepare(
        `SELECT t.*, u.name as teacher_name 
         FROM tests t 
         JOIN users u ON t.created_by = u.id 
         WHERE t.id = ?`,
      )
      .get(id)

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    return NextResponse.json({ test })
  } catch (error) {
    console.error("[v0] Error fetching test:", error)
    return NextResponse.json({ error: "Failed to fetch test" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolved = await params
    const testId = Number.parseInt(resolved.id)
    const db = getDatabase()

    // Delete test and cascade delete related data
    db.prepare("DELETE FROM answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE test_id = ?)").run(
      testId,
    )
    db.prepare("DELETE FROM test_attempts WHERE test_id = ?").run(testId)
    db.prepare("DELETE FROM questions WHERE test_id = ?").run(testId)
    db.prepare("DELETE FROM tests WHERE id = ?").run(testId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting test:", error)
    return NextResponse.json({ error: "Failed to delete test" }, { status: 500 })
  }
}
