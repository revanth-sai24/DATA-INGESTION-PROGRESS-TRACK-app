import { NextResponse } from "next/server";
import { execute, now } from "@/lib/db/client.mjs";
import { listTasks } from "@/lib/db/repositories/tasks.mjs";

/**
 * Task comments. The table and the read path already existed — comments come
 * back on every task from listTasks — but nothing could write one, so the
 * feature was invisible and every comment typed before the cutover was lost.
 */

export async function POST(request) {
  try {
    const { task_id, body, author } = await request.json();
    const text = String(body ?? "").trim();
    if (!task_id || !text) {
      return NextResponse.json({ error: "task_id and body are required" }, { status: 400 });
    }
    const ts = now();
    await execute(
      `INSERT INTO comments (id, task_id, author, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, task_id,
       String(author ?? "").trim(), text, ts, ts],
    );
    return NextResponse.json({ tasks: await listTasks() });
  } catch (e) {
    console.error("POST /api/comments:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await execute(`DELETE FROM comments WHERE id = ?`, [id]);
    return NextResponse.json({ tasks: await listTasks() });
  } catch (e) {
    console.error("DELETE /api/comments:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
