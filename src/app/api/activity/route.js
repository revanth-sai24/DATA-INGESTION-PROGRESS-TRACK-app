import { NextResponse } from "next/server";
import { query } from "@/lib/db/client.mjs";

/**
 * Activity history.
 *
 *   GET /api/activity?entity_id=task-123     history for one task or project
 *   GET /api/activity?limit=50               most recent across everything
 *
 * Rows are written by the task and project repositories on every create,
 * update, archive, restore, delete and purge — so this is a read-only view
 * over history the app has been recording all along.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entity_id");
    const raw = Number(searchParams.get("limit"));
    const limit = Number.isFinite(raw) && raw > 0 ? Math.min(Math.round(raw), 200) : 50;

    const events = entityId
      ? await query(
          `SELECT * FROM activity_log WHERE entity_id = ?
           ORDER BY created_at DESC, id DESC LIMIT ?`,
          [entityId, limit],
        )
      : await query(
          `SELECT * FROM activity_log ORDER BY created_at DESC, id DESC LIMIT ?`,
          [limit],
        );

    return NextResponse.json({ events });
  } catch (error) {
    console.error("activity GET failed:", error);
    return NextResponse.json({ events: [], error: error.message }, { status: 500 });
  }
}
