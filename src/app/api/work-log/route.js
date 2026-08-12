import { NextResponse } from "next/server";
import { query, execute, now } from "@/lib/db/client.mjs";

/**
 * Daily work log — what you actually did, per day.
 *
 *   GET    /api/work-log?date=2026-08-12        entries for one day
 *   GET    /api/work-log?from=...&to=...        entries across a range
 *   POST   /api/work-log                        add an entry
 *   PATCH  /api/work-log                        edit an entry
 *   DELETE /api/work-log?id=...                 remove an entry
 */

const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let entries;
    if (isDate(date)) {
      entries = await query(
        `SELECT * FROM work_log WHERE log_date = ? ORDER BY created_at ASC`,
        [date],
      );
    } else if (isDate(from) && isDate(to)) {
      entries = await query(
        `SELECT * FROM work_log WHERE log_date BETWEEN ? AND ?
         ORDER BY log_date DESC, created_at ASC`,
        [from, to],
      );
    } else {
      return NextResponse.json(
        { error: "Pass ?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD" },
        { status: 400 },
      );
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("work-log GET failed:", error);
    return NextResponse.json({ entries: [], error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const entry = String(body.entry ?? "").trim();
    const logDate = body.log_date;

    if (!entry) {
      return NextResponse.json({ error: "entry is required" }, { status: 400 });
    }
    if (!isDate(logDate)) {
      return NextResponse.json(
        { error: "log_date must be YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const minutes = Number(body.minutes);
    const row = {
      id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      log_date: logDate,
      entry,
      project: String(body.project ?? "").trim(),
      task_id: body.task_id || null,
      minutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null,
      created_at: now(),
      updated_at: now(),
    };

    await execute(
      `INSERT INTO work_log (id, log_date, entry, project, task_id, minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(row),
    );

    return NextResponse.json({ entry: row });
  } catch (error) {
    console.error("work-log POST failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const entry = String(body.entry ?? "").trim();
    if (!entry) {
      return NextResponse.json({ error: "entry cannot be empty" }, { status: 400 });
    }

    const minutes = Number(body.minutes);
    const { rowsAffected } = await execute(
      `UPDATE work_log SET entry = ?, project = ?, minutes = ? WHERE id = ?`,
      [
        entry,
        String(body.project ?? "").trim(),
        Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null,
        body.id,
      ],
    );

    if (rowsAffected === 0) {
      return NextResponse.json({ error: "entry not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("work-log PATCH failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await execute(`DELETE FROM work_log WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("work-log DELETE failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
