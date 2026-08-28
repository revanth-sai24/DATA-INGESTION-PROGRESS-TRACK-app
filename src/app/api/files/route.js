import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { query, queryOne, execute, now } from "@/lib/db/client.mjs";

/**
 * Attachment storage.
 *
 *   POST   /api/files      multipart: file + task_id   → saves and records it
 *   GET    /api/files?id=  streams the stored file back
 *   DELETE /api/files?id=  removes the row and the file on disk
 *
 * Files live outside the database, under data/uploads, with the row in
 * `documents` holding the pointer. Names are never taken from the client: the
 * stored name is the document id plus the original extension, so a crafted
 * filename cannot escape the directory.
 */

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 25 * 1024 * 1024;

const extOf = (name) => {
  const ext = path.extname(String(name || "")).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
};

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const taskId = String(form.get("task_id") || "").trim();

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!taskId) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File is larger than ${MAX_BYTES / 1024 / 1024}MB` },
        { status: 413 },
      );
    }

    const task = await queryOne(`SELECT id FROM tasks WHERE id = ?`, [taskId]);
    if (!task) {
      return NextResponse.json({ error: "task not found" }, { status: 404 });
    }

    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const stored = `${id}${extOf(file.name)}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(
      path.join(UPLOAD_DIR, stored),
      Buffer.from(await file.arrayBuffer()),
    );

    await execute(
      `INSERT INTO documents (id, task_id, name, url, type, added_at, size_bytes, storage_path)
       VALUES (?, ?, ?, ?, 'file', ?, ?, ?)`,
      [
        id,
        taskId,
        String(file.name || "attachment"),
        `/api/files?id=${encodeURIComponent(id)}`,
        now(),
        file.size,
        stored,
      ],
    );

    return NextResponse.json({
      document: {
        id,
        name: String(file.name || "attachment"),
        url: `/api/files?id=${encodeURIComponent(id)}`,
        type: "file",
        size: file.size,
      },
    });
  } catch (error) {
    console.error("files POST failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const doc = await queryOne(`SELECT * FROM documents WHERE id = ?`, [id]);
    if (!doc?.storage_path) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    /* basename() so a stored path can only ever resolve inside UPLOAD_DIR. */
    const full = path.join(UPLOAD_DIR, path.basename(doc.storage_path));
    const info = await stat(full).catch(() => null);
    if (!info) return NextResponse.json({ error: "file missing" }, { status: 410 });

    return new NextResponse(createReadStream(full), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(info.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.name)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("files GET failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const doc = await queryOne(`SELECT * FROM documents WHERE id = ?`, [id]);
    if (doc?.storage_path) {
      await unlink(path.join(UPLOAD_DIR, path.basename(doc.storage_path))).catch(
        () => {},
      );
    }
    await execute(`DELETE FROM documents WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("files DELETE failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
