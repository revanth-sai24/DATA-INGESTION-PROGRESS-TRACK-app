"use client";
import React from "react";
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
} from "@mui/icons-material";

/**
 * Off-canvas below `lg`, docked above it. Colours come from the CSS custom
 * properties in globals.css, so the light/dark switch happens once on the
 * shell rather than in a ternary on every element.
 */
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
  const openCount = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "archived",
  ).length;

  const NAV = [
    { id: "today", label: "Today", icon: TodayIcon },
    { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
    { id: "tasks", label: "All tasks", icon: ListAltIcon, count: openCount },
    { id: "kanban", label: "Board", icon: KanbanIcon },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "timeline", label: "Timeline", icon: TimelineIcon },
    {
      id: "projects",
      label: "Projects",
      icon: FolderIcon,
      count: projects.length,
    },
    {
      id: "archived",
      label: "Archived",
      icon: ArchiveIcon,
      count: archivedTasks.length,
    },
  ];

  const go = (page) => {
    setActivePage(page);
    onClose();
  };

  const navItemClass = (isActive) =>
    [
      "group relative w-full flex items-center gap-3 rounded-lg pl-4 pr-3 py-2.5",
      "text-sm transition-colors duration-150",
      isActive
        ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
        : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]",
    ].join(" ");

  return (
    <>
      {/* Scrim — only exists while the drawer is open on small screens */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-overlay bg-[rgb(13_17_23/0.5)] backdrop-blur-[2px] lg:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-modal flex w-[280px] max-w-[85vw] flex-col
          border-r border-[var(--border)] bg-[var(--surface)]
          transition-transform duration-300 ease-out
          lg:z-drawer lg:translate-x-0
          ${isOpen ? "translate-x-0 shadow-lg" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-[var(--accent-fg)]">
              <AssignmentIcon sx={{ fontSize: 16 }} />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--fg)]">
              Work Tracker
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="-mr-1 rounded-md p-1.5 text-[var(--fg-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)] lg:hidden"
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV.map(({ id, label, icon: Icon, count }) => {
            const isActive = activePage === id;
            return (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={isActive ? "page" : undefined}
                className={navItemClass(isActive)}
              >
                {/* Active marker: a rule, not a filled pill */}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent)] transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
                <Icon sx={{ fontSize: 18 }} className="flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {count > 0 && (
                  <span className="tabular font-mono text-xs text-[var(--fg-subtle)]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {projects.length > 0 && (
            <div className="pt-6">
              <h2 className="px-4 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
                Projects
              </h2>
              {projects.slice(0, 5).map((project) => {
                const name = project.name || project;
                const count = tasks.filter(
                  (t) =>
                    t.project === name &&
                    t.status !== "completed" &&
                    t.status !== "archived",
                ).length;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setFilter({ ...filter, project: name });
                      go("tasks");
                    }}
                    className="group flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: project.color || "var(--fg-subtle)" }}
                    />
                    <span className="flex-1 truncate text-left">{name}</span>
                    {count > 0 && (
                      <span className="tabular font-mono text-xs text-[var(--fg-subtle)]">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
              {projects.length > 5 && (
                <button
                  onClick={() => go("projects")}
                  className="w-full px-4 py-2 text-left text-xs text-[var(--accent)] hover:underline"
                >
                  {projects.length - 5} more
                </button>
              )}
            </div>
          )}
        </nav>

        <div className="flex-shrink-0 border-t border-[var(--border)] p-3">
          <button
            onClick={() => {
              onAddTask?.();
              onClose();
            }}
            className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
          >
            <AddIcon sx={{ fontSize: 18 }} />
            New task
          </button>
        </div>
      </aside>
    </>
  );
}
