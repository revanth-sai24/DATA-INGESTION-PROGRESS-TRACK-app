"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MoreHoriz as MoreHorizIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

/**
 * Enterprise component library.
 *
 * Every control here is token-driven, keyboard-operable, and sized to the
 * dashboard density scale. Screens should compose these rather than
 * hand-rolling a button or an input, which is how the app ended up with five
 * different badge styles in the first place.
 */

/* ── Button ─────────────────────────────────────────────────────────────── */

const BUTTON_VARIANTS = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] border border-transparent",
  secondary:
    "bg-[var(--surface)] text-[var(--fg)] border border-[var(--border-strong)] hover:bg-[var(--surface-2)]",
  ghost:
    "bg-transparent text-[var(--fg-muted)] border border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--fg)]",
  danger:
    "bg-[var(--danger)] text-white border border-transparent hover:opacity-90",
};

const BUTTON_SIZES = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-8 px-3 text-[13px] gap-1.5",
  lg: "h-10 px-4 text-sm gap-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconRight,
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] font-medium
        transition-colors duration-150 active:translate-y-px
        disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0
        ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
        />
      ) : (
        Icon && <Icon sx={{ fontSize: size === "lg" ? 18 : 15 }} />
      )}
      {children}
      {iconRight && !loading && React.createElement(iconRight, { sx: { fontSize: 15 } })}
    </button>
  );
}

/** Icon-only button. `label` is required — it becomes the accessible name. */
export function IconButton({ icon: Icon, label, size = "md", className = "", ...rest }) {
  const box = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)]
        text-[var(--fg-muted)] transition-colors duration-150
        hover:bg-[var(--surface-2)] hover:text-[var(--fg)]
        disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent
        ${box} ${className}`}
      {...rest}
    >
      <Icon sx={{ fontSize: size === "sm" ? 15 : 17 }} />
    </button>
  );
}

/* ── Card / Panel ───────────────────────────────────────────────────────── */

export function Card({ title, description, actions, padded = true, className = "", children }) {
  return (
    <section
      className={`overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2.5">
          <div className="min-w-0">
            {title && <h2 className="panel-title truncate">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs text-[var(--fg-muted)]">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}

/* ── Field primitives ───────────────────────────────────────────────────── */

export function Field({ label, htmlFor, required, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-[12px] font-medium text-[var(--fg-muted)]"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-[var(--danger)]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {/* Helper text is persistent; placeholder-only labels fail the moment a
          user starts typing. Error replaces it and is announced. */}
      {error ? (
        <p role="alert" className="text-[12px] text-[var(--danger)]">
          {error}
        </p>
      ) : (
        hint && <p className="text-[12px] text-[var(--fg-subtle)]">{hint}</p>
      )}
    </div>
  );
}

const controlBase = `w-full rounded-[var(--radius-sm)] border bg-[var(--surface)] px-2.5 text-[13px]
  text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)]
  focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]`;

export function Input({ invalid, className = "", ...rest }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`${controlBase} h-8 ${
        invalid
          ? "border-[var(--danger)]"
          : "border-[var(--border-strong)] focus:border-[var(--accent)]"
      } ${className}`}
      {...rest}
    />
  );
}

export function Textarea({ className = "", rows = 3, ...rest }) {
  return (
    <textarea
      rows={rows}
      className={`${controlBase} resize-y border-[var(--border-strong)] py-2 focus:border-[var(--accent)] ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = "", children, ...rest }) {
  return (
    <select
      className={`${controlBase} h-8 cursor-pointer border-[var(--border-strong)] focus:border-[var(--accent)] ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function SearchInput({ className = "", ...rest }) {
  return (
    <div className={`relative ${className}`}>
      <SearchIcon
        sx={{ fontSize: 16 }}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]"
      />
      <input
        type="search"
        className={`${controlBase} h-8 border-[var(--border-strong)] pl-8 focus:border-[var(--accent)]`}
        {...rest}
      />
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────────────────── */

export function Modal({ open, onClose, title, description, footer, size = "md", children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" }[size];

  return (
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-[rgb(8_12_20/0.6)] p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92dvh] w-full ${width} flex-col overflow-hidden rounded-t-xl border
          border-[var(--border)] bg-[var(--surface)] shadow-lg outline-none sm:max-h-[88dvh] sm:rounded-[var(--radius-lg)]`}
      >
        <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[var(--border)] px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--fg)]">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-[13px] text-[var(--fg-muted)]">{description}</p>
            )}
          </div>
          <IconButton icon={CloseIcon} label="Close" onClick={onClose} size="sm" />
        </header>

        {/* A confirmation carries all its text in the header, so the body
            region is skipped rather than rendered as an empty strip. */}
        {children != null && children !== false && (
          <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        )}

        {footer && (
          <footer className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/* ── Tabs ───────────────────────────────────────────────────────────────── */

export function Tabs({ tabs = [], value, onChange, className = "" }) {
  return (
    <div
      role="tablist"
      className={`flex gap-1 overflow-x-auto border-b border-[var(--border)] ${className}`}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(t.id)}
            className={`relative whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors
              ${active ? "text-[var(--fg)]" : "text-[var(--fg-muted)] hover:text-[var(--fg)]"}`}
          >
            {t.label}
            {t.count != null && (
              <span className="ml-1.5 font-mono text-[11px] tabular-nums text-[var(--fg-subtle)]">
                {t.count}
              </span>
            )}
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--accent)] transition-opacity ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ── Breadcrumbs ────────────────────────────────────────────────────────── */

export function Breadcrumbs({ items = [] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-[13px]">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="flex min-w-0 items-center gap-1">
              {i > 0 && (
                <ChevronRightIcon
                  sx={{ fontSize: 14 }}
                  className="flex-none text-[var(--fg-subtle)]"
                  aria-hidden="true"
                />
              )}
              {last || !item.onClick ? (
                <span
                  aria-current={last ? "page" : undefined}
                  className={`truncate ${last ? "font-medium text-[var(--fg)]" : "text-[var(--fg-muted)]"}`}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={item.onClick}
                  className="truncate text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] hover:underline"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── Toolbar ────────────────────────────────────────────────────────────── */

/** The bar above a table: search left, filters and actions right. */
export function Toolbar({ left, right, className = "" }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2 ${className}`}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{left}</div>
      {right && <div className="flex flex-shrink-0 items-center gap-1.5">{right}</div>}
    </div>
  );
}

/* ── Tooltip ────────────────────────────────────────────────────────────── */

export function Tooltip({ label, side = "top", children }) {
  const pos = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  }[side];
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${pos} z-popover whitespace-nowrap rounded-[var(--radius-sm)]
          border border-[var(--border)] bg-[var(--surface-3)] px-2 py-1 text-[11px] text-[var(--fg)]
          opacity-0 shadow-sm transition-opacity duration-150
          group-hover/tt:opacity-100 group-focus-within/tt:opacity-100`}
      >
        {label}
      </span>
    </span>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */

/** Shape-matched placeholder — better than a spinner for anything over ~300ms. */
export function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-3)] ${className}`}
    />
  );
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

/* ── Toast ──────────────────────────────────────────────────────────────── */

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );
  const push = useCallback(
    (message, { tone = "info", timeout = 4000 } = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((t) => [...t, { id, message, tone }]);
      if (timeout) setTimeout(() => dismiss(id), timeout);
      return id;
    },
    [dismiss],
  );
  return { toasts, push, dismiss };
}

export function ToastViewport({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;
  const tones = {
    info: "border-[var(--border-strong)]",
    success: "border-l-2 border-l-[var(--success)]",
    error: "border-l-2 border-l-[var(--danger)]",
  };
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-toast flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-[var(--radius)] border border-[var(--border)]
            bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--fg)] shadow-md ${tones[t.tone] ?? tones.info}`}
        >
          <span className="flex-1">{t.message}</span>
          <IconButton
            icon={CloseIcon}
            label="Dismiss"
            size="sm"
            onClick={() => onDismiss?.(t.id)}
          />
        </div>
      ))}
    </div>
  );
}

/* ── overflow menu ──────────────────────────────────────────────────────── */

/**
 * A "⋯" button revealing secondary actions.
 *
 * Task rows had eight icon buttons competing on one line, which overflowed the
 * column and printed the edit pencil on top of the due date. Three primary
 * actions stay inline; the rest live here, where they are labelled rather than
 * guessed at from an icon.
 *
 * `items`: [{ label, icon, onClick, danger, hidden }]
 */
export function OverflowMenu({ items = [], label = "More actions" }) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !wrap.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  const toggle = (e) => {
    e.stopPropagation();
    /* Flip upward near the viewport bottom so the last rows stay usable. */
    const box = wrap.current?.getBoundingClientRect();
    if (box) setUp(window.innerHeight - box.bottom < 40 + visible.length * 34);
    setOpen((v) => !v);
  };

  return (
    <span ref={wrap} className="relative inline-flex">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={`rounded p-1 transition-colors ${
          open
            ? "bg-[var(--surface-3)] text-[var(--fg)]"
            : "text-[var(--fg-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
        }`}
      >
        <MoreHorizIcon fontSize="small" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-popover min-w-[172px] overflow-hidden rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface-2)] py-1 shadow-2xl ${
            up ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          style={{ animation: "menu-in 140ms var(--ease-out-expo) both" }}
        >
          {visible.map(({ label: text, icon: Icon, onClick, danger }) => (
            <button
              key={text}
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onClick?.();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition-colors ${
                danger
                  ? "text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                  : "text-[var(--fg-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--fg)]"
              }`}
            >
              {Icon && <Icon sx={{ fontSize: 15 }} />}
              {text}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
