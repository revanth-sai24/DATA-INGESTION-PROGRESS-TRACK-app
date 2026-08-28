import { NextResponse } from "next/server";
import { listTasks } from "@/lib/db/repositories/tasks.mjs";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
  purgeProject,
} from "@/lib/db/repositories/projects.mjs";

/**
 * DELETE archives the project and its open tasks; it never destroys work.
 * Pass ?purge=1 for permanent removal (tasks are unassigned, not deleted).
 * POST with { restore: id } puts an archived project and its tasks back.
 */

export async function GET(request) {
  try {
    const includeArchived =
      new URL(request.url).searchParams.get("includeArchived") === "1";
    return NextResponse.json({ projects: await listProjects({ includeArchived }) });
  } catch (error) {
    console.error("GET /api/projects:", error);
    return NextResponse.json({ projects: [], error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body?.restore) {
      const result = await restoreProject(body.restore);
      const [projects, tasks] = await Promise.all([listProjects(), listTasks()]);
      return NextResponse.json({ ...result, projects, tasks });
    }
    const id = await createProject(body);
    return NextResponse.json({ id, projects: await listProjects() });
  } catch (error) {
    console.error("POST /api/projects:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    await updateProject(await request.json());
    // A rename changes the project name every task reports.
    const [projects, tasks] = await Promise.all([listProjects(), listTasks()]);
    return NextResponse.json({ projects, tasks });
  } catch (error) {
    console.error("PATCH /api/projects:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const result =
      params.get("purge") === "1"
        ? await purgeProject(id)
        : await deleteProject(id);

    const [projects, tasks] = await Promise.all([listProjects(), listTasks()]);
    return NextResponse.json({ ...result, projects, tasks });
  } catch (error) {
    console.error("DELETE /api/projects:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
