import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware-auth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyAuth(request)
        if (!user || user.role !== "admin") return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const resolved = await params
        const id = Number(resolved.id)
        const { name } = await request.json()
        if (!name || typeof name !== 'string' || !name.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const db = getDatabase()
        db.prepare('UPDATE classes SET name = ? WHERE id = ?').run(name.trim(), id)
        const updated = db.prepare('SELECT id, name FROM classes WHERE id = ?').get(id)
        return NextResponse.json({ class: updated })
    } catch (err) {
        console.error('[v0] Error updating class', err)
        return NextResponse.json({ error: 'Failed to update class' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyAuth(request)
        if (!user || user.role !== "admin") return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const resolved = await params
        const id = Number(resolved.id)
        const db = getDatabase()
        // Unassign users from this class first
        db.prepare('UPDATE users SET class_id = NULL WHERE class_id = ?').run(id)
        db.prepare('DELETE FROM classes WHERE id = ?').run(id)
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[v0] Error deleting class', err)
        return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
    }
}
