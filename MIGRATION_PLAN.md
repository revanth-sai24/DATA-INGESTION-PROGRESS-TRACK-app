# Migration Plan — CSV files → Turso (libSQL)

**Status:** Phases 0–2 are **done and verified** on the local database.
Phases 3–6 are the application cutover (not started). Phase 7 is the move to Turso cloud, ready when you are.

---

## Why

Today every task edit rewrites `public/sample-tasks.csv` in full via `fs.writeFileSync`, with no debounce, no locking and no backup. That has three consequences:

- **Data loss by design.** Comments, subtasks, running timers and the archive list have nowhere to live in the CSV, so they are discarded on every reload.
- **Corruption risk.** Rapid edits mean overlapping full-file writes.
- **Single user, single machine.** The data is a file on one disk.

Turso is libSQL — the same SQLite engine, so the local file and the cloud database are the *same database*, just at a different URL. That is what lets us develop entirely locally now and flip one setting later without touching application code.

---

## How it is wired

```
src/config/database.mjs      ← the only file that knows where the DB is
        │                       DB_MODE = local | turso | embedded
        ▼
src/lib/db/client.mjs        ← shared libSQL client + query helpers
        │
        ├── scripts/migrate.mjs        applies src/lib/db/migrations/*.sql once each
        └── scripts/import-csv.mjs     one-off backfill from the old CSV files
```

Nothing else hardcodes a URL or a file path. Switching environments is one variable.

---

## Phase 0 — Setup ✅ done

| Item | Location |
|---|---|
| Driver | `@libsql/client@0.17.4` (works with both local files and Turso cloud) |
| Config file | [src/config/database.mjs](src/config/database.mjs) |
| DB client | [src/lib/db/client.mjs](src/lib/db/client.mjs) |
| Env template | [.env.example](.env.example) → copy to `.env.local` |
| Local DB file | `data/tracking.db` (gitignored) |

The config supports three modes. Only `local` is active:

- **`local`** — a file on disk. No network, no token. **← current**
- **`turso`** — Turso cloud over the network.
- **`embedded`** — a local replica file that syncs with Turso in the background: local read speed, cloud durability.

---

## Phase 1 — Schema ✅ done

`npm run db:migrate` applied [0001_init.sql](src/lib/db/migrations/0001_init.sql), creating **10 tables and 3 views**.

| Table | Purpose |
|---|---|
| `projects` | was `sample-projects.csv` |
| `tasks` | was `sample-tasks.csv` |
| `task_tags` | was a `;`-joined string in one cell |
| `checkpoints` | was a JSON blob in one cell |
| `documents` | was a JSON blob in one cell (mostly SharePoint links) |
| `comments` | **new** — the CommentDrawer UI existed with no storage behind it |
| `time_entries` | **new** — one row per work session, replaces the single `timeElapsed` counter |
| `activity_log` | **new** — audit trail of what changed and when |
| `app_settings` | **new** — key/value for theme, saved views, UI preferences |
| `_migrations` | applied-migration ledger (name, checksum, timestamp) |

| View | Returns |
|---|---|
| `v_task_overview` | one row per task with project name, tags, tracked seconds, checkpoint/comment/document counts — the exact shape the task list renders |
| `v_project_progress` | per-project totals: completed, in progress, on hold, overdue |
| `v_task_time_totals` | total tracked seconds and session count per task |

**Design decisions worth knowing:**

- Timestamps are ISO-8601 UTC strings, identical to JS `new Date().toISOString()`. No conversion layer.
- `ON DELETE SET NULL` on `tasks.project_id` — deleting a project must never delete work history. Child tables (`task_tags`, `checkpoints`, `documents`, `comments`, `time_entries`) cascade with their task.
- A **partial unique index** enforces at most one running timer per task, in the database rather than in app code.
- A running timer is a `time_entries` row with `ended_at IS NULL`. That is what makes a timer survive a page refresh.
- Triggers keep `updated_at` current automatically, but only when the app has not set it explicitly.
- Foreign keys are OFF by default in SQLite; `applyPragmas()` turns them on for every connection.

### Status and priority vocabulary — now fixed

The codebase currently uses two incompatible sets (`Todo`/`In Progress`/`Done` in the dead route pages and the CSV export, `todo`/`in-progress`/`on-hold`/`completed` everywhere else). The database locks in one canonical set with `CHECK` constraints, so a wrong value is now a loud error instead of a silently-zero chart:

| | Allowed values |
|---|---|
| `tasks.status` | `todo` · `in_progress` · `on_hold` · `completed` · `archived` |
| `tasks.priority` | `low` · `medium` · `high` · `urgent` |
| `projects.status` | `active` · `on_hold` · `completed` · `archived` |

`archived` is now a task status, replacing the two competing archive mechanisms in the current code (the `archivedTasks[]` array in `taskSlice`, which never auto-saved, and `ArchivedTasks.jsx` filtering on `status === 'archived'`).

---

## Phase 2 — Backfill ✅ done

`npm run db:import` read your real CSVs and loaded them. **Your CSV files were only read, never modified.**

```
projects         9
tasks           50   (completed 31 · in_progress 8 · todo 7 · on_hold 4)
tags            14
checkpoints     43
documents        6
time entries     0   (every timeElapsed in the CSV is 0)
```

Zero warnings. The import runs in a single transaction and is idempotent — running it twice does not duplicate anything.

**Field mapping:**

| CSV column | Database | Transformation |
|---|---|---|
| `project` (name) | `tasks.project_id` | looked up by name; project created if it only existed on tasks |
| `tags` | `task_tags` rows | split on `;`, deduplicated |
| `checkpoints` | `checkpoints` rows | JSON parsed, `position` preserved |
| `documents` | `documents` rows | JSON parsed |
| `estimatedTime` | `estimated_minutes` | free text → integer minutes (`2h`, `1h 30m`, `45`) |
| `timeElapsed` | `time_entries` row | read as **milliseconds** (what `taskSlice` accumulates), stored as seconds |
| `pinned` | `pinned` | `"true"`/`"false"` → `1`/`0` |
| `status`, `priority` | ↑ | normalized to the canonical vocabulary above |

> **One assumption to confirm:** `timeElapsed` is treated as milliseconds because `taskSlice` does `elapsed += Date.now() - startTime`. The dead `tasks/page.js` formats the same field as *minutes*. Every current value is `0`, so nothing was affected either way — but the app code should settle on one unit.

---

## Phase 3 — Data access layer ⬜ next

Create `src/lib/db/repositories/` with one module per aggregate — `tasks.mjs`, `projects.mjs`, `comments.mjs`, `timeEntries.mjs` — each exposing plain functions (`listTasks(filter)`, `createTask(input)`, `startTimer(taskId)`, …).

Rules:
- All SQL lives here. No SQL in components, API routes or Redux.
- Reads go through the views (`v_task_overview`) so the API returns the shape the UI already expects.
- Writes that touch a task and its children use `transaction()` from the client.
- Every write appends to `activity_log`.

**Estimate:** ~1 day.

---

## Phase 4 — API routes ⬜

Replace the four CSV routes with REST endpoints backed by the repositories:

| Now | After |
|---|---|
| `GET /api/load-tasks` | `GET /api/tasks` (with filter/sort query params) |
| `POST /api/save-tasks` (rewrites the whole file) | `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id` |
| `GET /api/load-projects` | `GET /api/projects` |
| `POST /api/save-projects` | `POST /api/projects`, `PATCH /api/projects/:id` |
| — | `POST /api/tasks/:id/comments` |
| — | `POST /api/tasks/:id/timer/start` · `/stop` |

The critical change: **writes become per-record instead of whole-file.** That alone removes the corruption risk and the debounce problem.

**Estimate:** ~0.5 day.

---

## Phase 5 — App cutover ⬜

- `taskSlice` thunks call the new endpoints; delete `autoSaveTasksToCSV` / `autoSaveProjectsToCSV`.
- Normalize the status vocabulary across all components to the canonical set (this is where the `Todo` vs `todo` split finally dies).
- Delete `archivedTasks[]` from Redux state — archive is now `status = 'archived'`.
- Wire up the features the CSV could not store: comments persistence, timer that survives refresh, activity log.
- Move undo/redo to operate against the database (or drop the in-memory history, which today silently diverges from the CSV).

**Estimate:** ~1 day.

---

## Phase 6 — Retire the CSV ⬜

- Keep `exportToCSV` as a user-facing **export** feature. That is genuinely useful; it just should not be the storage engine.
- Move `public/sample-*.csv` to `backups/` — note that files in `public/` are served to anyone who can reach the app, so your task data is currently a public URL.
- Delete the CSV auto-save code paths.

---

## Phase 7 — Move to Turso cloud ⬜ (when you want multi-device / multi-user)

```bash
# 1. Install the CLI and sign in
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login

# 2. Create the database
turso db create tracking-app

# 3. Get the connection details
turso db show tracking-app --url          # → libsql://tracking-app-<org>.turso.io
turso db tokens create tracking-app       # → the auth token

# 4. Put them in .env.local (never commit these)
#    DB_MODE=turso
#    TURSO_DATABASE_URL=libsql://tracking-app-<org>.turso.io
#    TURSO_AUTH_TOKEN=<token>

# 5. Build the schema in the cloud — same command, new target
npm run db:migrate

# 6. Load the data (either import the CSVs again, or push the local file)
npm run db:import
#    alternative, exact copy of local:
#    turso db shell tracking-app < <(sqlite3 data/tracking.db .dump)
```

No application code changes. The migration runner and every repository read the same config.

**For production hosting** set `DB_MODE`, `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as environment variables on the host (Vercel etc.) — this is also the point where the app stops depending on a writable local filesystem, which it currently does and which does not work on serverless hosting.

---

## Rollback

| Phase | How to undo |
|---|---|
| 0–2 | `npm run db:reset -- --force` deletes `data/tracking.db`. The CSVs are untouched and the app still runs off them. |
| 3–5 | Feature-branch the cutover. The CSV routes keep working until they are deleted in Phase 6. |
| 6 | Restore from `backups/`, or `npm run db:export-csv` (worth writing during Phase 6). |
| 7 | Set `DB_MODE=local` in `.env.local`. The local file is still there. |

`db:reset` refuses to run unless `DB_MODE=local`, so it can never delete a cloud database.

---

## Verification checklist

Run after each phase:

```bash
npm run db:status                  # which migrations are applied
npm run db:import -- --dry-run     # re-validate the CSVs without writing
```

- [x] Migrations apply cleanly from an empty database
- [x] Re-running migrations is a no-op
- [x] Import is idempotent (50 tasks stay 50 tasks)
- [x] Views return correct per-project aggregates
- [x] Foreign keys and CHECK constraints reject bad data
- [ ] App reads and writes through the database (Phase 5)
- [ ] Timer survives a page refresh (Phase 5)
- [ ] Comments persist across reloads (Phase 5)

---

## Command reference

| Command | What it does |
|---|---|
| `npm run db:migrate` | apply pending migrations |
| `npm run db:migrate -- --dry-run` | show what would be applied |
| `npm run db:status` | applied / pending / edited-since-applied |
| `npm run db:import` | backfill from the CSVs (safe to re-run) |
| `npm run db:import -- --dry-run` | validate the CSVs, write nothing |
| `npm run db:import -- --fresh` | wipe tables, then import |
| `npm run db:reset -- --force` | delete the local DB file (local mode only) |

---

## Adding a migration later

Create the next numbered file — `src/lib/db/migrations/0002_add_recurring_tasks.sql` — and run `npm run db:migrate`.

**Migrations are append-only from here on.** The runner stores a checksum of every applied file and warns if one is edited afterwards. (`0001_init.sql` was edited once during setup, before any data existed and before it left this machine, to add the `on_hold` status the Kanban board uses. That was the last time.)

Note that SQLite cannot `ALTER` a `CHECK` constraint or drop a column cleanly — changing either means the create-new-table / copy / drop / rename dance. Adding a column, an index or a table is straightforward.
