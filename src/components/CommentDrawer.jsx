"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  SendRounded as SendIcon,
} from "@mui/icons-material";
import { addComment, deleteComment } from "../redux/slices/taskSlice";
import { Button, Textarea } from "./ui/Components";
import { EmptyState } from "./ui/Primitives";

/**
 * Task detail drawer: discussion and history for one task.
 *
 * This component existed but was mounted nowhere, and was built on MUI
 * components the rest of the app dropped. It is now token-styled, reachable
 * from the task rows, and writes through to the `comments` table instead of
 * component state — so notes survive a reload.
 *
 * The Activity tab reads `activity_log`, which the repositories have been
 * writing on every change since the database cutover.
 */

const ACTION_LABEL = {
  created: "Created",
  updated: "Changed",
  archived: "Archived",
  archived_with_project: "Archived with project",
  restored: "Restored",
  deleted: "Deleted",
  purged: "Deleted permanently",
};

const FIELD_LABEL = { status: "Status", priority: "Priority", project: "Project" };

const prettyValue = (v) =>
  !v ? "—" : String(v).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(then).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function CommentDrawer({ open, onClose, task }) {
  const dispatch = useDispatch();
  const [tab, setTab] = useState("comments");
  const [text, setText] = useState("");
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const comments = useMemo(() => task?.comments ?? [], [task]);

  /* Escape closes; the body is locked so the drawer scrolls, not the page. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !task?.id || tab !== "activity") return undefined;
    let cancelled = false;
    setLoadingEvents(true);
    fetch(`/api/activity?entity_id=${encodeURIComponent(task.id)}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setEvents(d.events || []))
      .catch(() => !cancelled && setEvents([]))
      .finally(() => !cancelled && setLoadingEvents(false));
    return () => {
      cancelled = true;
    };
  }, [open, task?.id, tab]);

  if (!open || !task) return null;

  const submit = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    dispatch(addComment({ taskId: task.id, body, author: "me" }));
    setText("");
  };

  const TABS = [
    { id: "comments", label: "Notes", count: comments.length },
    { id: "activity", label: "History", count: null },
  ];

  return (
    <div className="fixed inset-0 z-modal flex justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-[rgb(8_12_20/0.55)] backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside
        className="relative flex h-full w-full max-w-[420px] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl"
        style={{ animation: "drawer-in 320ms var(--ease-out-expo) both" }}
      >
        <header className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="eyebrow">Task detail</div>
            <h2 className="mt-1 truncate text-[15px] font-semibold text-[var(--fg)]">
              {task.title}
            </h2>
            {task.project && (
              <p className="mt-0.5 truncate text-[12px] text-[var(--fg-subtle)]">
                {task.project}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </header>

        <div className="flex gap-1 border-b border-[var(--border)] px-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-3 py-2.5 text-[13px] font-medium transition-colors ${
                tab === t.id
                  ? "text-[var(--fg)]"
                  : "text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 font-mono text-[11px] tabular-nums text-[var(--fg-subtle)]">
                  {t.count}
                </span>
              )}
              {tab === t.id && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {tab === "comments" ? (
            comments.length === 0 ? (
              <EmptyState
                title="No notes yet"
                description="Jot down what you tried, who you spoke to, or where you left off."
              />
            ) : (
              <ul className="space-y-2.5">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="group rounded-[var(--radius)] border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-[var(--fg-muted)]">
                        {c.author || "me"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-[var(--fg-subtle)]">
                          {timeAgo(c.createdAt)}
                        </span>
                        <button
                          onClick={() => dispatch(deleteComment(c.id))}
                          aria-label="Delete note"
                          className="text-[var(--fg-subtle)] opacity-0 transition-opacity hover:text-[var(--danger)] group-hover:opacity-100"
                        >
                          <DeleteIcon sx={{ fontSize: 15 }} />
                        </button>
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--fg)]">
                      {c.text}
                    </p>
                  </li>
                ))}
              </ul>
            )
          ) : loadingEvents ? (
            <p className="py-8 text-center text-[13px] text-[var(--fg-subtle)]">Loading…</p>
          ) : events.length === 0 ? (
            <EmptyState title="No history" description="Changes to this task will appear here." />
          ) : (
            <ol className="relative space-y-3 border-l border-[var(--border)] pl-4">
              {events.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--border-strong)]" />
                  <div className="text-[13px] text-[var(--fg)]">
                    {ACTION_LABEL[ev.action] || ev.action}
                    {ev.field && (
                      <>
                        {" "}
                        <span className="text-[var(--fg-muted)]">
                          {FIELD_LABEL[ev.field] || ev.field}
                        </span>{" "}
                        <span className="font-mono text-[12px] text-[var(--fg-subtle)]">
                          {prettyValue(ev.old_value)} → {prettyValue(ev.new_value)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-[var(--fg-subtle)]">
                    {timeAgo(ev.created_at)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {tab === "comments" && (
          <form
            onSubmit={submit}
            className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
              }}
              rows={2}
              placeholder="Add a note…"
              aria-label="Add a note"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[11px] text-[var(--fg-subtle)]">⌘↵ to save</span>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={SendIcon}
                disabled={!text.trim()}
              >
                Add note
              </Button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
