/**
 * Project repository.
 *
 * Renaming used to orphan every task in a project, because tasks referenced
 * projects by name string. Tasks now hold `project_id`, so a rename is a single
 * column update and the association survives it.
 */

import { query, execute, transaction, applyPragmas, now } from "../client.mjs";

const toDbStatus = (s) => {
  const k = String(s ?? "active").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["active", "on_hold", "completed", "archived"].includes(k)) return k;
  if (k === "hold" || k === "paused") return "on_hold";
  return "active";
};

export async function listProjects({ includeArchived = false } = {}) {
  await applyPragmas();
  const rows = await query(
    `SELECT p.*,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS total_tasks,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') AS completed_tasks,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id
               AND t.status NOT IN ('completed','archived')
               AND t.due_date IS NOT NULL
               AND t.due_date < strftime('%Y-%m-%dT%H:%M:%fZ','now')) AS overdue_tasks
       FROM projects p
      ${includeArchived ? "" : "WHERE p.status <> 'archived'"}
      ORDER BY p.sort_order, p.name`,
  );

  return rows.map((p) => ({
    id: String(p.id),
    name: p.name,
    description: p.description ?? "",
    color: p.color ?? "#3B82F6",
    status: String(p.status ?? "active").replace(/_/g, "-"),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    totalTasks: Number(p.total_tasks ?? 0),
    completedTasks: Number(p.completed_tasks ?? 0),
    overdueTasks: Number(p.overdue_tasks ?? 0),
  }));
}

export async function createProject(input) {
  await applyPragmas();
  const name = String(input?.name ?? "").trim();
  if (!name) throw new Error("A project needs a name");

  const clash = await query(
    `SELECT id FROM projects WHERE lower(name) = lower(?) LIMIT 1`,
    [name],
  );
  if (clash[0]) return String(clash[0].id);

  const id = input.id ? String(input.id) : `proj-${Date.now()}`;
  const ts = now();
  await execute(
    `INSERT INTO projects (id, name, description, color, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name,
      String(input.description ?? ""),
      input.color || "#3B82F6",
      toDbStatus(input.status),
      iso(input.createdAt) ?? ts,
      ts,
    ],
  );
  return id;
}

const iso = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export async function updateProject(input) {
  await applyPragmas();
  const id = String(input?.id ?? "");
  if (!id) throw new Error("updateProject requires an id");

  const prev = await query(`SELECT * FROM projects WHERE id = ? LIMIT 1`, [id]);
  if (!prev[0]) throw new Error(`No project ${id}`);

  const name =
    input.name !== undefined ? String(input.name).trim() : prev[0].name;
  if (!name) throw new Error("A project needs a name");

  const nextStatus =
    input.status !== undefined ? toDbStatus(input.status) : prev[0].status;

  const { rowsAffected } = await execute(
    `UPDATE projects SET name = ?, description = ?, color = ?, status = ?, updated_at = ?
      WHERE id = ?`,
    [
      name,
      input.description !== undefined ? String(input.description) : prev[0].description,
      input.color || prev[0].color,
      nextStatus,
      now(),
      id,
    ],
  );

  /* Moving a project out of "archived" by editing its status has to bring its
     tasks with it, or you end up with an active project whose work is stranded
     in the archive — invisible on the project but still counted as archived. */
  if (prev[0].status === "archived" && nextStatus !== "archived") {
    await restoreProjectTasks(id);
  }

  return rowsAffected > 0;
}

/**
 * Returns a project's archived tasks to the status they held when the project
 * was archived. Shared by restoreProject and by an un-archiving status edit.
 */
async function restoreProjectTasks(projectId) {
  const ts = now();
  const archived = await query(
    `SELECT id FROM tasks WHERE project_id = ? AND status = 'archived'`,
    [projectId],
  );
  if (archived.length === 0) return 0;

  const priors = await query(
    `SELECT entity_id, old_value FROM activity_log
      WHERE entity_type = 'task' AND action = 'archived_with_project' AND actor = ?
      ORDER BY id DESC`,
    [String(projectId)],
  );
  const priorStatus = {};
  for (const row of priors) {
    if (!(row.entity_id in priorStatus)) priorStatus[row.entity_id] = row.old_value;
  }

  await transaction(
    archived.map((t) => ({
      sql: `UPDATE tasks SET status = ?, archived_at = NULL, updated_at = ? WHERE id = ?`,
      args: [priorStatus[t.id] ?? "todo", ts, t.id],
    })),
  );
  return archived.length;
}

/**
 * "Deleting" a project archives it and archives its open tasks.
 *
 * The previous behaviour dropped the project row and let the foreign key null
 * out `project_id`, which left every task orphaned in the active list — and in
 * practice people then bulk-deleted them to clean up, losing the work. Nothing
 * here is destroyed: the project and its tasks move to the archive together,
 * keeping their association, and `restoreProject` puts them back.
 */
export async function deleteProject(idOrName) {
  await applyPragmas();
  const key = String(idOrName ?? "");
  const found = await query(
    `SELECT id, name FROM projects WHERE id = ? OR lower(name) = lower(?) LIMIT 1`,
    [key, key],
  );
  if (!found[0]) return { archived: false, archivedTasks: 0 };

  const { id, name } = found[0];
  const ts = now();

  /* Each task's current status is written to the audit log before it changes,
     so a restore can put every task back where it was instead of flattening
     them all to "todo". */
  const open = await query(
    `SELECT id, status FROM tasks WHERE project_id = ? AND status <> 'archived'`,
    [id],
  );

  await transaction([
    ...open.map((t) => ({
      sql: `INSERT INTO activity_log
              (entity_type, entity_id, action, field, old_value, new_value, actor, created_at)
            VALUES ('task', ?, 'archived_with_project', 'status', ?, 'archived', ?, ?)`,
      args: [t.id, t.status, String(id), ts],
    })),
    {
      sql: `UPDATE tasks SET status = 'archived', archived_at = ?, updated_at = ?
             WHERE project_id = ? AND status <> 'archived'`,
      args: [ts, ts, id],
    },
    {
      sql: `UPDATE projects SET status = 'archived', updated_at = ? WHERE id = ?`,
      args: [ts, id],
    },
    {
      sql: `INSERT INTO activity_log
              (entity_type, entity_id, action, field, old_value, new_value, actor, created_at)
            VALUES ('project', ?, 'archived', 'status', 'active', 'archived', '', ?)`,
      args: [id, ts],
    },
  ]);

  return { archived: true, id, name, archivedTasks: open.length };
}

/**
 * Puts an archived project back, returning each task to the status it held when
 * the project was archived (read from the audit log, defaulting to "todo").
 */
export async function restoreProject(idOrName) {
  await applyPragmas();
  const key = String(idOrName ?? "");
  const found = await query(
    `SELECT id, name FROM projects WHERE id = ? OR lower(name) = lower(?) LIMIT 1`,
    [key, key],
  );
  if (!found[0]) return { restored: false, restoredTasks: 0 };

  const { id, name } = found[0];
  const ts = now();

  const restoredTasks = await restoreProjectTasks(id);

  await transaction([
    {
      sql: `UPDATE projects SET status = 'active', updated_at = ? WHERE id = ?`,
      args: [ts, id],
    },
    {
      sql: `INSERT INTO activity_log (entity_type, entity_id, action, actor, created_at)
            VALUES ('project', ?, 'restored', '', ?)`,
      args: [id, ts],
    },
  ]);

  return { restored: true, id, name, restoredTasks };
}

/**
 * Permanent removal — only reachable from an explicit purge request, never from
 * the normal delete button. Tasks are kept and unassigned rather than destroyed.
 */
export async function purgeProject(idOrName) {
  await applyPragmas();
  const key = String(idOrName ?? "");
  const found = await query(
    `SELECT id FROM projects WHERE id = ? OR lower(name) = lower(?) LIMIT 1`,
    [key, key],
  );
  if (!found[0]) return { purged: false, unassignedTasks: 0 };

  const affected = await query(
    `SELECT COUNT(*) AS n FROM tasks WHERE project_id = ?`,
    [found[0].id],
  );

  await transaction([
    { sql: `DELETE FROM projects WHERE id = ?`, args: [found[0].id] },
    {
      sql: `INSERT INTO activity_log (entity_type, entity_id, action, actor, created_at)
            VALUES ('project', ?, 'purged', '', ?)`,
      args: [found[0].id, now()],
    },
  ]);

  return { purged: true, unassignedTasks: Number(affected[0]?.n ?? 0) };
}
