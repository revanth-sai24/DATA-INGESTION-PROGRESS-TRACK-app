import { NextResponse } from "next/server";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} from "@/lib/db/repositories/tasks.mjs";

/* A missing task or an unknown project is the caller getting it wrong, not the
   server falling over. They used to be answered with a 500 — or worse, with a
   silently invented row. */
const statusFor = (error) =>
  error?.code === "TASK_NOT_FOUND" ? 404 : error?.code === "UNKNOWN_PROJECT" ? 400 : 500;

/**
 * GET    /api/tasks            every task, in app shape
 * POST   /api/tasks            create
 * PATCH  /api/tasks            update one, or reorder many
 * DELETE /api/tasks?id=...     delete
 */

export async function GET() {
  try {
    return NextResponse.json({ tasks: await listTasks() });
  } catch (error) {
    console.error("GET /api/tasks:", error);
    return NextResponse.json({ tasks: [], error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!String(body?.title ?? "").trim()) {
      return NextResponse.json({ error: "A task needs a title" }, { status: 400 });
    }
    const id = await createTask(body);
    return NextResponse.json({ id, tasks: await listTasks() });
  } catch (error) {
    console.error("POST /api/tasks:", error);
    return NextResponse.json({ error: error.message }, { status: statusFor(error) });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (Array.isArray(body?.reorder)) {
      await reorderTasks(body.reorder);
    } else {
      if (!body?.id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
      }
      await updateTask(body);
    }
    return NextResponse.json({ tasks: await listTasks() });
  } catch (error) {
    console.error("PATCH /api/tasks:", error);
    return NextResponse.json({ error: error.message }, { status: statusFor(error) });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await deleteTask(id);
    return NextResponse.json({ tasks: await listTasks() });
  } catch (error) {
    console.error("DELETE /api/tasks:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
