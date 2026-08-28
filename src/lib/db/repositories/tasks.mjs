/**
 * Task repository — the only place that knows SQL for tasks.
 *
 * Translates between the database shape (snake_case, `in_progress`, project_id)
 * and the shape the app has always used (camelCase, `in-progress`, a project
 * *name* string). Keeping that translation here means the UI and Redux need no
 * changes to move off CSV.
 */

import { query, execute, transaction, getDb, applyPragmas, now } from "../client.mjs";

/* ── vocabulary translation ─────────────────────────────────────────────── */

const toDbStatus = (s) => {
  const k = String(s ?? "todo").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return ["todo", "in_progress", "on_hold", "completed", "archived"].includes(k)
    ? k
    : "todo";
};
const toAppStatus = (s) => String(s ?? "todo").replace(/_/g, "-");

const toDbPriority = (p) => {
  const k = String(p ?? "medium").trim().toLowerCase();
  if (k === "critical" || k === "urgent") return "urgent";
  return ["low", "medium", "high"].includes(k) ? k : "medium";
};

/** Free text ("2h", "1h 30m", "45") → integer minutes. */
export function parseEstimate(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(parseFloat(s));
  let mins = 0;
  let hit = false;
  for (const [, n, u] of s.matchAll(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|d|day|days)/g)) {
    hit = true;
    const v = parseFloat(n);
    mins += u.startsWith("h") ? v * 60 : u.startsWith("d") ? v * 480 : v;
  }
  return hit ? Math.round(mins) : null;
}

const iso = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/* ── read ───────────────────────────────────────────────────────────────── */

/** Every task, in the shape the Redux store and components already expect. */
export async function listTasks() {
  const db = getDb();
  await applyPragmas(db);

  const [tasks, tags, checkpoints, documents, comments, times] = await Promise.all([
    query(`SELECT t.*, p.name AS project_name
             FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
         ORDER BY t.sort_order, t.created_at DESC`),
    query(`SELECT task_id, tag FROM task_tags`),
    query(`SELECT * FROM checkpoints ORDER BY position, created_at`),
    query(`SELECT * FROM documents ORDER BY added_at`),
    query(`SELECT * FROM comments ORDER BY created_at`),
    query(`SELECT task_id,
                  SUM(COALESCE(duration_seconds, 0)) AS secs,
                  MAX(CASE WHEN ended_at IS NULL THEN started_at END) AS running_since
             FROM time_entries GROUP BY task_id`),
  ]);

  const group = (rows, key = "task_id") =>
    rows.reduce((acc, r) => ((acc[r[key]] ??= []).push(r), acc), {});

  const byTag = group(tags);
  const byCp = group(checkpoints);
  const byDoc = group(documents);
  const byCom = group(comments);
  const byTime = Object.fromEntries(times.map((t) => [t.task_id, t]));

  return tasks.map((t) => {
    const time = byTime[t.id];
    const running = Boolean(time?.running_since);
    return {
      id: t.id,
      title: t.title,
      description: t.description ?? "",
      status: toAppStatus(t.status),
      priority: t.priority,
      project: t.project_name ?? "",
      dueDate: t.due_date,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      completedAt: t.completed_at,
      archivedAt: t.archived_at,
      estimatedTime: t.estimated_minutes ?? "",
      workingFor: t.working_for ?? "",
      workingWith: t.working_with ?? "",
      pinned: Boolean(t.pinned),
      colorLabel: t.color_label ?? null,
      recurrence: t.recurrence ?? "",
      sortOrder: t.sort_order ?? 0,
      tags: (byTag[t.id] ?? []).map((r) => r.tag),
      checkpoints: (byCp[t.id] ?? []).map((c) => ({
        id: c.id,
        text: c.text,
        completed: Boolean(c.completed),
        createdAt: c.created_at,
        completedAt: c.completed_at,
      })),
      documents: (byDoc[t.id] ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        url: d.url,
        type: d.type,
        addedAt: d.added_at,
      })),
      comments: (byCom[t.id] ?? []).map((c) => ({
        id: c.id,
        author: c.author,
        text: c.body,
        createdAt: c.created_at,
      })),
      timeTracking: {
        elapsed: Number(time?.secs ?? 0) * 1000,
        isRunning: running,
        startTime: running ? new Date(time.running_since).getTime() : null,
      },
    };
  });
}

/* ── write ──────────────────────────────────────────────────────────────── */

/** Resolves a project *name* to an id, creating the project if it is new. */
/**
 * Look up a project by name.
 *
 * This used to create the project whenever the name was not recognised, which
 * meant a one-character typo in a task's project field silently produced a
 * whole new project — indistinguishable from a real one, and only noticeable
 * later on the Projects screen. Creation is now something the caller has to
 * ask for, so it can only happen where the user actually meant it.
 */
async function resolveProjectId(name, { allowCreate = false } = {}) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return null;

  const found = await query(
    `SELECT id FROM projects WHERE lower(name) = lower(?) LIMIT 1`,
    [trimmed],
  );
  if (found[0]) return found[0].id;

  if (!allowCreate) {
    const err = new Error(`There is no project called "${trimmed}".`);
    err.code = "UNKNOWN_PROJECT";
    throw err;
  }

  const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await execute(
    `INSERT INTO projects (id, name, description, color, status, created_at, updated_at)
     VALUES (?, ?, '', '#3B82F6', 'active', ?, ?)`,
    [id, trimmed, now(), now()],
  );
  return id;
}

/** Child rows are replaced wholesale — simpler and safer than diffing. */
function childStatements(taskId, input) {
  const stmts = [
    { sql: `DELETE FROM task_tags   WHERE task_id = ?`, args: [taskId] },
    { sql: `DELETE FROM checkpoints WHERE task_id = ?`, args: [taskId] },
    { sql: `DELETE FROM documents   WHERE task_id = ?`, args: [taskId] },
  ];

  for (const tag of new Set((input.tags ?? []).map((t) => String(t).trim()).filter(Boolean))) {
    stmts.push({
      sql: `INSERT INTO task_tags (task_id, tag) VALUES (?, ?)`,
      args: [taskId, tag],
    });
  }

  (input.checkpoints ?? []).forEach((cp, i) => {
    const text = String(cp?.text ?? "").trim();
    if (!text) return;
    const done = cp?.completed ? 1 : 0;
    stmts.push({
      sql: `INSERT INTO checkpoints (id, task_id, text, completed, position, created_at, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        String(cp.id ?? `cp-${Date.now()}-${i}`),
        taskId,
        text,
        done,
        i,
        iso(cp.createdAt) ?? now(),
        done ? (iso(cp.completedAt) ?? now()) : null,
      ],
    });
  });

  (input.documents ?? []).forEach((d, i) => {
    const name = String(d?.name ?? "").trim();
    if (!name) return;
    stmts.push({
      sql: `INSERT INTO documents (id, task_id, name, url, type, added_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        String(d.id ?? `doc-${Date.now()}-${i}`),
        taskId,
        name,
        String(d.url ?? ""),
        String(d.type ?? "link"),
        iso(d.addedAt) ?? now(),
      ],
    });
  });

  return stmts;
}

/** Cadences a task can repeat on. Anything else means "does not repeat". */
export const RECURRENCES = ["daily", "weekdays", "weekly", "fortnightly", "monthly"];

const normaliseRecurrence = (v) => {
  const r = String(v ?? "").trim().toLowerCase();
  return RECURRENCES.includes(r) ? r : null;
};

/**
 * The next due date for a cadence, as YYYY-MM-DD.
 *
 * Rolls forward from the completed occurrence's own due date so a series does
 * not drift when you finish something late; if it had no due date, from today.
 * "weekdays" skips the weekend rather than landing on a Saturday.
 */
export function nextDueDate(recurrence, from) {
  const base = from ? new Date(from) : new Date();
  if (Number.isNaN(base.getTime())) return null;
  if (!RECURRENCES.includes(recurrence)) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* Monthly keeps the original day of the month as its anchor. Stepping one
     month at a time from the last result loses it: a task due the 31st gets
     clamped to the 28th by February and stays on the 28th forever. */
  if (recurrence === "monthly") {
    const anchor = base.getDate();
    for (let n = 1; n <= 400; n += 1) {
      const d = new Date(base.getFullYear(), base.getMonth() + n, 1);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(anchor, last));
      if (d >= today) return toKey(d);
    }
    return null;
  }

  const step = (d) => {
    switch (recurrence) {
      case "daily":
        d.setDate(d.getDate() + 1);
        break;
      case "weekdays":
        do {
          d.setDate(d.getDate() + 1);
        } while (d.getDay() === 0 || d.getDay() === 6);
        break;
      case "weekly":
        d.setDate(d.getDate() + 7);
        break;
      case "fortnightly":
        d.setDate(d.getDate() + 14);
        break;
      default:
        break;
    }
    return d;
  };

  /* A cadence shorter than how late you are would schedule the next occurrence
     in the past, so keep stepping until it lands ahead of today. */
  const d = step(new Date(base));
  for (let guard = 0; d < today && guard < 400; guard += 1) step(d);
  return toKey(d);
}

/** Local YYYY-MM-DD — toISOString would shift the day for anyone east of UTC. */
function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export async function createTask(input) {
  const db = getDb();
  await applyPragmas(db);

  const id = input.id || `task-${Date.now()}`;
  const status = toDbStatus(input.status);
  const projectId = await resolveProjectId(input.project, {
    allowCreate: input.allowNewProject === true,
  });
  const ts = now();

  const maxOrder = await query(`SELECT COALESCE(MAX(sort_order), 0) AS m FROM tasks`);

  await transaction([
    {
      sql: `INSERT INTO tasks
            (id, title, description, status, priority, project_id, due_date,
             estimated_minutes, working_for, working_with, pinned, color_label,
             sort_order, created_at, updated_at, completed_at, archived_at,
             recurrence, recurrence_parent)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id,
        String(input.title ?? "").trim(),
        String(input.description ?? ""),
        status,
        toDbPriority(input.priority),
        projectId,
        iso(input.dueDate),
        parseEstimate(input.estimatedTime),
        String(input.workingFor ?? ""),
        String(input.workingWith ?? ""),
        input.pinned ? 1 : 0,
        input.colorLabel || null,
        Number(maxOrder[0]?.m ?? 0) + 1,
        iso(input.createdAt) ?? ts,
        ts,
        status === "completed" ? (iso(input.completedAt) ?? ts) : null,
        status === "archived" ? (iso(input.archivedAt) ?? ts) : null,
        normaliseRecurrence(input.recurrence),
        input.recurrenceParent ?? null,
      ],
    },
    ...childStatements(id, input),
    {
      sql: `INSERT INTO activity_log (entity_type, entity_id, action, actor, created_at)
            VALUES ('task', ?, 'created', '', ?)`,
      args: [id, ts],
    },
  ]);

  return id;
}

export async function updateTask(input) {
  const db = getDb();
  await applyPragmas(db);

  const id = input.id;
  if (!id) throw new Error("updateTask requires an id");

  const existing = await query(`SELECT * FROM tasks WHERE id = ? LIMIT 1`, [id]);
  if (!existing[0]) {
    /* This used to fall through to createTask, so an edit aimed at a task that
       no longer existed quietly produced a second one — with its own project
       to match. */
    const err = new Error(`Task ${id} no longer exists.`);
    err.code = "TASK_NOT_FOUND";
    throw err;
  }
  const prev = existing[0];

  const status = toDbStatus(input.status ?? toAppStatus(prev.status));
  const projectId =
    input.project !== undefined
      ? await resolveProjectId(input.project, {
          allowCreate: input.allowNewProject === true,
        })
      : prev.project_id;
  const ts = now();

  /* completed_at / archived_at are derived from the transition, which is what
     makes trend charts work — the CSV never stored either. */
  const completedAt =
    status === "completed" ? prev.completed_at ?? iso(input.completedAt) ?? ts : null;
  const archivedAt =
    status === "archived" ? prev.archived_at ?? iso(input.archivedAt) ?? ts : null;

  const stmts = [
    {
      sql: `UPDATE tasks SET
              title = ?, description = ?, status = ?, priority = ?, project_id = ?,
              due_date = ?, estimated_minutes = ?, working_for = ?, working_with = ?,
              pinned = ?, color_label = ?, updated_at = ?, completed_at = ?, archived_at = ?,
              recurrence = ?
            WHERE id = ?`,
      args: [
        input.title !== undefined ? String(input.title).trim() : prev.title,
        input.description !== undefined ? String(input.description) : prev.description,
        status,
        input.priority !== undefined ? toDbPriority(input.priority) : prev.priority,
        projectId,
        input.dueDate !== undefined ? iso(input.dueDate) : prev.due_date,
        input.estimatedTime !== undefined
          ? parseEstimate(input.estimatedTime)
          : prev.estimated_minutes,
        input.workingFor !== undefined ? String(input.workingFor) : prev.working_for,
        input.workingWith !== undefined ? String(input.workingWith) : prev.working_with,
        input.pinned !== undefined ? (input.pinned ? 1 : 0) : prev.pinned,
        input.colorLabel !== undefined ? input.colorLabel || null : prev.color_label,
        ts,
        completedAt,
        archivedAt,
        input.recurrence !== undefined
          ? normaliseRecurrence(input.recurrence)
          : prev.recurrence,
        id,
      ],
    },
  ];

  // Only rewrite children when the caller actually supplied them.
  if (input.tags !== undefined || input.checkpoints !== undefined || input.documents !== undefined) {
    const current = await Promise.all([
      query(`SELECT tag FROM task_tags WHERE task_id = ?`, [id]),
      query(`SELECT * FROM checkpoints WHERE task_id = ? ORDER BY position`, [id]),
      query(`SELECT * FROM documents WHERE task_id = ?`, [id]),
    ]);
    stmts.push(
      ...childStatements(id, {
        tags: input.tags ?? current[0].map((r) => r.tag),
        checkpoints:
          input.checkpoints ??
          current[1].map((c) => ({ ...c, completed: Boolean(c.completed), createdAt: c.created_at })),
        documents: input.documents ?? current[2].map((d) => ({ ...d, addedAt: d.added_at })),
      }),
    );
  }

  if (prev.status !== status) {
    stmts.push({
      sql: `INSERT INTO activity_log (entity_type, entity_id, action, field, old_value, new_value, actor, created_at)
            VALUES ('task', ?, 'updated', 'status', ?, ?, '', ?)`,
      args: [id, prev.status, status, ts],
    });

    /* The daily log line is written here rather than in the Today screen, so
       completing a task from the task list, the board or a context menu logs
       it too. Previously only Today wrote the line, which is why "Done today"
       and the log could disagree with no way to tell why.

       `logDate` comes from the client's local calendar day — the server runs in
       UTC, and after 18:30 UTC the user's day has already rolled over. */
    const logDate =
      typeof input.logDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.logDate)
        ? input.logDate
        : ts.slice(0, 10);

    if (status === "completed") {
      stmts.push({
        sql: `INSERT INTO work_log (id, log_date, entry, project, task_id, minutes, source, created_at, updated_at)
              SELECT ?, ?, ?, ?, ?, NULL, 'auto', ?, ?
               WHERE NOT EXISTS (
                 SELECT 1 FROM work_log
                  WHERE task_id = ? AND source = 'auto' AND log_date = ?
               )`,
        args: [
          `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          logDate,
          `Completed: ${input.title ?? prev.title}`,
          input.project !== undefined ? String(input.project ?? "") : "",
          id,
          ts,
          ts,
          id,
          logDate,
        ],
      });
    } else if (prev.status === "completed") {
      // Un-completing removes the line the completion generated.
      stmts.push({
        sql: `DELETE FROM work_log WHERE task_id = ? AND source = 'auto' AND log_date = ?`,
        args: [id, logDate],
      });
    }
  }

  /* A recurring task that has just been completed spawns its next occurrence.
     The completed one stays as it is, so the series reads as history rather
     than one row whose due date keeps moving. */
  const cadence = normaliseRecurrence(
    input.recurrence !== undefined ? input.recurrence : prev.recurrence,
  );
  if (cadence && status === "completed" && prev.status !== "completed") {
    const due = nextDueDate(cadence, prev.due_date || ts);
    const nextId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    stmts.push({
      sql: `INSERT INTO tasks
              (id, title, description, status, priority, project_id, due_date,
               estimated_minutes, working_for, working_with, pinned, color_label,
               sort_order, created_at, updated_at, completed_at, archived_at,
               recurrence, recurrence_parent)
            SELECT ?, title, description, 'todo', priority, project_id, ?,
                   estimated_minutes, working_for, working_with, 0, color_label,
                   sort_order, ?, ?, NULL, NULL, recurrence, ?
              FROM tasks WHERE id = ?`,
      args: [nextId, due, ts, ts, id, id],
    });
    /* Tags carry over; checkpoints and notes belong to the occurrence that
       had them. */
    stmts.push({
      sql: `INSERT INTO task_tags (task_id, tag) SELECT ?, tag FROM task_tags WHERE task_id = ?`,
      args: [nextId, id],
    });
    stmts.push({
      sql: `INSERT INTO activity_log (entity_type, entity_id, action, field, new_value, actor, created_at)
            VALUES ('task', ?, 'created', 'recurrence', ?, ?, ?)`,
      args: [nextId, cadence, id, ts],
    });
  }

  await transaction(stmts);
  return id;
}

export async function deleteTask(id) {
  await applyPragmas();

  // Remember the project so an emptied-out archived project can be tidied up.
  const owner = await query(`SELECT project_id FROM tasks WHERE id = ? LIMIT 1`, [id]);
  const projectId = owner[0]?.project_id ?? null;

  // Children cascade via foreign keys. work_log does not — it has no key, by
  // design — so it is handled explicitly: lines the app wrote go with the task,
  // lines the user typed keep their text and lose the dead link.
  await transaction([
    { sql: `DELETE FROM work_log WHERE task_id = ? AND source = 'auto'`, args: [id] },
    { sql: `UPDATE work_log SET task_id = NULL WHERE task_id = ?`, args: [id] },
    { sql: `DELETE FROM tasks WHERE id = ?`, args: [id] },
    {
      sql: `INSERT INTO activity_log (entity_type, entity_id, action, actor, created_at)
            VALUES ('task', ?, 'deleted', '', ?)`,
      args: [id, now()],
    },
  ]);

  /* An archived project with no tasks left has nothing to restore, so it is
     removed rather than lingering in the archive as an empty row. Only archived
     projects are touched — an active project is allowed to be empty. */
  if (projectId) {
    const left = await query(
      `SELECT (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS n, p.status
         FROM projects p WHERE p.id = ? LIMIT 1`,
      [projectId],
    );
    if (left[0] && Number(left[0].n) === 0 && left[0].status === "archived") {
      await transaction([
        { sql: `DELETE FROM projects WHERE id = ?`, args: [projectId] },
        {
          sql: `INSERT INTO activity_log (entity_type, entity_id, action, field, actor, created_at)
                VALUES ('project', ?, 'purged', 'empty_archived', '', ?)`,
          args: [projectId, now()],
        },
      ]);
    }
  }
}

/** Board ordering — persists what drag-and-drop previously threw away. */
/**
 * Persist card order.
 *
 * This used to accept a `status` alongside the order and write it straight to
 * the row, which let the board move a card out of Done without clearing
 * completed_at or the work-log line the completion had written. Ordering is all
 * this does now; a status change has to go through updateTask, where the
 * transition is handled once for every screen.
 */
export async function reorderTasks(ordered = []) {
  if (ordered.length === 0) return;
  await transaction(
    ordered.map(({ id, sortOrder }, i) => ({
      sql: `UPDATE tasks SET sort_order = ? WHERE id = ?`,
      args: [sortOrder ?? i, id],
    })),
  );
}
