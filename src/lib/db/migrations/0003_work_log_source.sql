-- =============================================================================
-- 0003_work_log_source.sql — distinguish auto-written log lines from yours
-- =============================================================================
-- Completing a task from the Today screen writes a "Completed: <title>" line
-- into the work log. When the task was later deleted, that line stayed behind
-- and kept counting toward the day — work that no longer exists.
--
-- The fix needs to tell the two kinds apart: a line the app generated is
-- derived from the task and should die with it, while a line you typed is your
-- own record and must survive (unlinked, but kept).
-- =============================================================================

ALTER TABLE work_log ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_work_log_source ON work_log (source, task_id);

-- Backfill: existing auto-written lines all follow the same shape.
UPDATE work_log SET source = 'auto' WHERE entry LIKE 'Completed: %' AND task_id IS NOT NULL;

-- Clear the ones already orphaned by a deleted task.
DELETE FROM work_log
 WHERE source = 'auto'
   AND task_id IS NOT NULL
   AND task_id NOT IN (SELECT id FROM tasks);

-- Anything manual that lost its task keeps the text, loses the dead link.
UPDATE work_log SET task_id = NULL
 WHERE task_id IS NOT NULL AND task_id NOT IN (SELECT id FROM tasks);
