"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  ContentCopy as CopyIcon,
  FileDownloadOutlined as DownloadIcon,
  CheckCircleOutline as DoneIcon,
} from "@mui/icons-material";
import { PageHeader, EmptyState, StatStrip } from "./ui/Primitives";
import { Button } from "./ui/Components";

/**
 * Weekly status report.
 *
 * Everything here is already recorded — completions, the daily log, tracked
 * time, what is still open. Writing a status update meant reconstructing the
 * week from memory; this reads it back, grouped by project, with a copy button
 * for pasting straight into an email or a stand-up note.
 */

const DAY = 86400000;

/** Monday of the week containing `d`. */
function weekStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const human = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

const hours = (secs) => {
  if (!secs) return "0m";
  const h = secs / 3600;
  if (h >= 1) return `${h.toFixed(1)}h`;
  const m = Math.round(secs / 60);
  /* A 40-second entry is not "0m" — say so rather than rounding it away. */
  return m >= 1 ? `${m}m` : "<1m";
};

/** Group rows by project, "No project" last. */
function byProject(rows) {
  const map = new Map();
  for (const r of rows) {
    const name = r.project || "No project";
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(r);
  }
  return [...map.entries()].sort(([a], [b]) =>
    a === "No project" ? 1 : b === "No project" ? -1 : a.localeCompare(b),
  );
}

export default function WeeklyReport() {
  const [offset, setOffset] = useState(0); // weeks back from this one
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const { from, to, label } = useMemo(() => {
    const start = weekStart(new Date(Date.now() - offset * 7 * DAY));
    const end = new Date(start.getTime() + 6 * DAY);
    return {
      from: key(start),
      to: key(end),
      label:
        offset === 0 ? "This week" : offset === 1 ? "Last week" : `${offset} weeks ago`,
    };
  }, [offset]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/report?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setData(d.error ? null : d))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  /* The same report as plain text — what actually gets pasted into an email. */
  const asText = useCallback(() => {
    if (!data) return "";
    const lines = [`Status report — ${human(from)} to ${human(to)}`, ""];

    if (data.completed.length) {
      lines.push(`Completed (${data.completed.length})`);
      for (const [project, rows] of byProject(data.completed)) {
        lines.push(`  ${project}`);
        rows.forEach((r) => lines.push(`    - ${r.title}`));
      }
      lines.push("");
    }
    if (data.inProgress.length) {
      lines.push(`In progress (${data.inProgress.length})`);
      for (const [project, rows] of byProject(data.inProgress)) {
        lines.push(`  ${project}`);
        rows.forEach((r) => lines.push(`    - ${r.title}`));
      }
      lines.push("");
    }
    if (data.overdue.length) {
      lines.push(`Overdue (${data.overdue.length})`);
      data.overdue.forEach((r) =>
        lines.push(`  - ${r.title}${r.due_date ? ` (due ${r.due_date.slice(0, 10)})` : ""}`),
      );
      lines.push("");
    }
    if (data.upcoming.length) {
      lines.push("Coming up");
      data.upcoming.forEach((r) =>
        lines.push(`  - ${r.title}${r.due_date ? ` (due ${r.due_date.slice(0, 10)})` : ""}`),
      );
      lines.push("");
    }
    if (data.timeByProject.length) {
      lines.push("Time tracked");
      data.timeByProject.forEach((t) =>
        lines.push(`  - ${t.project || "No project"}: ${hours(t.seconds)}`),
      );
      lines.push("");
    }
    if (data.logEntries.length) {
      lines.push("Daily log");
      let day = null;
      for (const e of data.logEntries) {
        if (e.log_date !== day) {
          day = e.log_date;
          lines.push(`  ${human(day)}`);
        }
        lines.push(`    - ${e.entry}`);
      }
    }
    return lines.join("\n").trimEnd();
  }, [data, from, to]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard needs a secure context; the download is the way out. */
      download();
    }
  };

  const download = () => {
    const blob = new Blob([asText()], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `status-${from}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const totalSeconds = (data?.timeByProject ?? []).reduce((n, t) => n + t.seconds, 0);
  const empty =
    data &&
    !data.completed.length &&
    !data.inProgress.length &&
    !data.logEntries.length &&
    !data.overdue.length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Weekly report"
        description="What you shipped, what is moving, and what is at risk — assembled from the week you already recorded."
        meta={
          <>
            <span>
              {human(from)} — {human(to)}
            </span>
            <span>{label}</span>
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--border)] p-0.5">
              <button
                onClick={() => setOffset((o) => o + 1)}
                aria-label="Previous week"
                className="rounded-[4px] p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
              >
                <PrevIcon sx={{ fontSize: 18 }} />
              </button>
              <button
                onClick={() => setOffset((o) => Math.max(0, o - 1))}
                disabled={offset === 0}
                aria-label="Next week"
                className="rounded-[4px] p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] disabled:pointer-events-none disabled:opacity-30"
              >
                <NextIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            <Button onClick={download} icon={DownloadIcon} size="sm">
              Download
            </Button>
            <Button
              onClick={copy}
              variant="primary"
              size="sm"
              icon={copied ? DoneIcon : CopyIcon}
              disabled={!data}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        }
      />

      {loading ? (
        <p className="py-10 text-center text-[13px] text-[var(--fg-subtle)]">
          Building the report…
        </p>
      ) : !data ? (
        <EmptyState title="Could not build the report" description="The report query failed." />
      ) : (
        <>
          <StatStrip
            items={[
              { label: "Completed", value: data.completed.length, tone: "var(--success)" },
              { label: "In progress", value: data.inProgress.length, tone: "var(--accent)" },
              {
                label: "Overdue",
                value: data.overdue.length,
                tone: data.overdue.length ? "var(--danger)" : "var(--fg)",
              },
              { label: "Time tracked", value: totalSeconds ? hours(totalSeconds) : "—" },
            ]}
          />

          {empty ? (
            <EmptyState
              title="Nothing recorded this week"
              description="Complete a task or add a line to the daily log and it will show up here."
            />
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {data.completed.length > 0 && (
                <Section title="Completed" count={data.completed.length} tone="var(--success)">
                  {byProject(data.completed).map(([project, rows]) => (
                    <Group key={project} name={project} rows={rows} />
                  ))}
                </Section>
              )}

              {data.inProgress.length > 0 && (
                <Section title="In progress" count={data.inProgress.length} tone="var(--accent)">
                  {byProject(data.inProgress).map(([project, rows]) => (
                    <Group key={project} name={project} rows={rows} showDue />
                  ))}
                </Section>
              )}

              {data.overdue.length > 0 && (
                <Section title="Overdue" count={data.overdue.length} tone="var(--danger)">
                  {byProject(data.overdue).map(([project, rows]) => (
                    <Group key={project} name={project} rows={rows} showDue />
                  ))}
                </Section>
              )}

              {data.upcoming.length > 0 && (
                <Section title="Coming up" count={data.upcoming.length}>
                  {byProject(data.upcoming).map(([project, rows]) => (
                    <Group key={project} name={project} rows={rows} showDue />
                  ))}
                </Section>
              )}

              {data.logEntries.length > 0 && (
                <Section title="Daily log" count={data.logEntries.length}>
                  <ul className="space-y-2">
                    {data.logEntries.map((e, i) => (
                      <li key={i} className="flex gap-3 text-[13px]">
                        <span className="w-[52px] flex-shrink-0 font-mono text-[11px] text-[var(--fg-subtle)]">
                          {human(e.log_date)}
                        </span>
                        <span className="text-[var(--fg-muted)]">{e.entry}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {data.timeByProject.length > 0 && (
                <Section title="Time tracked" count={null}>
                  <ul className="space-y-1.5">
                    {data.timeByProject.map((t) => (
                      <li
                        key={t.project || "none"}
                        className="flex items-center justify-between text-[13px]"
                      >
                        <span className="text-[var(--fg-muted)]">
                          {t.project || "No project"}
                        </span>
                        <span className="font-mono tabular-nums text-[var(--fg)]">
                          {hours(t.seconds)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, count, tone, children }) {
  return (
    <section className="premium-card p-4">
      <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--border)] pb-2">
        <h2 className="text-[13px] font-semibold text-[var(--fg)]">{title}</h2>
        {count !== null && count !== undefined && (
          <span
            className="font-mono text-[12px] tabular-nums"
            style={{ color: tone || "var(--fg-subtle)" }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Group({ name, rows, showDue = false }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="eyebrow mb-1.5">{name}</div>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.id} className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate text-[var(--fg-muted)]">{r.title}</span>
            {showDue && r.due_date && (
              <span className="flex-shrink-0 font-mono text-[11px] tabular-nums text-[var(--fg-subtle)]">
                {r.due_date.slice(0, 10)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
