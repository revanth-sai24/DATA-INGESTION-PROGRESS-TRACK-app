import { NextResponse } from "next/server";
import { query, execute, now } from "@/lib/db/client.mjs";
import { listTasks } from "@/lib/db/repositories/tasks.mjs";

/**
 * Time tracking.
 *
 *   GET    ?task_id=…   entries for a task
 *   GET    ?running=1   the timer currently running, if any
 *   POST   { task_id }  start a timer
 *   PATCH  { task_id }  stop the running timer for that task
 *   PATCH  { id, minutes }  correct a finished entry
 *   DELETE ?id=…        remove an entry
 *
 * A running timer is a row with ended_at IS NULL, so it survives a reload —
 * which the old in-memory timer did not, and is why every recorded elapsed
 * time in the data is zero.
 */

export async function GET(request) {
  try {
    const p = new URL(request.url).searchParams;
    if (p.get("running") === "1") {
      const rows = await query(
        `SELECT t.id, t.started_at, t.task_id, k.title
           FROM time_entries t JOIN tasks k ON k.id = t.task_id
          WHERE t.ended_at IS NULL ORDER BY t.started_at DESC LIMIT 1`,
      );
      return NextResponse.json({ running: rows[0] ?? null });
    }
    const taskId = p.get("task_id");
    if (!taskId) return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    const entries = await query(
      `SELECT * FROM time_entries WHERE task_id = ? ORDER BY started_at DESC`, [taskId],
    );
    return NextResponse.json({ entries });
  } catch (e) {
    console.error("GET /api/time-entries:", e);
    return NextResponse.json({ entries: [], error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { task_id } = await request.json();
    if (!task_id) return NextResponse.json({ error: "task_id is required" }, { status: 400 });

    // One timer at a time across the app: close whatever is open first.
    for (const row of await query(`SELECT id, started_at FROM time_entries WHERE ended_at IS NULL`)) {
      const secs = Math.max(1, Math.round((Date.now() - new Date(row.started_at).getTime()) / 1000));
      await execute(`UPDATE time_entries SET ended_at = ?, duration_seconds = ? WHERE id = ?`,
        [now(), secs, row.id]);
    }

    const id = `te-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await execute(
      `INSERT INTO time_entries (id, task_id, started_at, source) VALUES (?, ?, ?, 'timer')`,
      [id, task_id, now()],
    );
    return NextResponse.json({ id, tasks: await listTasks() });
  } catch (e) {
    console.error("POST /api/time-entries:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();

    if (body.task_id) {
      const rows = await query(
        `SELECT id, started_at FROM time_entries WHERE task_id = ? AND ended_at IS NULL LIMIT 1`,
        [body.task_id],
      );
      if (!rows[0]) return NextResponse.json({ error: "No running timer" }, { status: 404 });
      const secs = Math.max(1, Math.round((Date.now() - new Date(rows[0].started_at).getTime()) / 1000));
      await execute(`UPDATE time_entries SET ended_at = ?, duration_seconds = ? WHERE id = ?`,
        [now(), secs, rows[0].id]);
      return NextResponse.json({ seconds: secs, tasks: await listTasks() });
    }

    const minutes = Number(body.minutes);
    if (!body.id || !Number.isFinite(minutes) || minutes < 0) {
      return NextResponse.json({ error: "id and minutes are required" }, { status: 400 });
    }
    await execute(`UPDATE time_entries SET duration_seconds = ?, source = 'manual' WHERE id = ?`,
      [Math.round(minutes * 60), body.id]);
    return NextResponse.json({ tasks: await listTasks() });
  } catch (e) {
    console.error("PATCH /api/time-entries:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await execute(`DELETE FROM time_entries WHERE id = ?`, [id]);
    return NextResponse.json({ tasks: await listTasks() });
  } catch (e) {
    console.error("DELETE /api/time-entries:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
