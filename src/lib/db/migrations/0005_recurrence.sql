-- ─────────────────────────────────────────────────────────────────────────────
-- 0005  recurring tasks
--
-- Standing work — a weekly status pack, a daily stand-up note — was recreated
-- by hand every time, or duplicated and re-dated. A task can now carry a
-- cadence: completing it schedules the next occurrence with the due date
-- rolled forward, and the completed one stays in history where it belongs.
--
-- NULL / '' means the task does not repeat, which is every task that exists
-- today.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE tasks ADD COLUMN recurrence TEXT;

-- The occurrence this task was spawned from, so a series can be traced back.
ALTER TABLE tasks ADD COLUMN recurrence_parent TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_recurrence
  ON tasks (recurrence) WHERE recurrence IS NOT NULL AND recurrence <> '';
