"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addTask, updateTask } from "../redux/slices/taskSlice";
import {
  Add as AddIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
  CheckCircle as DoneIcon,
  RadioButtonUnchecked as OpenIcon,
  Delete as DeleteIcon,
  Warning as OverdueIcon,
  PlayArrow as InProgressIcon,
  EditNote as LogIcon,
  Schedule as ClockIcon,
} from "@mui/icons-material";
import { PageHeader, StatStrip, StatusPill, PriorityPill, EmptyState } from "./ui/Primitives";

/* ── dates ────────────────────────────────────────────────────────────────
   Task due dates are stored as UTC midnight ("2026-01-23T00:00:00.000Z"), so
   the calendar day is the first 10 characters — reading it that way avoids the
   off-by-one-day that `new Date(...)` causes in a non-UTC timezone.          */
const toKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayKeyOf = (iso) => (iso ? String(iso).slice(0, 10) : null);
const fromKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (key, n) => {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
};
const prettyDate = (key) =>
  fromKey(key).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const ACTIVE_STATUSES = ["todo", "in-progress", "on-hold"];

export default function TodayView({ darkMode, onEditTask }) {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks || []);
  const projects = useSelector((state) => state.tasks.projects || []);

  const todayKey = toKey(new Date());
  const [dayKey, setDayKey] = useState(todayKey);

  const [entries, setEntries] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);

  const [logText, setLogText] = useState("");
  const [logProject, setLogProject] = useState("");
  const [logMinutes, setLogMinutes] = useState("");
  const [logTaskId, setLogTaskId] = useState(null);
  const [quickTitle, setQuickTitle] = useState("");
  const logInputRef = useRef(null);

  const isToday = dayKey === todayKey;
  const projectNames = useMemo(
    () => projects.map((p) => (typeof p === "string" ? p : p.name)).filter(Boolean),
    [projects],
  );

  /* ── data ─────────────────────────────────────────────────────────────── */

  const loadDay = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/work-log?date=${dayKey}`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error("Could not load the work log:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [dayKey]);

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/work-log?from=${addDays(todayKey, -6)}&to=${todayKey}`,
      );
      const data = await res.json();
      setRecent(data.entries || []);
    } catch (err) {
      console.error("Could not load recent days:", err);
    }
  }, [todayKey]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);
  useEffect(() => {
    loadRecent();
  }, [loadRecent, entries.length]);

  const saveEntry = useCallback(
    async (payload) => {
      setSaveError(null);
      try {
        const res = await fetch("/api/work-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error || "Save failed");
        }
        await loadDay();
        return true;
      } catch (err) {
        console.error("Could not save the entry:", err);
        setSaveError(err.message);
        return false;
      }
    },
    [loadDay],
  );

  const handleAddLog = async () => {
    const text = logText.trim();
    if (!text) return;
    const ok = await saveEntry({
      log_date: dayKey,
      entry: text,
      project: logProject,
      task_id: logTaskId,
      minutes: logMinutes,
    });
    if (ok) {
      setLogText("");
      setLogMinutes("");
      setLogTaskId(null);
    }
  };

  /* An auto line mirrors a task's completion — it is not an independent note.
     Removing it on its own left "Done today" counting a task whose line had
     vanished, which is exactly the confusion this replaces: undo the completion
     and the line goes with it. */
  const undoCompletion = async (entry) => {
    const task = tasks.find((t) => t.id === entry.task_id);
    if (!task) {
      // Task is gone; the line is a leftover, so just clear it.
      await handleDeleteEntry(entry.id);
      return;
    }
    await dispatch(
      updateTask({ ...task, status: "todo", completedAt: null }),
    );
    await loadDay();
  };

  const handleDeleteEntry = async (id) => {
    try {
      await fetch(`/api/work-log?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadDay();
    } catch (err) {
      console.error("Could not delete the entry:", err);
    }
  };

  /* ── tasks for this day ───────────────────────────────────────────────── */

  const { overdue, dueToday, inProgress, completedToday } = useMemo(() => {
    const active = tasks.filter((t) => ACTIVE_STATUSES.includes(t.status));
    return {
      overdue: active.filter((t) => {
        const due = dayKeyOf(t.dueDate);
        return due && due < dayKey;
      }),
      dueToday: active.filter((t) => dayKeyOf(t.dueDate) === dayKey),
      inProgress: active.filter(
        (t) => t.status === "in-progress" && dayKeyOf(t.dueDate) !== dayKey,
      ),
      completedToday: tasks.filter(
        (t) => t.status === "completed" && dayKeyOf(t.completedAt) === dayKey,
      ),
    };
  }, [tasks, dayKey]);

  /* Completing a task from here also writes the log line, so the day fills in
     as you work instead of needing to be reconstructed at 6pm. */
  const completeTask = async (task) => {
    /* The log line is written by the server on the status transition, so it
       happens identically wherever the task is completed from. */
    await dispatch(
      updateTask({
        ...task,
        status: "completed",
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    await loadDay();
  };

  const startLoggingFor = (task) => {
    setLogTaskId(task.id);
    setLogProject(task.project || "");
    setLogText(`${task.title} — `);
    logInputRef.current?.focus();
  };

  const handleQuickAdd = () => {
    const title = quickTitle.trim();
    if (!title) return;
    dispatch(
      addTask({
        title,
        status: "todo",
        priority: "medium",
        project: logProject || "",
        dueDate: dayKey,
      }),
    );
    setQuickTitle("");
  };

  /* ── styling helpers ──────────────────────────────────────────────────── */

  const card = "bg-[var(--surface)] border-[var(--border)]";
  const text = "text-[var(--fg)]";
  const muted = "text-[var(--fg-subtle)]";
  const input =
    "bg-[var(--surface)] border-[var(--border-strong)] text-[var(--fg)] placeholder:text-[var(--fg-subtle)]";

  const totalMinutes = entries.reduce((sum, e) => sum + (Number(e.minutes) || 0), 0);
  const formatMinutes = (m) =>
    m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ""}`.trim() : `${m}m`;

  const recentByDay = useMemo(() => {
    const counts = {};
    for (const e of recent) counts[e.log_date] = (counts[e.log_date] || 0) + 1;
    return Array.from({ length: 7 }, (_, i) => {
      const key = addDays(todayKey, -(6 - i));
      return { key, count: counts[key] || 0 };
    });
  }, [recent, todayKey]);

  const TaskRow = ({ task, tone }) => (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
        darkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50"
      } transition-colors group`}
    >
      <button
        onClick={() => completeTask(task)}
        title="Mark complete and log it"
        className={`flex-shrink-0 ${muted} hover:text-green-500 transition-colors`}
      >
        <OpenIcon fontSize="small" />
      </button>

      <button
        onClick={() => onEditTask?.(task)}
        className={`flex-1 text-left min-w-0 ${text}`}
      >
        <div className="text-sm font-medium truncate">{task.title}</div>
        <div className={`text-xs ${muted} flex items-center gap-2 mt-0.5`}>
          {task.project && <span className="truncate">{task.project}</span>}
          <PriorityPill priority={task.priority} />
          {tone === "overdue" && task.dueDate && (
            <span className="text-red-500">due {dayKeyOf(task.dueDate)}</span>
          )}
        </div>
      </button>

      <button
        onClick={() => startLoggingFor(task)}
        title="Log work against this task"
        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded text-xs font-medium ${
          darkMode
            ? "bg-blue-900/50 text-blue-300 hover:bg-blue-800/50"
            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
        }`}
      >
        <LogIcon fontSize="inherit" /> Log
      </button>
    </div>
  );

  const Section = ({ title, icon, count, tone, children }) =>
    count === 0 ? null : (
      <div>
        <div className={`flex items-center gap-2 mb-2 text-sm font-semibold ${tone}`}>
          {icon}
          {title}
          <span className={`text-xs font-normal ${muted}`}>({count})</span>
        </div>
        <div className="space-y-1.5">{children}</div>
      </div>
    );

  /* ── render ───────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      <div className="rise rise-1"><PageHeader
        title={isToday ? "Today" : prettyDate(dayKey)}
        description={
          isToday
            ? "What you are working on, and what you actually did."
            : "Looking back at a previous day."
        }
        meta={
          <>
            <span>{prettyDate(dayKey)}</span>
            <span>
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
            {totalMinutes > 0 && <span>{formatMinutes(totalMinutes)} logged</span>}
          </>
        }
        actions={
          <div className="flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-[var(--border)] p-0.5">
            <button
              onClick={() => setDayKey(addDays(dayKey, -1))}
              className="rounded-[3px] p-1.5 text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
              aria-label="Previous day"
            >
              <PrevIcon sx={{ fontSize: 18 }} />
            </button>
            <button
              onClick={() => setDayKey(todayKey)}
              disabled={isToday}
              className="rounded-[3px] px-2.5 py-1 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] disabled:opacity-40"
            >
              Today
            </button>
            <button
              onClick={() => setDayKey(addDays(dayKey, 1))}
              disabled={dayKey >= todayKey}
              className="rounded-[3px] p-1.5 text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] disabled:opacity-30"
              aria-label="Next day"
            >
              <NextIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        }
      /></div>

      <div className="rise rise-2"><StatStrip
        items={[
          { label: "Overdue", value: overdue.length, tone: overdue.length ? "var(--danger)" : undefined },
          { label: "Due today", value: dueToday.length, tone: dueToday.length ? "var(--accent-2)" : undefined },
          { label: "In progress", value: inProgress.length, tone: inProgress.length ? "var(--accent)" : undefined },
          { label: "Done today", value: completedToday.length, tone: completedToday.length ? "var(--success)" : undefined },
        ]}
      /></div>

      {/* Last 7 days */}
      <div className="flex items-center gap-1.5">
        {recentByDay.map(({ key, count }) => (
          <button
            key={key}
            onClick={() => setDayKey(key)}
            title={`${prettyDate(key)} — ${count} ${count === 1 ? "entry" : "entries"}`}
            className={`flex-1 rounded-lg px-2 py-2 border transition-colors ${
              key === dayKey
                ? "border-blue-500 bg-blue-500/10"
                : darkMode
                  ? "border-gray-700 hover:border-gray-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`text-[10px] uppercase tracking-wide ${muted}`}>
              {fromKey(key).toLocaleDateString("en-US", { weekday: "short" })}
            </div>
            <div
              className={`text-sm font-semibold ${count > 0 ? "text-blue-500" : muted}`}
            >
              {count || "·"}
            </div>
          </button>
        ))}
      </div>

      <div className="rise rise-3 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ── What I did ──────────────────────────────────────────────── */}
        <div className={`rounded-xl border ${card} p-5`}>
          <h2 className={`text-lg font-semibold ${text} mb-1`}>What I did</h2>
          <p className={`text-xs ${muted} mb-4`}>
            One line per thing. Meetings and interruptions count — they were still
            your day.
          </p>

          <div className="space-y-2 mb-4">
            <textarea
              ref={logInputRef}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddLog();
                }
              }}
              rows={2}
              placeholder="Reviewed the ingestion pipeline with the team…"
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
            />

            <div className="flex items-center gap-2">
              <select
                value={logProject}
                onChange={(e) => setLogProject(e.target.value)}
                className={`flex-1 min-w-0 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
              >
                <option value="">No project</option>
                {projectNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <ClockIcon
                  fontSize="small"
                  className={`absolute left-2 top-1/2 -translate-y-1/2 ${muted}`}
                />
                <input
                  type="number"
                  min="0"
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(e.target.value)}
                  placeholder="min"
                  className={`w-24 pl-8 pr-2 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
                />
              </div>

              <button
                onClick={handleAddLog}
                disabled={!logText.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Log it
              </button>
            </div>

            {logTaskId && (
              <div className={`text-xs ${muted} flex items-center gap-2`}>
                Linked to a task
                <button
                  onClick={() => setLogTaskId(null)}
                  className="text-blue-500 hover:underline"
                >
                  unlink
                </button>
              </div>
            )}
            {saveError && (
              <div className="text-xs text-red-500">Could not save: {saveError}</div>
            )}
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className={`text-sm ${muted} py-4 text-center`}>Loading…</div>
            ) : entries.length === 0 ? (
              <div className={`text-sm ${muted} py-8 text-center`}>
                Nothing logged for this day yet.
              </div>
            ) : (
              entries.map((e) => (
                <div
                  key={e.id}
                  className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg border ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <DoneIcon fontSize="small" className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${text} whitespace-pre-wrap break-words`}>
                      {e.entry}
                    </div>
                    <div className={`text-xs ${muted} flex items-center gap-2 mt-1`}>
                      {e.project && <span>{e.project}</span>}
                      {e.minutes ? <span>{formatMinutes(e.minutes)}</span> : null}
                      <span>
                        {new Date(e.created_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  {e.source === "auto" && e.task_id ? (
                    <button
                      onClick={() => undoCompletion(e)}
                      className="flex-none rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-[11px] font-medium text-[var(--fg-muted)] opacity-0 transition-opacity hover:bg-[var(--surface-2)] hover:text-[var(--fg)] group-hover:opacity-100 focus:opacity-100"
                      title="Mark this task not done again"
                    >
                      Undo
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeleteEntry(e.id)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity ${muted} hover:text-red-500`}
                      title="Delete entry"
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── What's on ───────────────────────────────────────────────── */}
        <div className={`rounded-xl border ${card} p-5`}>
          <h2 className={`text-lg font-semibold ${text} mb-1`}>What&apos;s on</h2>
          <p className={`text-xs ${muted} mb-4`}>
            Tick something off and it lands in the log automatically.
          </p>

          {/* Quick add */}
          <div className="flex items-center gap-2 mb-5">
            <input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              placeholder="Add a task for this day…"
              className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
            />
            <button
              onClick={handleQuickAdd}
              disabled={!quickTitle.trim()}
              className={`p-2 rounded-lg ${
                darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"
              } hover:bg-blue-600 hover:text-white disabled:opacity-40 transition-colors`}
              title="Add task"
            >
              <AddIcon fontSize="small" />
            </button>
          </div>

          <div className="space-y-5">
            <Section
              title="Overdue"
              icon={<OverdueIcon fontSize="small" />}
              count={overdue.length}
              tone="text-red-500"
            >
              {overdue.slice(0, 8).map((t) => (
                <TaskRow key={t.id} task={t} tone="overdue" />
              ))}
              {overdue.length > 8 && (
                <div className={`text-xs ${muted} pl-3`}>
                  +{overdue.length - 8} more overdue
                </div>
              )}
            </Section>

            <Section
              title="Due today"
              icon={<TodayIcon fontSize="small" />}
              count={dueToday.length}
              tone="text-blue-500"
            >
              {dueToday.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </Section>

            <Section
              title="In progress"
              icon={<InProgressIcon fontSize="small" />}
              count={inProgress.length}
              tone="text-yellow-500"
            >
              {inProgress.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </Section>

            <Section
              title="Completed"
              icon={<DoneIcon fontSize="small" />}
              count={completedToday.length}
              tone="text-green-500"
            >
              {completedToday.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${muted}`}
                >
                  <DoneIcon fontSize="small" className="text-green-500" />
                  <span className="text-sm line-through truncate">{t.title}</span>
                </div>
              ))}
            </Section>

            {overdue.length +
              dueToday.length +
              inProgress.length +
              completedToday.length ===
              0 && (
              <div className={`text-sm ${muted} py-8 text-center`}>
                Nothing scheduled for this day.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
