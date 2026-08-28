"use client";
import React, { useState } from "react";
import {
  ListAlt as ListAltIcon,
  Archive as ArchiveIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
  ViewKanban as KanbanIcon,
  Today as TodayIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
} from "@mui/icons-material";
import { Button } from "./ui/Components";

/**
 * Primary navigation.
 *
 * Off-canvas below `lg`, docked above it. Destinations are grouped by job —
 * "what's on now" vs "how work is organised" vs "history" — because a flat
 * list of eight peers gives the user no map of the product.
 */

export const NAV_GROUPS = [
  {
    id: "work",
    label: "Workspace",
    items: [
      { id: "today", label: "Today", icon: TodayIcon, hint: "What you did and what's on" },
      { id: "dashboard", label: "Dashboard", icon: DashboardIcon, hint: "Metrics and trends" },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    items: [
      { id: "tasks", label: "All tasks", icon: ListAltIcon, countKey: "openTasks", hint: "Table and filters" },
      { id: "kanban", label: "Board", icon: KanbanIcon, hint: "Drag between columns" },
      { id: "calendar", label: "Calendar", icon: CalendarIcon, hint: "By due date" },
      { id: "timeline", label: "Timeline", icon: TimelineIcon, hint: "Schedule across projects" },
    ],
  },
  {
    id: "organise",
    label: "Organise",
    items: [
      { id: "projects", label: "Projects", icon: FolderIcon, countKey: "projects", hint: "Clients and workstreams" },
      { id: "archived", label: "Archived", icon: ArchiveIcon, countKey: "archived", hint: "Restore or remove" },
    ],
  },
];

/** Flat lookup so the header can resolve a breadcrumb trail from a page id. */
export const NAV_INDEX = NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => ({ ...i, group: g.label })),
).reduce((acc, i) => ({ ...acc, [i.id]: i }), {});

export default function Sidebar({
  activePage,
  setActivePage,
  tasks = [],
  archivedTasks = [],
  projects = [],
  filter,
  setFilter,
  onAddTask,
  isOpen = false,
  onClose = () => {},
}) {
  const [collapsed, setCollapsed] = useState({});
  const [showAllProjects, setShowAllProjects] = useState(false);

  /* Badges must match what the destination page actually lists, or the nav
     contradicts the page header. "All tasks" lists everything not archived. */
  const counts = {
    openTasks: tasks.filter((t) => t.status !== "archived").length,
    projects: projects.length,
    archived: tasks.filter((t) => t.status === "archived").length,
  };

  const go = (page) => {
    setActivePage(page);
    onClose();
  };

  const visibleProjects = showAllProjects ? projects : projects.slice(0, 5);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-overlay bg-[rgb(8_12_20/0.55)] backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Main navigation"
        className={`glass fixed inset-y-0 left-0 z-modal flex w-[268px] max-w-[85vw] flex-col
          border-r
          transition-transform duration-300 ease-out
          lg:z-drawer lg:translate-x-0
          ${isOpen ? "translate-x-0 shadow-lg" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-[5px] bg-[var(--accent)] text-[var(--accent-fg)]">
              <AssignmentIcon sx={{ fontSize: 14 }} />
            </span>
            <span className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[var(--fg)]">
              Work Tracker
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="-mr-1 rounded p-1.5 text-[var(--fg-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)] lg:hidden"
          >
            <CloseIcon sx={{ fontSize: 17 }} />
          </button>
        </div>

        {/* Quick action */}
        <div className="flex-shrink-0 px-3 pb-1 pt-3">
          <Button
            variant="primary"
            size="md"
            icon={AddIcon}
            className="w-full"
            onClick={() => {
              onAddTask?.();
              onClose();
            }}
          >
            New task
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {NAV_GROUPS.map((group) => {
            const isCollapsed = collapsed[group.id];
            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [group.id]: !c[group.id] }))
                  }
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
                >
                  <ExpandIcon
                    sx={{ fontSize: 14 }}
                    className={`transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                    aria-hidden="true"
                  />
                  {group.label}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {group.items.map(({ id, label, icon: Icon, countKey, hint }) => {
                      const isActive = activePage === id;
                      const count = countKey ? counts[countKey] : 0;
                      return (
                        <button
                          key={id}
                          onClick={() => go(id)}
                          aria-current={isActive ? "page" : undefined}
                          className={`group relative flex w-full items-start gap-2.5 rounded-[var(--radius)] py-2 pl-6 pr-2.5 text-left transition-colors duration-150 ${
                            isActive
                              ? "bg-[var(--accent-soft)]"
                              : "hover:bg-[var(--surface-2)]"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`absolute left-1 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[var(--accent)] transition-opacity ${
                              isActive ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <span
                            className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-[6px] transition-colors ${
                              isActive
                                ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                                : "bg-[var(--surface-2)] text-[var(--fg-subtle)] group-hover:text-[var(--fg-muted)]"
                            }`}
                          >
                            <Icon sx={{ fontSize: 14 }} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`flex items-center gap-2 text-[13px] leading-tight ${
                                isActive
                                  ? "font-medium text-[var(--accent)]"
                                  : "text-[var(--fg)]"
                              }`}
                            >
                              <span className="truncate">{label}</span>
                              {count > 0 && (
                                <span className="ml-auto flex-none rounded-full bg-[var(--surface-2)] px-1.5 font-mono text-[10px] tabular-nums text-[var(--fg-subtle)]">
                                  {count}
                                </span>
                              )}
                            </span>
                            {hint && (
                              <span className="mt-0.5 block truncate text-[11px] leading-tight text-[var(--fg-subtle)]">
                                {hint}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {projects.length > 0 && (
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <h2 className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--fg-subtle)]">
                Projects
              </h2>
              <div className="space-y-0.5">
                {visibleProjects.map((project) => {
                  const name = project.name || project;
                  const count = tasks.filter(
                    (t) =>
                      t.project === name &&
                      t.status !== "completed" &&
                      t.status !== "archived",
                  ).length;
                  const isActive =
                    activePage === "tasks" && filter?.project === name;
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        setFilter({ ...filter, project: name });
                        go("tasks");
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] transition-colors ${
                        isActive
                          ? "bg-[var(--surface-2)] text-[var(--fg)]"
                          : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 flex-none rounded-full"
                        style={{ background: project.color || "var(--fg-subtle)" }}
                      />
                      <span className="flex-1 truncate text-left">{name}</span>
                      {count > 0 && (
                        <span className="font-mono text-[11px] tabular-nums text-[var(--fg-subtle)]">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {projects.length > 5 && (
                <button
                  onClick={() => setShowAllProjects((v) => !v)}
                  className="mt-0.5 w-full rounded px-2 py-1.5 text-left text-[12px] text-[var(--accent)] hover:underline"
                >
                  {showAllProjects
                    ? "Show less"
                    : `Show ${projects.length - 5} more`}
                </button>
              )}
            </div>
          )}
        </nav>

        <div className="flex-shrink-0 border-t border-[var(--border)] px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] text-[var(--fg-subtle)]">
            <span className="relative flex h-1.5 w-1.5 flex-none">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            </span>
            <span className="font-mono tabular-nums">
              {counts.openTasks} active · {counts.projects} projects
            </span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--fg-subtle)]">
            Turso · local
          </div>
        </div>
      </aside>
    </>
  );
}
