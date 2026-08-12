"use client";
import React from "react";

/**
 * Shared UI primitives.
 *
 * The app previously styled a status badge five different ways across five
 * screens. Consistency is most of what reads as "enterprise" — one pill, one
 * header, one empty state, used everywhere.
 */

/* ── status / priority ──────────────────────────────────────────────────── */

const STATUS = {
  todo: { label: "To do", fg: "var(--fg-muted)", bg: "var(--surface-3)" },
  "in-progress": { label: "In progress", fg: "var(--accent)", bg: "var(--accent-soft)" },
  in_progress: { label: "In progress", fg: "var(--accent)", bg: "var(--accent-soft)" },
  "on-hold": { label: "On hold", fg: "var(--accent-2)", bg: "var(--accent-2-soft)" },
  on_hold: { label: "On hold", fg: "var(--accent-2)", bg: "var(--accent-2-soft)" },
  completed: { label: "Done", fg: "var(--success)", bg: "var(--success-soft)" },
  archived: { label: "Archived", fg: "var(--fg-subtle)", bg: "var(--surface-2)" },
};

const PRIORITY = {
  urgent: { label: "Urgent", fg: "var(--danger)", bg: "var(--danger-soft)" },
  high: { label: "High", fg: "var(--danger)", bg: "var(--danger-soft)" },
  medium: { label: "Medium", fg: "var(--accent-2)", bg: "var(--accent-2-soft)" },
  low: { label: "Low", fg: "var(--fg-muted)", bg: "var(--surface-3)" },
};

const norm = (v) => String(v ?? "").trim().toLowerCase();

export function StatusPill({ status, className = "" }) {
  const s = STATUS[norm(status)] ?? {
    label: status || "Unknown",
    fg: "var(--fg-muted)",
    bg: "var(--surface-3)",
  };
  return (
    <span className={`pill ${className}`} style={{ color: s.fg, background: s.bg }}>
      <span className="pill-dot" aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function PriorityPill({ priority, className = "" }) {
  const p = PRIORITY[norm(priority)];
  if (!p) return null;
  return (
    <span className={`pill ${className}`} style={{ color: p.fg, background: p.bg }}>
      {p.label}
    </span>
  );
}

/* ── page header ────────────────────────────────────────────────────────── */

export function PageHeader({ title, description, meta, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-[-0.015em] text-[var(--fg)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-[60ch] text-[13px] text-[var(--fg-muted)]">
            {description}
          </p>
        )}
        {meta && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] tabular-nums text-[var(--fg-subtle)]">
            {meta}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/* ── empty state ────────────────────────────────────────────────────────── */

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] px-6 py-14 text-center">
      {Icon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--fg-subtle)]">
          <Icon sx={{ fontSize: 20 }} />
        </span>
      )}
      <p className="text-sm font-medium text-[var(--fg)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-[42ch] text-[13px] text-[var(--fg-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── stat strip ─────────────────────────────────────────────────────────── */

export function StatStrip({ items = [] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
      {items.map(({ label, value, tone }) => (
        <div key={label} className="bg-[var(--surface)] px-4 py-3">
          <div className="kpi-label">{label}</div>
          <div
            className="mt-1 font-mono text-xl font-medium tabular-nums leading-none"
            style={{ color: tone || "var(--fg)" }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
