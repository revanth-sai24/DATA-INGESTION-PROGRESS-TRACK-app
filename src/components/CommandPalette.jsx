"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Search as SearchIcon,
  ArrowForward as GoIcon,
  KeyboardReturn as EnterIcon,
} from "@mui/icons-material";
import { StatusPill } from "./ui/Primitives";

/**
 * Command palette (Ctrl/⌘ K).
 *
 * One box for the two things you do most: jump to a screen, or find a task by
 * name. Navigating used to mean reaching for the sidebar, and finding a task
 * meant going to All tasks first and typing into the filter.
 *
 * Matching is a simple subsequence test, so "prpui" finds "Prepare UI/UX".
 */

/**
 * Score a candidate against the query. Higher is better, 0 means no match.
 *
 * Filtering alone is not enough: "board" is a subsequence of "Dashboard"
 * (d-a-s-h-B-O-A-R-D), so a plain subsequence test ranked Dashboard alongside
 * Board and Enter picked the wrong one. A real prefix beats a word start,
 * which beats a substring, which beats a scattered subsequence.
 */
function score(text, q) {
  if (!q) return 1;
  const t = String(text || "").toLowerCase();
  if (!t) return 0;

  if (t === q) return 1000;
  if (t.startsWith(q)) return 800 - t.length;

  /* Start of any word: "ui" should find "Prepare UI/UX". */
  const wordStart = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  if (wordStart.test(t)) return 600 - t.length;

  if (t.includes(q)) return 400 - t.length;

  /* Scattered subsequence — the weakest signal, so it ranks last. */
  let i = 0;
  for (const ch of q) {
    i = t.indexOf(ch, i);
    if (i === -1) return 0;
    i += 1;
  }
  return 100 - t.length;
}

export default function CommandPalette({ open, onClose, screens = [], onGoto, onOpenTask }) {
  const { tasks } = useSelector((state) => state.tasks);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      /* The input mounts with the overlay; focus on the next frame. */
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const screenHits = screens
      .map((s) => ({
        kind: "screen",
        id: s.id,
        label: s.label,
        sub: s.hint,
        /* The hint is a weaker signal than the name it sits under. */
        score: Math.max(score(s.label, needle), score(s.hint || "", needle) * 0.4),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    const taskHits = (needle ? tasks : [])
      .filter((t) => t.status !== "archived")
      .map((t) => ({
        kind: "task",
        id: t.id,
        label: t.title,
        sub: t.project || "No project",
        status: t.status,
        task: t,
        score: Math.max(score(t.title || "", needle), score(t.project || "", needle) * 0.5),
      }))
      .filter((t) => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    /* A task named exactly what you typed should outrank a loose screen match. */
    return [...screenHits, ...taskHits].sort((a, b) => b.score - a.score);
  }, [q, screens, tasks]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  /* Keep the highlighted row in view when arrowing past the fold. */
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const run = (item) => {
    if (!item) return;
    onClose?.();
    if (item.kind === "screen") onGoto?.(item.id);
    else onOpenTask?.(item.task);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-start justify-center bg-[rgb(8_12_20/0.6)] px-4 pt-[12vh] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl"
        style={{ animation: "menu-in 160ms var(--ease-out-expo) both" }}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3.5 py-3">
          <SearchIcon sx={{ fontSize: 18 }} className="text-[var(--fg-subtle)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a screen, or find a task…"
            aria-label="Command palette search"
            className="flex-1 bg-transparent text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none"
          />
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--fg-subtle)]">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--fg-subtle)]">
              Nothing matches “{q}”
            </p>
          ) : (
            results.map((item, i) => (
              <button
                key={`${item.kind}-${item.id}`}
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(item)}
                className={`flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors ${
                  i === active ? "bg-[var(--surface-2)]" : ""
                }`}
              >
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[10px] font-semibold uppercase ${
                    item.kind === "screen"
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-[var(--surface-3)] text-[var(--fg-subtle)]"
                  }`}
                >
                  {item.kind === "screen" ? "GO" : "T"}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-[var(--fg)]">
                    {item.label}
                  </span>
                  {item.sub && (
                    <span className="block truncate text-[11px] text-[var(--fg-subtle)]">
                      {item.sub}
                    </span>
                  )}
                </span>

                {item.kind === "task" ? (
                  <StatusPill status={item.status} />
                ) : (
                  <GoIcon sx={{ fontSize: 15 }} className="text-[var(--fg-subtle)]" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border)] px-3.5 py-2 font-mono text-[10px] text-[var(--fg-subtle)]">
          <span className="flex items-center gap-1">
            <EnterIcon sx={{ fontSize: 12 }} /> open
          </span>
          <span>↑↓ move</span>
          <span className="ml-auto">{results.length} result{results.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}
