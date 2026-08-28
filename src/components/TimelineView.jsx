"use client";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
} from "@mui/icons-material";
import { PageHeader, EmptyState, StatusPill } from "./ui/Primitives";
import { Select } from "./ui/Components";

/**
 * Timeline — work laid out across dates, one row per project.
 *
 * This screen used to be a reverse-chronological list: one task per screenful,
 * full descriptions inlined, no sense of what overlaps or when a project is
 * busy. A timeline's whole job is to answer "what lands when, and where does
 * it collide" — so it is now a grid: weeks across the top, projects down the
 * side, each task a bar sitting on its due date.
 */

const DAY = 86400000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Monday of the week containing `d`. */
const weekStart = (d) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const RANGES = [
  { id: "6w", label: "6 weeks", weeks: 6 },
  { id: "12w", label: "12 weeks", weeks: 12 },
  { id: "26w", label: "6 months", weeks: 26 },
];

const TONE = {
  completed: "var(--success)",
  "in-progress": "var(--accent)",
  "on-hold": "var(--accent-2)",
  todo: "var(--fg-subtle)",
  archived: "var(--fg-subtle)",
};

export default function TimelineView({ onEditTask }) {
  const { tasks, projects } = useSelector((state) => state.tasks);
  const [rangeId, setRangeId] = useState("12w");
  const [projectFilter, setProjectFilter] = useState("");
  const [offset, setOffset] = useState(0); // weeks scrolled from today
  const [hover, setHover] = useState(null);

  const range = RANGES.find((r) => r.id === rangeId) ?? RANGES[1];

  /* The grid starts one week before today so anything just missed stays in
     view, then runs forward for the chosen span. */
  const weeks = useMemo(() => {
    const first = weekStart(new Date(Date.now() + (offset - 1) * 7 * DAY));
    return Array.from({ length: range.weeks }, (_, i) => {
      const s = new Date(first.getTime() + i * 7 * DAY);
      return { start: s, end: new Date(s.getTime() + 6 * DAY), key: key(s) };
    });
  }, [range.weeks, offset]);

  const from = weeks[0].start;
  const to = weeks[weeks.length - 1].end;

  /* Only dated, unarchived work can sit on a timeline. */
  const dated = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.status === "archived" || !t.dueDate) return false;
        if (projectFilter && (t.project || "") !== projectFilter) return false;
        const d = startOfDay(t.dueDate);
        return d >= from && d <= to;
      }),
    [tasks, projectFilter, from, to],
  );

  /* Work due before the window would simply vanish off the left edge. It is
     the most urgent work there is, so it gets a pinned column instead. */
  const overdue = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.status === "archived" || t.status === "completed" || !t.dueDate) return false;
        if (projectFilter && (t.project || "") !== projectFilter) return false;
        return startOfDay(t.dueDate) < from;
      }),
    [tasks, projectFilter, from],
  );

  const undated = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status !== "archived" &&
          !t.dueDate &&
          (!projectFilter || (t.project || "") === projectFilter),
      ),
    [tasks, projectFilter],
  );

  /* One row per project that actually has work in the window. */
  const rows = useMemo(() => {
    const byProject = new Map();
    const add = (t) => {
      const name = t.project || "No project";
      if (!byProject.has(name)) byProject.set(name, { dated: [], late: [] });
      return byProject.get(name);
    };
    for (const t of dated) add(t).dated.push(t);
    for (const t of overdue) add(t).late.push(t);

    return [...byProject.entries()]
      .map(([name, { dated: list, late }]) => ({
        name,
        color: projects.find((p) => p.name === name)?.color || "var(--border-strong)",
        late: late.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
        weeks: weeks.map((w) =>
          list
            .filter((t) => {
              const d = startOfDay(t.dueDate);
              return d >= w.start && d <= new Date(w.end.getTime() + DAY - 1);
            })
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
        ),
      }))
      .sort((a, b) => (a.name === "No project" ? 1 : b.name === "No project" ? -1 : a.name.localeCompare(b.name)));
  }, [dated, overdue, weeks, projects]);

  const todayKey = key(weekStart(new Date()));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Timeline"
        description="Where work lands across the weeks, by project. Overlaps and quiet stretches are the point."
        meta={
          <>
            <span>
              {from.toLocaleDateString(undefined, { day: "numeric", month: "short" })} —{" "}
              {to.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </span>
            <span>{dated.length} in window</span>
            {overdue.length > 0 && (
              <span className="text-[var(--danger)]">{overdue.length} overdue</span>
            )}
            {undated.length > 0 && <span>{undated.length} with no date</span>}
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              aria-label="Filter by project"
              className="!w-auto min-w-[132px]"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Select
              value={rangeId}
              onChange={(e) => setRangeId(e.target.value)}
              aria-label="Time range"
              className="!w-auto min-w-[110px]"
            >
              {RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>

            <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--border)] p-0.5">
              <button
                onClick={() => setOffset((o) => o - 2)}
                aria-label="Earlier"
                className="rounded-[4px] p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
              >
                <PrevIcon sx={{ fontSize: 18 }} />
              </button>
              <button
                onClick={() => setOffset(0)}
                aria-label="Back to today"
                title="Back to today"
                className={`rounded-[4px] p-1.5 transition-colors hover:bg-[var(--surface-2)] ${
                  offset === 0 ? "text-[var(--accent)]" : "text-[var(--fg-subtle)]"
                }`}
              >
                <TodayIcon sx={{ fontSize: 16 }} />
              </button>
              <button
                onClick={() => setOffset((o) => o + 2)}
                aria-label="Later"
                className="rounded-[4px] p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
              >
                <NextIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing scheduled in this window"
          description="Give a task a due date, or step the range forward, and it will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--surface)]">
          <div style={{ minWidth: `${180 + (overdue.length ? 150 : 0) + range.weeks * 92}px` }}>
            {/* Week headers */}
            <div
              className="sticky top-0 z-raised grid border-b border-[var(--border)] bg-[var(--surface)]"
              style={{
                gridTemplateColumns: `180px ${overdue.length ? "150px " : ""}repeat(${range.weeks}, 1fr)`,
              }}
            >
              <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
                Project
              </div>
              {overdue.length > 0 && (
                <div className="border-l border-[var(--hairline)] bg-[var(--danger-soft)] px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-[var(--danger)]">
                  Overdue
                </div>
              )}
              {weeks.map((w) => (
                <div
                  key={w.key}
                  className={`border-l border-[var(--hairline)] px-2 py-2 text-center ${
                    w.key === todayKey ? "bg-[var(--accent-soft)]" : ""
                  }`}
                >
                  <div
                    className={`font-mono text-[11px] tabular-nums ${
                      w.key === todayKey ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"
                    }`}
                  >
                    {w.start.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </div>
                </div>
              ))}
            </div>

            {/* One row per project */}
            {rows.map((row) => (
              <div
                key={row.name}
                className="grid border-b border-[var(--hairline)] last:border-b-0"
                style={{
                  gridTemplateColumns: `180px ${overdue.length ? "150px " : ""}repeat(${range.weeks}, 1fr)`,
                }}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: row.color }}
                  />
                  <span className="truncate text-[12px] font-medium text-[var(--fg-muted)]">
                    {row.name}
                  </span>
                </div>

                {overdue.length > 0 && (
                  <div className="space-y-1 border-l border-[var(--hairline)] bg-[var(--danger-soft)]/30 px-1.5 py-1.5">
                    {row.late.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onEditTask?.(t)}
                        title={`${t.title} — was due ${new Date(t.dueDate).toLocaleDateString()}`}
                        className="block w-full truncate rounded-[var(--radius-sm)] border-l-2 border-l-[var(--danger)] bg-[var(--surface-2)] px-1.5 py-1 text-left text-[11px] leading-tight text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--fg)]"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                )}

                {row.weeks.map((cell, i) => (
                  <div
                    key={i}
                    className={`space-y-1 border-l border-[var(--hairline)] px-1.5 py-1.5 ${
                      weeks[i].key === todayKey ? "bg-[var(--accent-soft)]/40" : ""
                    }`}
                  >
                    {cell.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onEditTask?.(t)}
                        onMouseEnter={() => setHover(t.id)}
                        onMouseLeave={() => setHover(null)}
                        title={`${t.title} — due ${new Date(t.dueDate).toLocaleDateString()}`}
                        className="block w-full truncate rounded-[var(--radius-sm)] border-l-2 bg-[var(--surface-2)] px-1.5 py-1 text-left text-[11px] leading-tight text-[var(--fg-muted)] transition-all duration-150 hover:bg-[var(--surface-3)] hover:text-[var(--fg)]"
                        style={{
                          borderLeftColor: TONE[t.status] || "var(--fg-subtle)",
                          textDecoration: t.status === "completed" ? "line-through" : "none",
                          opacity: hover && hover !== t.id ? 0.55 : 1,
                        }}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Undated work has no place on a timeline, but hiding it silently is
          how it gets forgotten. */}
      {undated.length > 0 && (
        <section className="premium-card p-4">
          <div className="mb-2.5 flex items-baseline gap-2 border-b border-[var(--border)] pb-2">
            <h2 className="text-[13px] font-semibold text-[var(--fg)]">No due date</h2>
            <span className="font-mono text-[12px] tabular-nums text-[var(--fg-subtle)]">
              {undated.length}
            </span>
            <span className="ml-auto text-[11px] text-[var(--fg-subtle)]">
              Not on the timeline until they have a date
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {undated.map((t) => (
              <button
                key={t.id}
                onClick={() => onEditTask?.(t)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--surface-2)] py-1 pl-2.5 pr-2 text-[12px] text-[var(--fg-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--fg)]"
              >
                <span className="max-w-[220px] truncate">{t.title}</span>
                <StatusPill status={t.status} />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
