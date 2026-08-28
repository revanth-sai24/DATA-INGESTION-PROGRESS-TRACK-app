"use client";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { PlayArrow as PlayIcon, Stop as StopIcon } from "@mui/icons-material";
import { startTimer, stopTimer } from "../redux/slices/taskSlice";

/**
 * Start/stop control for a task's timer.
 *
 * The timer lives in the `time_entries` table: starting one inserts a row with
 * a null `ended_at`, stopping it fills that in. Nothing is held in component
 * state, so a running timer survives a reload — which is why every recorded
 * `timeElapsed` used to be zero. The one thing that *is* local is the ticking:
 * a 1s interval re-renders the label while running, so the number moves.
 */

/** ms → "1h 04m" / "12m 30s" / "45s" — units that read at a glance. */
export function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/** Live elapsed for a task: stored total, plus the current run if any. */
export function useElapsed(timeTracking) {
  const { elapsed = 0, isRunning = false, startTime = null } = timeTracking || {};
  const [, tick] = useState(0);

  useEffect(() => {
    if (!isRunning) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  if (!isRunning || !startTime) return elapsed;
  return elapsed + Math.max(0, Date.now() - startTime);
}

export default function TimerControl({ task, compact = false }) {
  const dispatch = useDispatch();
  const running = !!task.timeTracking?.isRunning;
  const ms = useElapsed(task.timeTracking);

  const toggle = (e) => {
    e.stopPropagation();
    dispatch(running ? stopTimer(task.id) : startTimer(task.id));
  };

  const size = compact ? 26 : 30;

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggle}
        title={running ? "Stop timer" : "Start timer"}
        aria-label={running ? "Stop timer" : "Start timer"}
        style={{ width: size, height: size }}
        className={`inline-flex flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 ease-[var(--ease-out-expo)] active:scale-95 ${
          running
            ? "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)] hover:brightness-110"
            : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--fg-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        }`}
      >
        {running ? <StopIcon sx={{ fontSize: 15 }} /> : <PlayIcon sx={{ fontSize: 16 }} />}
      </button>

      {(running || ms > 0) && (
        <span
          className={`font-mono text-[11px] tabular-nums ${
            running ? "text-[var(--danger)]" : "text-[var(--fg-subtle)]"
          }`}
        >
          {formatDuration(ms)}
        </span>
      )}
    </span>
  );
}
