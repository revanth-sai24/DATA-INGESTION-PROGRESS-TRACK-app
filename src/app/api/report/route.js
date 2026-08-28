import { NextResponse } from "next/server";
import { query } from "@/lib/db/client.mjs";

/**
 * Weekly status report.
 *
 *   GET /api/report?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Assembled from what the app already records — completions, the daily work
 * log, tracked time and what is still open — so a status update is a read,
 * not something to reconstruct from memory at the end of the week.
 */

const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!isDate(from) || !isDate(to)) {
      return NextResponse.json(
        { error: "Pass ?from=YYYY-MM-DD&to=YYYY-MM-DD" },
        { status: 400 },
      );
    }

    /* completed_at is an ISO timestamp; compare on the date part so the whole
       of the end day is included. */
    const [completed, inProgress, upcoming, overdue, logEntries, time] = await Promise.all([
      query(
        `SELECT t.id, t.title, t.completed_at, COALESCE(p.name,'') AS project
           FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
          WHERE t.status = 'completed'
            AND t.completed_at IS NOT NULL
            AND substr(t.completed_at, 1, 10) BETWEEN ? AND ?
          ORDER BY t.completed_at`,
        [from, to],
      ),
      query(
        `SELECT t.id, t.title, t.due_date, COALESCE(p.name,'') AS project
           FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
          WHERE t.status = 'in_progress' ORDER BY t.due_date IS NULL, t.due_date`,
      ),
      query(
        `SELECT t.id, t.title, t.due_date, COALESCE(p.name,'') AS project
           FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
          WHERE t.status IN ('todo','on_hold')
            AND t.due_date IS NOT NULL
            AND substr(t.due_date, 1, 10) > ?
          ORDER BY t.due_date LIMIT 12`,
        [to],
      ),
      query(
        `SELECT t.id, t.title, t.due_date, COALESCE(p.name,'') AS project
           FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
          WHERE t.status NOT IN ('completed','archived')
            AND t.due_date IS NOT NULL
            AND substr(t.due_date, 1, 10) < ?
          ORDER BY t.due_date`,
        [to],
      ),
      query(
        `SELECT log_date, entry, project, minutes FROM work_log
          WHERE log_date BETWEEN ? AND ? ORDER BY log_date, created_at`,
        [from, to],
      ),
      query(
        `SELECT COALESCE(p.name,'') AS project,
                SUM(COALESCE(te.duration_seconds,0)) AS secs
           FROM time_entries te
           JOIN tasks t ON t.id = te.task_id
           LEFT JOIN projects p ON p.id = t.project_id
          WHERE te.ended_at IS NOT NULL
            AND substr(te.started_at, 1, 10) BETWEEN ? AND ?
          GROUP BY p.name HAVING secs > 0 ORDER BY secs DESC`,
        [from, to],
      ),
    ]);

    return NextResponse.json({
      range: { from, to },
      completed,
      inProgress,
      upcoming,
      overdue,
      logEntries,
      timeByProject: time.map((r) => ({ project: r.project, seconds: Number(r.secs) })),
    });
  } catch (error) {
    console.error("report GET failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
