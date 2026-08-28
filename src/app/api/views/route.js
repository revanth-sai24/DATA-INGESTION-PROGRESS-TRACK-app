import { NextResponse } from "next/server";
import { queryOne, execute, now } from "@/lib/db/client.mjs";

/**
 * Saved views — a named filter + sort you can come back to.
 *
 *   GET    /api/views          list them
 *   POST   /api/views          save one (same name overwrites)
 *   DELETE /api/views?name=    remove one
 *
 * The whole list lives under a single `saved_views` key in app_settings: there
 * are only ever a handful, and keeping them together makes reordering and
 * rewriting a single write.
 */

const KEY = "saved_views";

async function readViews() {
  const row = await queryOne(`SELECT value FROM app_settings WHERE key = ?`, [KEY]);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    /* A corrupt value should not take the screen down with it. */
    return [];
  }
}

async function writeViews(views) {
  await execute(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [KEY, JSON.stringify(views), now()],
  );
}

export async function GET() {
  try {
    return NextResponse.json({ views: await readViews() });
  } catch (error) {
    console.error("views GET failed:", error);
    return NextResponse.json({ views: [], error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "A view needs a name" }, { status: 400 });
    }
    if (name.length > 40) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    const view = {
      name,
      filter: {
        search: String(body?.filter?.search ?? ""),
        status: String(body?.filter?.status ?? ""),
        priority: String(body?.filter?.priority ?? ""),
        project: String(body?.filter?.project ?? ""),
      },
      sort: {
        key: String(body?.sort?.key ?? "createdAt"),
        dir: body?.sort?.dir === "asc" ? "asc" : "desc",
      },
      createdAt: now(),
    };

    const views = await readViews();
    const at = views.findIndex((v) => v.name.toLowerCase() === name.toLowerCase());
    if (at >= 0) views[at] = view;
    else views.push(view);

    await writeViews(views.slice(0, 20));
    return NextResponse.json({ views: await readViews() });
  } catch (error) {
    console.error("views POST failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const name = new URL(request.url).searchParams.get("name");
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const views = await readViews();
    await writeViews(views.filter((v) => v.name.toLowerCase() !== name.toLowerCase()));
    return NextResponse.json({ views: await readViews() });
  } catch (error) {
    console.error("views DELETE failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
