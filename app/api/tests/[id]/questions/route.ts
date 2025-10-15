import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDatabase()
    const resolved = await params
    const questions = db
      .prepare(
        "SELECT id, test_id, question_text, option_a, option_b, option_c, option_d, order_index FROM questions WHERE test_id = ? ORDER BY order_index",
      )
      .all(resolved.id)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("[v0] Error fetching questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}
