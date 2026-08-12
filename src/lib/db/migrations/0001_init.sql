-- =============================================================================
-- 0001_init.sql — initial schema for the tracking app (Turso / libSQL)
-- =============================================================================
-- Replaces the CSV files in public/ with a real relational schema.
--
-- Design notes:
--   * All timestamps are ISO-8601 UTC strings ('2026-01-14T07:28:49.903Z'), the
--     same format JS `new Date().toISOString()` produces — so no conversion layer.
--   * Status and priority vocabularies are locked down with CHECK constraints.
--     The app currently mixes 'Todo'/'todo' and 'Done'/'completed'; the canonical
--     set below is lowercase and snake_case. The importer normalizes old values.
--   * Things that were JSON blobs stuffed into CSV cells (checkpoints, documents)
--     become real tables, so they can be queried, counted and indexed.
--   * comments and time_entries are new: the app has UI for both but the CSV had
--     nowhere to put them, so the data was being thrown away on every reload.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '#3B82F6',
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
  sort_order  REAL NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);


-- ─────────────────────────────────────────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',

  -- Matches the columns the Kanban board and the status filter actually offer.
  status            TEXT NOT NULL DEFAULT 'todo'
                    CHECK (status IN ('todo', 'in_progress', 'on_hold', 'completed', 'archived')),
  priority          TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- SET NULL rather than CASCADE: deleting a project must never delete work history.
  project_id        TEXT REFERENCES projects (id) ON DELETE SET NULL,

  due_date          TEXT,
  estimated_minutes INTEGER,

  working_for       TEXT NOT NULL DEFAULT '',   -- who the task is for (stakeholder)
  working_with      TEXT NOT NULL DEFAULT '',   -- who it is being done with (team)

  pinned            INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  color_label       TEXT,
  sort_order        REAL NOT NULL DEFAULT 0,    -- manual ordering on the Kanban board

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at      TEXT,
  archived_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_project    ON tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date   ON tasks (due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_pinned     ON tasks (pinned) WHERE pinned = 1;
CREATE INDEX IF NOT EXISTS idx_tasks_board      ON tasks (status, sort_order);


-- ─────────────────────────────────────────────────────────────────────────────
-- task_tags  (was: a ';'-joined string in one CSV cell)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_tags (
  task_id TEXT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  PRIMARY KEY (task_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags (tag);


-- ─────────────────────────────────────────────────────────────────────────────
-- checkpoints  (was: a JSON array in one CSV cell)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checkpoints (
  id           TEXT PRIMARY KEY,
  task_id      TEXT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  completed    INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_task ON checkpoints (task_id, position);


-- ─────────────────────────────────────────────────────────────────────────────
-- documents  (was: a JSON array in one CSV cell — mostly SharePoint links)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id       TEXT PRIMARY KEY,
  task_id  TEXT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  url      TEXT NOT NULL DEFAULT '',
  type     TEXT NOT NULL DEFAULT 'link',
  added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_task ON documents (task_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- comments  (NEW — the CommentDrawer UI exists but had no storage)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  author     TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_task ON comments (task_id, created_at);


-- ─────────────────────────────────────────────────────────────────────────────
-- time_entries  (NEW — replaces the single `timeElapsed` counter)
--
-- One row per work session. A row with ended_at IS NULL is a timer that is
-- currently running, which is what makes a timer survive a page refresh.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_entries (
  id               TEXT PRIMARY KEY,
  task_id          TEXT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  started_at       TEXT NOT NULL,
  ended_at         TEXT,
  duration_seconds INTEGER,   -- NULL while running; set when the timer stops
  source           TEXT NOT NULL DEFAULT 'timer'
                   CHECK (source IN ('timer', 'manual', 'focus', 'import')),
  note             TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_time_entries_task    ON time_entries (task_id, started_at);
CREATE INDEX IF NOT EXISTS idx_time_entries_started ON time_entries (started_at);

-- At most one running timer per task, enforced by the database.
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_entries_running
  ON time_entries (task_id) WHERE ended_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- activity_log  (NEW — audit trail: what changed, when)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'project')),
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL,          -- created | updated | deleted | archived | restored
  field       TEXT,                   -- which column changed, for 'updated'
  old_value   TEXT,
  new_value   TEXT,
  actor       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_entity  ON activity_log (entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log (created_at);


-- ─────────────────────────────────────────────────────────────────────────────
-- app_settings  (NEW — key/value store for UI preferences: theme, saved views…)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,           -- JSON-encoded
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);


-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers: keep updated_at honest without the app having to remember.
-- The WHEN guard lets the app still set updated_at explicitly if it wants to.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER IF NOT EXISTS trg_tasks_updated_at
AFTER UPDATE ON tasks FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE tasks SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_projects_updated_at
AFTER UPDATE ON projects FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE projects SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_comments_updated_at
AFTER UPDATE ON comments FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE comments SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;


-- ─────────────────────────────────────────────────────────────────────────────
-- Views: the aggregates the dashboard needs, computed by the database.
-- ─────────────────────────────────────────────────────────────────────────────

-- Total tracked seconds per task (finished sessions only).
CREATE VIEW IF NOT EXISTS v_task_time_totals AS
SELECT task_id,
       COALESCE(SUM(duration_seconds), 0) AS total_seconds,
       COUNT(*)                           AS session_count,
       MAX(ended_at)                      AS last_worked_at
FROM time_entries
WHERE ended_at IS NOT NULL
GROUP BY task_id;

-- One row per task with its rollups — the shape the task list actually renders.
CREATE VIEW IF NOT EXISTS v_task_overview AS
SELECT
  t.*,
  p.name                                        AS project_name,
  p.color                                       AS project_color,
  COALESCE(tt.total_seconds, 0)                 AS tracked_seconds,
  (SELECT COUNT(*) FROM checkpoints c WHERE c.task_id = t.id)                    AS checkpoint_count,
  (SELECT COUNT(*) FROM checkpoints c WHERE c.task_id = t.id AND c.completed = 1) AS checkpoint_done,
  (SELECT COUNT(*) FROM comments  cm WHERE cm.task_id = t.id)                    AS comment_count,
  (SELECT COUNT(*) FROM documents d  WHERE d.task_id = t.id)                     AS document_count,
  (SELECT GROUP_CONCAT(tg.tag, ';') FROM task_tags tg WHERE tg.task_id = t.id)   AS tags
FROM tasks t
LEFT JOIN projects p            ON p.id = t.project_id
LEFT JOIN v_task_time_totals tt ON tt.task_id = t.id;

-- Per-project progress, for the dashboard cards and charts.
CREATE VIEW IF NOT EXISTS v_project_progress AS
SELECT
  p.id,
  p.name,
  p.color,
  p.status,
  COUNT(t.id)                                                   AS total_tasks,
  SUM(CASE WHEN t.status = 'completed'   THEN 1 ELSE 0 END)      AS completed_tasks,
  SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END)      AS in_progress_tasks,
  SUM(CASE WHEN t.status = 'on_hold'     THEN 1 ELSE 0 END)      AS on_hold_tasks,
  SUM(CASE WHEN t.status = 'todo'        THEN 1 ELSE 0 END)      AS todo_tasks,
  SUM(CASE WHEN t.status NOT IN ('completed', 'archived')
            AND t.due_date IS NOT NULL
            AND t.due_date < strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           THEN 1 ELSE 0 END)                                    AS overdue_tasks
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id, p.name, p.color, p.status;
