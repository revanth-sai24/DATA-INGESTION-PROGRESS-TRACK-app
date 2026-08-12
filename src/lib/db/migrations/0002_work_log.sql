-- =============================================================================
-- 0002_work_log.sql — the daily work log
-- =============================================================================
-- Tasks answer "what must I do". This answers "what did I actually do today",
-- which is the thing the app had nowhere to put.
--
-- An entry is one line of work on one day. It can hang off a task, or not —
-- plenty of real work (a meeting, a review, helping someone, debugging
-- something that was never a ticket) never had a task in the first place, and
-- if the log only accepted task-linked entries it would miss most of the day.
--
-- `project` and `task_id` are loose strings rather than foreign keys on
-- purpose: tasks still live in the CSV files until the app cutover (Phase 5 of
-- MIGRATION_PLAN.md), so there is nothing to point a real key at yet. Once the
-- tasks table is the live source, these become proper references.
-- =============================================================================

CREATE TABLE IF NOT EXISTS work_log (
  id         TEXT PRIMARY KEY,

  log_date   TEXT NOT NULL,              -- 'YYYY-MM-DD', the day the work happened
  entry      TEXT NOT NULL,              -- what you did, in your own words

  project    TEXT NOT NULL DEFAULT '',   -- project name, matching the task list
  task_id    TEXT,                       -- optional link to the task worked on
  minutes    INTEGER,                    -- optional: how long it took

  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_work_log_date    ON work_log (log_date);
CREATE INDEX IF NOT EXISTS idx_work_log_project ON work_log (project, log_date);
CREATE INDEX IF NOT EXISTS idx_work_log_task    ON work_log (task_id) WHERE task_id IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_work_log_updated_at
AFTER UPDATE ON work_log FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE work_log SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

-- Per-day rollup: how much was logged, and against how many projects.
CREATE VIEW IF NOT EXISTS v_work_log_days AS
SELECT
  log_date,
  COUNT(*)                              AS entry_count,
  COUNT(DISTINCT NULLIF(project, ''))   AS project_count,
  COALESCE(SUM(minutes), 0)             AS total_minutes
FROM work_log
GROUP BY log_date;
