#!/usr/bin/env node
/**
 * One-off backfill: public/sample-*.csv  →  Turso / libSQL database.
 *
 *   npm run db:import -- --dry-run   parse, validate and report. Writes nothing.
 *   npm run db:import                import (upserts, so it is safe to re-run)
 *   npm run db:import -- --fresh     wipe the tables first, then import
 *
 * The whole import runs in one transaction: either all of it lands or none of it.
 *
 * Value normalisation applied here (the CSV is inconsistent about all three):
 *   status    Todo/todo → todo · "In Progress"/in-progress → in_progress
 *             on-hold/paused/blocked → on_hold
 *             Done/complete → completed · archived → archived
 *   priority  High/high → high · Critical → urgent · blank → medium
 *   estimate  free text ("2h", "90m", "1h 30m", "45") → integer minutes
 *
 * timeElapsed is read as MILLISECONDS, which is what taskSlice's
 * `elapsed += Date.now() - startTime` actually accumulates, and is converted
 * into one time_entries row per task with source='import'.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Papa from "papaparse";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path.join(process.cwd(), file));
  } catch {
    /* optional */
  }
}

const { databaseConfig, describeDbConfig } = await import(
  "../src/config/database.mjs"
);
const { getDb, applyPragmas } = await import("../src/lib/db/client.mjs");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FRESH = args.includes("--fresh");

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const warnings = [];
const warn = (msg) => warnings.push(msg);

/* ── value normalisation ─────────────────────────────────────────────────── */

const STATUS_MAP = {
  todo: "todo",
  to_do: "todo",
  new: "todo",
  pending: "todo",
  in_progress: "in_progress",
  inprogress: "in_progress",
  doing: "in_progress",
  started: "in_progress",
  on_hold: "on_hold",
  hold: "on_hold",
  paused: "on_hold",
  blocked: "on_hold",
  done: "completed",
  complete: "completed",
  completed: "completed",
  finished: "completed",
  archived: "archived",
  archive: "archived",
};

const PRIORITY_MAP = {
  low: "low",
  medium: "medium",
  normal: "medium",
  high: "high",
  urgent: "urgent",
  critical: "urgent",
  blocker: "urgent",
};

const slug = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

function normalizeStatus(raw, ctx) {
  const key = slug(raw);
  if (!key) return "todo";
  const mapped = STATUS_MAP[key];
  if (!mapped) {
    warn(`unknown status "${raw}" on ${ctx} — imported as 'todo'`);
    return "todo";
  }
  return mapped;
}

function normalizePriority(raw, ctx) {
  const key = slug(raw);
  if (!key) return "medium";
  const mapped = PRIORITY_MAP[key];
  if (!mapped) {
    warn(`unknown priority "${raw}" on ${ctx} — imported as 'medium'`);
    return "medium";
  }
  return mapped;
}

const PROJECT_STATUS = new Set(["active", "on_hold", "completed", "archived"]);
function normalizeProjectStatus(raw, ctx) {
  const key = slug(raw) || "active";
  if (PROJECT_STATUS.has(key)) return key;
  if (key === "hold" || key === "paused") return "on_hold";
  warn(`unknown project status "${raw}" on ${ctx} — imported as 'active'`);
  return "active";
}

/** "2h" · "90m" · "1h 30m" · "2.5 hours" · "45" → minutes, or null. */
function parseEstimateMinutes(raw, ctx) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return null;

  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(parseFloat(s));

  let minutes = 0;
  let matched = false;
  for (const [, value, unit] of s.matchAll(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|d|day|days)/g)) {
    matched = true;
    const n = parseFloat(value);
    if (unit.startsWith("h")) minutes += n * 60;
    else if (unit.startsWith("d")) minutes += n * 60 * 8; // 1 day = 8 working hours
    else minutes += n;
  }

  if (!matched) {
    warn(`could not read estimate "${raw}" on ${ctx} — left empty`);
    return null;
  }
  return Math.round(minutes);
}

function toIsoOrNull(raw, ctx, field) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    warn(`invalid ${field} "${raw}" on ${ctx} — left empty`);
    return null;
  }
  return d.toISOString();
}

const toBool = (raw) => {
  const s = String(raw ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" ? 1 : 0;
};

function parseJsonArray(raw, ctx, field) {
  const s = String(raw ?? "").trim();
  if (!s || s === "[]") return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    warn(`unreadable ${field} JSON on ${ctx} — skipped`);
    return [];
  }
}

const readCsv = (file) => {
  if (!fs.existsSync(file)) {
    throw new Error(`CSV not found: ${file}`);
  }
  const { data, errors } = Papa.parse(fs.readFileSync(file, "utf8"), {
    header: true,
    skipEmptyLines: true,
  });
  for (const e of errors.slice(0, 5)) {
    warn(`CSV parse issue in ${path.basename(file)} row ${e.row}: ${e.message}`);
  }
  return data;
};

/* ── build the rows ──────────────────────────────────────────────────────── */

const nowIso = new Date().toISOString();
let generatedIds = 0;
const genId = (prefix) => `${prefix}-${Date.now()}-${++generatedIds}`;

function buildProjects() {
  const rows = readCsv(databaseConfig.legacyCsv.projects);
  const projects = [];
  const byName = new Map();

  for (const [i, r] of rows.entries()) {
    const name = String(r.name ?? "").trim();
    if (!name) {
      warn(`projects row ${i + 2} has no name — skipped`);
      continue;
    }
    if (byName.has(name.toLowerCase())) {
      warn(`duplicate project "${name}" — keeping the first one`);
      continue;
    }

    const project = {
      id: String(r.id ?? "").trim() || genId("proj"),
      name,
      description: String(r.description ?? "").trim(),
      color: String(r.color ?? "").trim() || "#3B82F6",
      status: normalizeProjectStatus(r.status, `project "${name}"`),
      created_at: toIsoOrNull(r.createdAt, `project "${name}"`, "createdAt") ?? nowIso,
      updated_at: toIsoOrNull(r.updatedAt, `project "${name}"`, "updatedAt") ?? nowIso,
    };

    projects.push(project);
    byName.set(name.toLowerCase(), project);
  }

  return { projects, byName };
}

function buildTasks(projectsByName, projects) {
  const rows = readCsv(databaseConfig.legacyCsv.tasks);
  const tasks = [];
  const tags = [];
  const checkpoints = [];
  const documents = [];
  const timeEntries = [];
  const seenIds = new Set();

  for (const [i, r] of rows.entries()) {
    const title = String(r.title ?? "").trim();
    if (!title) {
      warn(`tasks row ${i + 2} has no title — skipped`);
      continue;
    }

    const ctx = `"${title.slice(0, 40)}"`;
    let id = String(r.id ?? "").trim();
    if (!id) id = genId("task");
    if (seenIds.has(id)) {
      warn(`duplicate task id ${id} (${ctx}) — later row wins`);
    }
    seenIds.add(id);

    /* project: match by name, create the project if the CSV never declared it */
    let projectId = null;
    const projectName = String(r.project ?? "").trim();
    if (projectName) {
      const found = projectsByName.get(projectName.toLowerCase());
      if (found) {
        projectId = found.id;
      } else {
        const created = {
          id: genId("proj"),
          name: projectName,
          description: "",
          color: "#3B82F6",
          status: "active",
          created_at: nowIso,
          updated_at: nowIso,
        };
        projects.push(created);
        projectsByName.set(projectName.toLowerCase(), created);
        projectId = created.id;
        warn(`project "${projectName}" existed only on tasks — created it`);
      }
    }

    const status = normalizeStatus(r.status, ctx);
    const createdAt = toIsoOrNull(r.createdAt, ctx, "createdAt") ?? nowIso;

    tasks.push({
      id,
      title,
      description: String(r.description ?? "").trim(),
      status,
      priority: normalizePriority(r.priority, ctx),
      project_id: projectId,
      due_date: toIsoOrNull(r.dueDate, ctx, "dueDate"),
      estimated_minutes: parseEstimateMinutes(r.estimatedTime, ctx),
      working_for: String(r.workingFor ?? "").trim(),
      working_with: String(r.workingWith ?? "").trim(),
      pinned: toBool(r.pinned),
      color_label: String(r.colorLabel ?? "").trim() || null,
      sort_order: i,
      created_at: createdAt,
      updated_at: nowIso,
      completed_at: status === "completed" ? createdAt : null,
      archived_at: status === "archived" ? createdAt : null,
    });

    /* tags: ';'-joined single cell */
    const rawTags = String(r.tags ?? "").trim();
    if (rawTags) {
      const unique = new Set(
        rawTags.split(";").map((t) => t.trim()).filter(Boolean),
      );
      for (const tag of unique) tags.push({ task_id: id, tag });
    }

    /* checkpoints: JSON array cell */
    parseJsonArray(r.checkpoints, ctx, "checkpoints").forEach((cp, idx) => {
      const text = String(cp?.text ?? "").trim();
      if (!text) return;
      const done = cp?.completed ? 1 : 0;
      const cpCreated = toIsoOrNull(cp?.createdAt, ctx, "checkpoint createdAt") ?? createdAt;
      checkpoints.push({
        id: String(cp?.id ?? "").trim() || genId("cp"),
        task_id: id,
        text,
        completed: done,
        position: idx,
        created_at: cpCreated,
        completed_at: done ? (toIsoOrNull(cp?.completedAt, ctx, "checkpoint completedAt") ?? cpCreated) : null,
      });
    });

    /* documents: JSON array cell */
    parseJsonArray(r.documents, ctx, "documents").forEach((doc) => {
      const name = String(doc?.name ?? "").trim();
      if (!name) return;
      documents.push({
        id: String(doc?.id ?? "").trim() || genId("doc"),
        task_id: id,
        name,
        url: String(doc?.url ?? "").trim(),
        type: String(doc?.type ?? "").trim() || "link",
        added_at: toIsoOrNull(doc?.addedAt, ctx, "document addedAt") ?? createdAt,
      });
    });

    /* tracked time: one summary entry per task */
    const elapsedMs = Number(r.timeElapsed);
    if (Number.isFinite(elapsedMs) && elapsedMs > 0) {
      const seconds = Math.round(elapsedMs / 1000);
      const start = new Date(createdAt);
      timeEntries.push({
        id: genId("time"),
        task_id: id,
        started_at: start.toISOString(),
        ended_at: new Date(start.getTime() + seconds * 1000).toISOString(),
        duration_seconds: seconds,
        source: "import",
        note: "Imported from sample-tasks.csv (timeElapsed)",
      });
    }
  }

  return { tasks, tags, checkpoints, documents, timeEntries };
}

/* ── write ───────────────────────────────────────────────────────────────── */

const insert = (table, row) => ({
  sql: `INSERT INTO ${table} (${Object.keys(row).join(", ")})
        VALUES (${Object.keys(row).map(() => "?").join(", ")})
        ON CONFLICT (${table === "task_tags" ? "task_id, tag" : "id"}) DO UPDATE SET
        ${Object.keys(row).filter((k) => k !== "id").map((k) => `${k} = excluded.${k}`).join(", ") || "id = id"}`,
  args: Object.values(row),
});

async function main() {
  console.log(`\n${c.bold("Database")}  ${describeDbConfig()}`);
  console.log(`${c.bold("Source")}    ${databaseConfig.legacyCsv.tasks}`);
  console.log(`          ${databaseConfig.legacyCsv.projects}\n`);

  const { projects, byName } = buildProjects();
  const { tasks, tags, checkpoints, documents, timeEntries } = buildTasks(byName, projects);

  console.log(`  projects      ${String(projects.length).padStart(4)}`);
  console.log(`  tasks         ${String(tasks.length).padStart(4)}`);
  console.log(`  tags          ${String(tags.length).padStart(4)}`);
  console.log(`  checkpoints   ${String(checkpoints.length).padStart(4)}`);
  console.log(`  documents     ${String(documents.length).padStart(4)}`);
  console.log(`  time entries  ${String(timeEntries.length).padStart(4)}`);

  const byStatus = tasks.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }), {});
  console.log(
    `\n  by status     ${Object.entries(byStatus).map(([k, v]) => `${k}=${v}`).join("  ")}`,
  );

  if (warnings.length) {
    console.log(`\n  ${c.yellow(`${warnings.length} warning(s)`)}`);
    for (const w of warnings.slice(0, 25)) console.log(`    ${c.dim("·")} ${w}`);
    if (warnings.length > 25) console.log(c.dim(`    … and ${warnings.length - 25} more`));
  }

  if (DRY_RUN) {
    console.log(c.dim("\n  Dry run — nothing was written.\n"));
    return;
  }

  const db = getDb();
  await applyPragmas(db);

  const tx = await db.transaction("write");
  try {
    if (FRESH) {
      for (const table of ["time_entries", "documents", "checkpoints", "task_tags", "comments", "activity_log", "tasks", "projects"]) {
        await tx.execute(`DELETE FROM ${table}`);
      }
      console.log(c.yellow("\n  --fresh: cleared existing rows"));
    }

    // Parents first so foreign keys resolve.
    for (const row of projects) await tx.execute(insert("projects", row));
    for (const row of tasks) await tx.execute(insert("tasks", row));

    // Children are replaced wholesale so a re-run never duplicates them.
    const taskIds = tasks.map((t) => t.id);
    for (const id of taskIds) {
      await tx.execute({ sql: "DELETE FROM task_tags   WHERE task_id = ?", args: [id] });
      await tx.execute({ sql: "DELETE FROM checkpoints WHERE task_id = ?", args: [id] });
      await tx.execute({ sql: "DELETE FROM documents   WHERE task_id = ?", args: [id] });
      await tx.execute({
        sql: "DELETE FROM time_entries WHERE task_id = ? AND source = 'import'",
        args: [id],
      });
    }

    for (const row of tags) await tx.execute(insert("task_tags", row));
    for (const row of checkpoints) await tx.execute(insert("checkpoints", row));
    for (const row of documents) await tx.execute(insert("documents", row));
    for (const row of timeEntries) await tx.execute(insert("time_entries", row));

    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }

  const counts = await db.execute(`
    SELECT
      (SELECT COUNT(*) FROM projects)     AS projects,
      (SELECT COUNT(*) FROM tasks)        AS tasks,
      (SELECT COUNT(*) FROM task_tags)    AS tags,
      (SELECT COUNT(*) FROM checkpoints)  AS checkpoints,
      (SELECT COUNT(*) FROM documents)    AS documents,
      (SELECT COUNT(*) FROM time_entries) AS time_entries
  `);

  console.log(c.green("\n  Imported. Rows now in the database:"));
  console.log(`  ${JSON.stringify(counts.rows[0], (_, v) => (typeof v === "bigint" ? Number(v) : v))}\n`);
}

try {
  await main();
} catch (err) {
  console.error(c.red(`\n  Import failed: ${err.message}`));
  console.error(c.dim("  Nothing was written — the transaction was rolled back.\n"));
  process.exitCode = 1;
} finally {
  try {
    getDb().close();
  } catch {
    /* nothing to close */
  }
}
