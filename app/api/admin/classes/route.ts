import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        // Allow any authenticated user (teachers, admins, students) to fetch the classes list
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const db = getDatabase()
        const classes = db.prepare("SELECT id, name FROM classes ORDER BY name ASC").all()
        return NextResponse.json({ classes })
    } catch (error) {
        console.error("[v0] Error fetching classes:", error)
        return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { name } = await request.json()
        if (!name || typeof name !== 'string' || !name.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const db = getDatabase()
        const result = db.prepare('INSERT INTO classes (name) VALUES (?)').run(name.trim())
        const created = db.prepare('SELECT id, name FROM classes WHERE id = ?').get(result.lastInsertRowid)
        return NextResponse.json({ class: created })
    } catch (error) {
        console.error('[v0] Error creating class:', error)
        return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
    }
}
