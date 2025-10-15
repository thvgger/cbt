import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"
import { hashPassword, getUserByEmail } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolved = await params
    const userId = Number.parseInt(resolved.id)
    const db = getDatabase()

    // Check if user exists and is not an admin
    const targetUser = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string } | undefined

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 })
    }

    // Delete user and cascade delete related data
    db.prepare("DELETE FROM test_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE student_id = ?)").run(
      userId,
    )
    db.prepare("DELETE FROM test_attempts WHERE student_id = ?").run(userId)
    db.prepare("DELETE FROM questions WHERE test_id IN (SELECT id FROM tests WHERE created_by = ?)").run(userId)
    db.prepare("DELETE FROM tests WHERE created_by = ?").run(userId)
    db.prepare("DELETE FROM users WHERE id = ?").run(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolved = await params
    const userId = Number.parseInt(resolved.id)
    const db = getDatabase()

    const body = await request.json()
    const { email, name, role, class_id, password } = body

    // Ensure target exists
    const target = db.prepare("SELECT * FROM users WHERE id = ?").get(userId)
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If changing email, ensure it's not used by another user
    if (email && email !== target.email) {
      const existing = getUserByEmail(email)
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: 'Email already in use', field: 'email' }, { status: 409 })
      }
    }

    // Protect existing admin from being modified to non-admin by accident? allow edits but ensure at least one admin remains - simple check
    if (target.role === "admin" && role && role !== "admin") {
      // count admins
      const count = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'").get()
      if (count && count.cnt <= 1) {
        return NextResponse.json({ error: "Cannot remove last admin" }, { status: 403 })
      }
    }

    const updates: string[] = []
    const paramsArr: any[] = []

    if (email) {
      updates.push("email = ?")
      paramsArr.push(email)
    }
    if (name) {
      updates.push("name = ?")
      paramsArr.push(name)
    }
    if (role) {
      updates.push("role = ?")
      paramsArr.push(role)
    }
    if (typeof class_id !== "undefined") {
      updates.push("class_id = ?")
      paramsArr.push(class_id)
    }
    if (password) {
      const hashed = await hashPassword(password)
      updates.push("password = ?")
      paramsArr.push(hashed)
    }

    if (updates.length > 0) {
      paramsArr.push(userId)
      const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
      db.prepare(sql).run(...paramsArr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
