"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Close as ClearIcon,
  BookmarkBorder as SaveViewIcon,
  DeleteOutline as RemoveIcon,
} from "@mui/icons-material";
import { SearchInput, Select, OverflowMenu } from "./ui/Components";

/**
 * Filter toolbar.
 *
 * This was a 280px card titled "Smart Filters" with a gradient icon tile and
 * the subtitle "Refine your task view with intelligent filtering" — marketing
 * copy occupying the space where the data should be. Together with the stat
 * strip and the list header it pushed the first task row below the fold.
 *
 * It is now a single toolbar row: search on the left, the three filters and a
 * clear action on the right. Same controls, ~48px instead of ~280px.
 */
export default function Filters({ filter = {}, setFilter, projects = [] }) {
  const active = [filter.status, filter.priority, filter.project, filter.search].filter(
    Boolean,
  ).length;

  const set = (patch) => setFilter({ ...filter, ...patch });

  /* Saved views: a named filter you can come back to, kept in app_settings so
     it survives a reload and is the same on every device hitting this app. */
  const [views, setViews] = useState([]);

  const load = useCallback(() => {
    fetch("/api/views")
      .then((r) => r.json())
      .then((d) => setViews(d.views || []))
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const saveCurrent = async () => {
    const name = window.prompt("Name this view", "")?.trim();
    if (!name) return;
    const res = await fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, filter }),
    });
    const d = await res.json();
    if (d.error) window.alert(d.error);
    else setViews(d.views || []);
  };

  const removeView = async (name) => {
    const d = await fetch(`/api/views?name=${encodeURIComponent(name)}`, {
      method: "DELETE",
    }).then((r) => r.json());
    setViews(d.views || []);
  };

  const isCurrent = (v) =>
    (v.filter.search || "") === (filter.search || "") &&
    (v.filter.status || "") === (filter.status || "") &&
    (v.filter.priority || "") === (filter.priority || "") &&
    (v.filter.project || "") === (filter.project || "");

  return (
    <>
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-2">
      <SearchInput
        value={filter.search || ""}
        onChange={(e) => set({ search: e.target.value })}
        placeholder="Search tasks…"
        className="min-w-[220px] flex-1"
        aria-label="Search tasks"
      />

      <Select
        value={filter.status || ""}
        onChange={(e) => set({ status: e.target.value })}
        aria-label="Filter by status"
        className="!w-auto min-w-[128px]"
      >
        <option value="">All status</option>
        <option value="todo">To do</option>
        <option value="in-progress">In progress</option>
        <option value="on-hold">On hold</option>
        <option value="completed">Completed</option>
      </Select>

      <Select
        value={filter.priority || ""}
        onChange={(e) => set({ priority: e.target.value })}
        aria-label="Filter by priority"
        className="!w-auto min-w-[124px]"
      >
        <option value="">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </Select>

      <Select
        value={filter.project || ""}
        onChange={(e) => set({ project: e.target.value })}
        aria-label="Filter by project"
        className="!w-auto min-w-[132px]"
      >
        <option value="">All projects</option>
        {projects.map((p) => {
          const name = p.name || p;
          return (
            <option key={name} value={name}>
              {name}
            </option>
          );
        })}
      </Select>

      {/* Only offered when there is something worth naming. */}
      {active > 0 && (
        <button
          onClick={saveCurrent}
          title="Save this filter as a view"
          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-[12px] font-medium text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
        >
          <SaveViewIcon sx={{ fontSize: 15 }} />
          Save view
        </button>
      )}

      {/* Only offered when there is something to clear. */}
      {active > 0 && (
        <button
          onClick={() => set({ status: "", priority: "", project: "", search: "" })}
          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-[12px] font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
        >
          <ClearIcon sx={{ fontSize: 15 }} />
          Clear
          <span className="font-mono tabular-nums text-[var(--fg-subtle)]">{active}</span>
        </button>
      )}
    </div>

    <SavedViews
      views={views}
      filter={filter}
      isCurrent={isCurrent}
      onApply={(v) => setFilter({ ...filter, ...v.filter })}
      onRemove={removeView}
    />
    </>
  );
}

function SavedViews({ views, filter, isCurrent, onApply, onRemove }) {
  if (views.length === 0) return null;
  return (
    <div className="-mt-2 mb-4 flex flex-wrap items-center gap-1.5">
      <span className="eyebrow mr-0.5">Views</span>
      {views.map((v) => (
        <span
          key={v.name}
          className={`group inline-flex items-center rounded-full border transition-colors ${
            isCurrent(v)
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:border-[var(--border-strong)]"
          }`}
        >
          <button
            onClick={() => onApply(v)}
            className="py-1 pl-2.5 pr-1 text-[12px] font-medium"
            title={describeView(v)}
          >
            {v.name}
          </button>
          <button
            onClick={() => onRemove(v.name)}
            aria-label={`Delete view ${v.name}`}
            className="py-1 pl-0.5 pr-2 text-[var(--fg-subtle)] opacity-0 transition-opacity hover:text-[var(--danger)] group-hover:opacity-100"
          >
            <RemoveIcon sx={{ fontSize: 13 }} />
          </button>
        </span>
      ))}
    </div>
  );
}

/** The tooltip: what this view actually filters to. */
function describeView(v) {
  const parts = [];
  if (v.filter.search) parts.push(`matching “${v.filter.search}”`);
  if (v.filter.status) parts.push(v.filter.status.replace("-", " "));
  if (v.filter.priority) parts.push(`${v.filter.priority} priority`);
  if (v.filter.project) parts.push(v.filter.project);
  return parts.length ? `Tasks ${parts.join(", ")}` : "All tasks";
}