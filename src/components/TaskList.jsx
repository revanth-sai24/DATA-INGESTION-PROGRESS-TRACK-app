"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  exportToCSV,
  startTimer,
  stopTimer,
  updateTask,
  deleteTask,
  duplicateTask,
  togglePinned,
  bulkArchive,
  bulkDelete,
} from "../redux/slices/taskSlice";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Archive as ArchiveIcon,
  Assignment as TaskIcon,
  Schedule as CalendarIcon,
  Flag as PriorityIcon,
  ViewModule as CardViewIcon,
  ViewList as TableViewIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  ContentCopy as DuplicateIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Warning as WarningIcon,
  Label as LabelIcon,
  SelectAll as SelectAllIcon,
  Deselect as DeselectIcon,
  CheckCircle as CompleteIcon,
  Close as CloseIcon,
  CenterFocusStrong as FocusIcon,
  ChatBubbleOutline as NotesIcon,
  AttachFile as AttachmentIcon,
  ArrowUpward as ArrowUpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FileDownloadOutlined as DownloadIcon,
  Repeat as RepeatIcon,
} from "@mui/icons-material";
import { StatStrip, EmptyState, StatusPill, PriorityPill } from "./ui/Primitives";
import { OverflowMenu } from "./ui/Components";
import { useFeedback } from "./ui/Feedback";
import TimerControl from "./TimerControl";
import CommentDrawer from "./CommentDrawer";

// Color labels configuration
const COLOR_LABELS = {
  red: "#EF4444",
  orange: "#F97316",
  yellow: "#EAB308",
  green: "#22C55E",
  blue: "#3B82F6",
  purple: "#A855F7",
  pink: "#EC4899",
  cyan: "#06B6D4",
};

/* Ranks used when sorting by a categorical column, so "high" sorts above
   "low" instead of alphabetically. */
const PRIORITY_RANK = { urgent: 4, high: 3, medium: 2, low: 1 };
const STATUS_RANK = { "in-progress": 4, todo: 3, "on-hold": 2, completed: 1, archived: 0 };

function compareBy(key, a, b) {
  switch (key) {
    case "title":
      return String(a.title || "").localeCompare(String(b.title || ""));
    case "project":
      return String(a.project || "").localeCompare(String(b.project || ""));
    case "priority":
      return (PRIORITY_RANK[a.priority] || 0) - (PRIORITY_RANK[b.priority] || 0);
    case "status":
      return (STATUS_RANK[a.status] || 0) - (STATUS_RANK[b.status] || 0);
    case "time":
      return (a.timeTracking?.elapsed || 0) - (b.timeTracking?.elapsed || 0);
    case "dueDate": {
      /* Undated tasks sort last in both directions rather than pretending to
         be due in 1970. */
      const av = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bv = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (av === bv) return 0;
      return av < bv ? -1 : 1;
    }
    default:
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  }
}

/** A column header that sorts. The arrow only shows on the active column. */
function SortHeader({ label, sortKey, sort, onSort, className = "" }) {
  const active = sort.key === sortKey;
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`group inline-flex items-center gap-1 transition-colors ${
          active ? "text-[var(--fg)]" : "hover:text-[var(--fg-muted)]"
        }`}
        title={`Sort by ${label.toLowerCase()}`}
      >
        {label}
        <ArrowUpIcon
          sx={{ fontSize: 13 }}
          className={`transition-all ${
            active
              ? sort.dir === "asc"
                ? "opacity-100"
                : "rotate-180 opacity-100"
              : "opacity-0 group-hover:opacity-40"
          }`}
        />
      </button>
    </th>
  );
}

export default function TaskList({
  activePage,
  filter,
  onEditTask,
  onContextMenu,
  onTaskHover,
  onTaskLeave,
  onFocusTask,
  darkMode,
}) {
  const dispatch = useDispatch();
  const { confirm, toast } = useFeedback();
  const { tasks, projects } = useSelector((state) => state.tasks);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // 'card' or 'table'
  const [hoveredTask, setHoveredTask] = useState(null);
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const toggleSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  // Check if task is overdue
  const isOverdue = (task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && task.status !== "completed";
  };

  // Check if task is due soon (within 3 days)
  const isDueSoon = (task) => {
    if (!task.dueDate || isOverdue(task)) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const threeDaysFromNow = new Date(
      today.getTime() + 3 * 24 * 60 * 60 * 1000,
    );
    return dueDate <= threeDaysFromNow && task.status !== "completed";
  };

  // Filter tasks based on the current page and filters
  const getFilteredTasks = () => {
    let filteredTasks = tasks;

    // Filter by page type
    if (activePage === "tasks") {
      filteredTasks = tasks.filter((task) => task.status !== "archived");
    } else if (activePage === "archived") {
      filteredTasks = tasks.filter((task) => task.status === "archived");
    }

    // Apply additional filters
    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search) ||
          task.project?.toLowerCase().includes(search),
      );
    }

    if (filter?.status && filter.status !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.status === filter.status,
      );
    }

    if (filter?.priority && filter.priority !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === filter.priority,
      );
    }

    if (filter?.project && filter.project !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.project === filter.project,
      );
    }

    /* A copy: `tasks` is the array held in the store, and sorting it in place
       mutates state that Redux considers frozen. */
    return [...filteredTasks].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const dir = sort.dir === "asc" ? 1 : -1;
      return compareBy(sort.key, a, b) * dir;
    });
  };

  const filteredTasks = getFilteredTasks();

  useEffect(() => {
    setPage(1);
  }, [filter?.search, filter?.status, filter?.priority, filter?.project, sort.key, sort.dir, pageSize]);

  /* Pagination applies to the table only; the card grid stays a single scroll. */
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTasks =
    viewMode === "table" && pageSize !== "all"
      ? filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : filteredTasks;

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      dispatch(
        updateTask({
          ...task,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          completedAt:
            newStatus === "completed"
              ? new Date().toISOString()
              : task.completedAt,
        }),
      );
    }
  };

  const handleArchive = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      dispatch(
        updateTask({
          ...task,
          status: "archived",
          archivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      );
    }
  };

  const handleDelete = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const ok = await confirm({
      title: "Delete this task?",
      description: `“${task?.title ?? "This task"}” will be removed. Undo can bring it back this session; Archive keeps it permanently recoverable.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) {
      dispatch(deleteTask(taskId));
      toast("Task deleted — Ctrl+Z to undo", "info");
    }
  };

  const handleDuplicate = (taskId) => {
    dispatch(duplicateTask(taskId));
  };

  const handleTogglePinned = (taskId) => {
    dispatch(togglePinned(taskId));
  };

  // Bulk action handlers
  const handleSelectTask = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map((t) => t.id));
    }
  };

  const handleBulkComplete = async () => {
    const n = selectedTasks.length;
    if (n === 0) return;
    /* Complete was the only bulk action without a confirmation, and one click
       with everything selected silently marked 13 real tasks done. */
    const all = n === filteredTasks.length && n > 1;
    if (
      n > 1 &&
      !(await confirm({
        title: `Mark ${n} task${n === 1 ? "" : "s"} complete?`,
        description: all
          ? "That is every task in this view."
          : "Each one gets a line in today's work log.",
        confirmLabel: "Mark complete",
      }))
    )
      return;
    selectedTasks.forEach((taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== "completed") {
        dispatch(
          updateTask({
            ...task,
            status: "completed",
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        );
      }
    });
    setSelectedTasks([]);
  };

  const handleBulkArchive = async () => {
    const n = selectedTasks.length;
    if (n === 0) return;
    if (
      await confirm({
        title: `Move ${n} task${n === 1 ? "" : "s"} to Archived?`,
        description: "Nothing is deleted — you can restore them from the Archived screen.",
        confirmLabel: "Archive",
      })
    ) {
      dispatch(bulkArchive(selectedTasks));
      setSelectedTasks([]);
      toast(`${n} task${n === 1 ? "" : "s"} archived`, "success");
    }
  };

  const handleBulkDelete = async () => {
    const n = selectedTasks.length;
    if (n === 0) return;
    const all = n === filteredTasks.length && n > 1;
    if (
      await confirm({
        title: `Permanently delete ${n} task${n === 1 ? "" : "s"}?`,
        description: `${all ? "That is every task in this view. " : ""}This cannot be undone — use Archive instead to keep them recoverable.`,
        confirmLabel: "Delete forever",
        danger: true,
      })
    ) {
      dispatch(bulkDelete(selectedTasks));
      setSelectedTasks([]);
      toast(`${n} task${n === 1 ? "" : "s"} deleted`, "error");
    }
  };

  const handleBulkPriorityChange = async (priority) => {
    const n = selectedTasks.length;
    if (n === 0) return;
    if (
      n > 1 &&
      !(await confirm({
        title: `Set ${n} tasks to ${priority} priority?`,
        confirmLabel: "Set priority",
      }))
    )
      return;
    selectedTasks.forEach((taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        dispatch(
          updateTask({
            ...task,
            priority,
            updatedAt: new Date().toISOString(),
          }),
        );
      }
    });
    setSelectedTasks([]);
  };

  const [detailTask, setDetailTask] = useState(null);

  const toggleTimer = (task) => {
    dispatch(task.timeTracking?.isRunning ? stopTimer(task.id) : startTimer(task.id));
  };

  const toggleCheckpoint = (taskId, checkpointId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.checkpoints) {
      const updatedCheckpoints = task.checkpoints.map((cp) =>
        cp.id === checkpointId ? { ...cp, completed: !cp.completed } : cp,
      );
      dispatch(
        updateTask({
          ...task,
          checkpoints: updatedCheckpoints,
          updatedAt: new Date().toISOString(),
        }),
      );
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return darkMode
          ? "text-red-300 bg-red-900/50"
          : "text-red-600 bg-red-50";
      case "medium":
        return darkMode
          ? "text-yellow-300 bg-yellow-900/50"
          : "text-yellow-600 bg-yellow-50";
      case "low":
        return darkMode
          ? "text-green-300 bg-green-900/50"
          : "text-green-600 bg-green-50";
      default:
        return darkMode
          ? "text-gray-300 bg-gray-700"
          : "text-gray-600 bg-gray-50";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return darkMode
          ? "text-green-300 bg-green-900/50"
          : "text-green-600 bg-green-50";
      case "in-progress":
        return darkMode
          ? "text-blue-300 bg-blue-900/50"
          : "text-blue-600 bg-blue-50";
      case "todo":
        return darkMode
          ? "text-gray-300 bg-gray-700"
          : "text-gray-600 bg-gray-50";
      case "on-hold":
        return darkMode
          ? "text-orange-300 bg-orange-900/50"
          : "text-orange-600 bg-orange-50";
      default:
        return darkMode
          ? "text-gray-300 bg-gray-700"
          : "text-gray-600 bg-gray-50";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="premium-card text-center py-12">
        <TaskIcon
          className="mx-auto text-gray-400 mb-4"
          style={{ fontSize: 64 }}
        />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          {tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
        </h3>
        <p className="text-gray-500">
          {tasks.length === 0
            ? "Create your first task to get started"
            : "Try adjusting your search or filter criteria"}
        </p>
      </div>
    );
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const summary = {
    total: filteredTasks.length,
    overdue: filteredTasks.filter(
      (t) =>
        t.dueDate &&
        t.status !== "completed" &&
        String(t.dueDate).slice(0, 10) < todayKey,
    ).length,
    inProgress: filteredTasks.filter((t) => t.status === "in-progress").length,
    doneToday: tasks.filter(
      (t) => t.status === "completed" && String(t.completedAt ?? "").slice(0, 10) === todayKey,
    ).length,
  };

  return (
    <div className="space-y-5">
      {/* At-a-glance before the raw list */}
      <div className="rise rise-1">
        <StatStrip
          items={[
            { label: "In view", value: summary.total },
            {
              label: "Overdue",
              value: summary.overdue,
              tone: summary.overdue ? "var(--danger)" : undefined,
            },
            {
              label: "In progress",
              value: summary.inProgress,
              tone: summary.inProgress ? "var(--accent)" : undefined,
            },
            {
              label: "Done today",
              value: summary.doneToday,
              tone: summary.doneToday ? "var(--success)" : undefined,
            },
          ]}
        />
      </div>

      {/* One compact row: count on the left, view controls on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="panel-title">
            {activePage === "archived" ? "Archived" : "Tasks"}
          </h2>
          <span className="font-mono text-[12px] tabular-nums text-[var(--fg-subtle)]">
            {filteredTasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSelectAll}
            title={
              selectedTasks.length === filteredTasks.length && filteredTasks.length > 0
                ? "Deselect all"
                : "Select all"
            }
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
          >
            {selectedTasks.length === filteredTasks.length && filteredTasks.length > 0 ? (
              <DeselectIcon fontSize="small" />
            ) : (
              <SelectAllIcon fontSize="small" />
            )}
          </button>

          {/* Exports what you are actually looking at, filters and all —
              previously it always dumped every task, and was only reachable
              from a screen that is no longer mounted. */}
          <button
            onClick={() => dispatch(exportToCSV(filteredTasks))}
            disabled={filteredTasks.length === 0}
            title={`Export these ${filteredTasks.length} tasks to CSV`}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] disabled:pointer-events-none disabled:opacity-30"
          >
            <DownloadIcon fontSize="small" />
          </button>

          <div className="ml-1 flex items-center rounded-[var(--radius-sm)] border border-[var(--border)] p-0.5">
            {[
              { id: "card", Icon: CardViewIcon, label: "Card view" },
              { id: "table", Icon: TableViewIcon, label: "Table view" },
            ].map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                aria-pressed={viewMode === id}
                title={label}
                className={`rounded-[4px] p-1.5 transition-colors ${
                  viewMode === id
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--fg-subtle)] hover:text-[var(--fg)]"
                }`}
              >
                <Icon fontSize="small" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedTasks.length > 0 && (
        <div
          className={`flex items-center justify-between p-4 rounded-lg animate-slide-in-up ${
            darkMode
              ? "bg-blue-900/30 border border-blue-700"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`font-medium text-[var(--accent)]`}
            >
              {selectedTasks.length} task{selectedTasks.length > 1 ? "s" : ""}{" "}
              selected
            </span>
            <button
              onClick={() => setSelectedTasks([])}
              className={`p-1 rounded-full transition-colors ${
                darkMode
                  ? "hover:bg-blue-800 text-blue-400"
                  : "hover:bg-blue-100 text-blue-600"
              }`}
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Complete All */}
            <button
              onClick={handleBulkComplete}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? "bg-green-900/50 text-green-300 hover:bg-green-800/50"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              <CompleteIcon fontSize="small" />
              Complete
            </button>

            {/* Priority Dropdown */}
            <div className="relative group">
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? "bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800/50"
                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                }`}
              >
                <PriorityIcon fontSize="small" />
                Priority
              </button>
              <div
                className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${
                  darkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
              >
                {["high", "medium", "low"].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => handleBulkPriorityChange(priority)}
                    className={`w-full px-4 py-2 text-left text-sm capitalize ${
                      darkMode
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Archive All */}
            <button
              onClick={handleBulkArchive}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? "bg-orange-900/50 text-orange-300 hover:bg-orange-800/50"
                  : "bg-orange-100 text-orange-700 hover:bg-orange-200"
              }`}
            >
              <ArchiveIcon fontSize="small" />
              Archive
            </button>

            {/* Delete All */}
            <button
              onClick={handleBulkDelete}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? "bg-red-900/50 text-red-300 hover:bg-red-800/50"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              <DeleteIcon fontSize="small" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Tasks Content */}
      {filteredTasks.length === 0 ? (
        /* Empty state that tells you what to do next, not just that there is
           nothing here. */
        <EmptyState
          icon={TaskIcon}
          title={
            activePage === "archived"
              ? "Nothing archived"
              : tasks.length === 0
                ? "No tasks yet"
                : "No tasks match these filters"
          }
          description={
            activePage === "archived"
              ? "Tasks you archive will be kept here, with their project, so you can restore them later."
              : tasks.length === 0
                ? "Create your first task to start tracking what you are working on."
                : "Try widening the search, or clear a filter to see more."
          }
        />
      ) : viewMode === "card" ? (
        /* Card View */
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`premium-card hover:shadow-lg transition-all duration-200 relative ${
                task.colorLabel ? "border-l-4" : ""
              } ${selectedTasks.includes(task.id) ? (darkMode ? "ring-2 ring-blue-500 bg-blue-900/20" : "ring-2 ring-blue-500 bg-blue-50") : ""}`}
              style={{
                borderLeftColor: task.colorLabel
                  ? COLOR_LABELS[task.colorLabel]
                  : "transparent",
              }}
              onContextMenu={(e) => onContextMenu && onContextMenu(e, task)}
              onMouseEnter={() => setHoveredTask(task.id)}
              onMouseLeave={() => setHoveredTask(null)}
            >
              {/* Selection Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectTask(task.id);
                }}
                className={`absolute top-3 left-3 p-1 rounded transition-colors ${
                  selectedTasks.includes(task.id)
                    ? "text-blue-500"
                    : darkMode
                      ? "text-gray-500 hover:text-gray-300"
                      : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {selectedTasks.includes(task.id) ? (
                  <CheckBoxIcon fontSize="small" />
                ) : (
                  <CheckBoxOutlineBlankIcon fontSize="small" />
                )}
              </button>

              {/* Alert indicators */}
              {(isOverdue(task) || isDueSoon(task)) && (
                <div
                  className={`absolute -top-1 left-8 w-3 h-3 rounded-full ${
                    isOverdue(task)
                      ? "bg-red-500 animate-pulse"
                      : "bg-yellow-500"
                  }`}
                  title={isOverdue(task) ? "Overdue!" : "Due soon"}
                />
              )}

              {/* Pinned indicator */}
              {task.pinned && (
                <div className="absolute -top-1 -right-1">
                  <StarIcon
                    className="text-yellow-500 drop-shadow"
                    fontSize="small"
                  />
                </div>
              )}

              <div className="flex items-start justify-between gap-4 ml-8">
                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3
                      className={`font-semibold text-[var(--fg)] truncate`}
                    >
                      {task.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority || "medium"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                    >
                      {task.status || "todo"}
                    </span>
                    {/* Due date warning badge */}
                    {isOverdue(task) && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 flex items-center gap-1">
                        <WarningIcon fontSize="inherit" /> Overdue
                      </span>
                    )}
                    {isDueSoon(task) && !isOverdue(task) && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                        Due Soon
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p
                      className={`text-sm text-[var(--fg-muted)] mb-3 line-clamp-2`}
                    >
                      {task.description}
                    </p>
                  )}

                  <div
                    className={`flex flex-wrap items-center gap-4 text-sm text-[var(--fg-subtle)]`}
                  >
                    {task.project && (
                      <div className="flex items-center gap-1">
                        <TaskIcon fontSize="small" />
                        <span>{task.project}</span>
                      </div>
                    )}

                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon fontSize="small" />
                        <span>Due {formatDate(task.dueDate)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <span>Created {formatDate(task.createdAt)}</span>
                    </div>

                    {task.workingFor && (
                      <div className="flex items-center gap-1">
                        <span>👤 For: {task.workingFor}</span>
                      </div>
                    )}

                    {task.workingWith && (
                      <div className="flex items-center gap-1">
                        <span>🤝 With: {task.workingWith}</span>
                      </div>
                    )}

                    {task.estimatedTime && (
                      <div className="flex items-center gap-1">
                        <span>Est {task.estimatedTime}{/^\d+$/.test(String(task.estimatedTime)) ? "m" : ""}</span>
                      </div>
                    )}

                    {task.status !== "archived" && (
                      <TimerControl task={task} compact />
                    )}

                    {task.documents && task.documents.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span>
                          📎 {task.documents.length} attachment
                          {task.documents.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded-full text-xs ${
                            darkMode
                              ? "bg-blue-900/50 text-blue-300"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Checkpoints */}
                  {task.checkpoints && task.checkpoints.length > 0 && (
                    <div
                      className={`mt-4 p-3 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700/50 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          ✅ Checkpoints
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            darkMode
                              ? "bg-gray-600 text-gray-300"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {task.checkpoints.filter((cp) => cp.completed).length}
                          /{task.checkpoints.length}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {task.checkpoints.slice(0, 3).map((checkpoint) => (
                          <div
                            key={checkpoint.id}
                            className="flex items-center gap-2"
                          >
                            <button
                              onClick={() =>
                                toggleCheckpoint(task.id, checkpoint.id)
                              }
                              className={`flex-shrink-0 transition-colors ${
                                checkpoint.completed
                                  ? darkMode
                                    ? "text-green-400"
                                    : "text-green-600"
                                  : darkMode
                                    ? "text-gray-500"
                                    : "text-gray-400"
                              }`}
                            >
                              {checkpoint.completed ? (
                                <CheckBoxIcon fontSize="small" />
                              ) : (
                                <CheckBoxOutlineBlankIcon fontSize="small" />
                              )}
                            </button>
                            <span
                              className={`text-sm ${
                                checkpoint.completed
                                  ? `line-through text-[var(--fg-subtle)]`
                                  : darkMode
                                    ? "text-gray-300"
                                    : "text-gray-700"
                              }`}
                            >
                              {checkpoint.text}
                            </span>
                          </div>
                        ))}
                        {task.checkpoints.length > 3 && (
                          <div
                            className={`text-xs text-[var(--fg-subtle)] ml-6`}
                          >
                            +{task.checkpoints.length - 3} more checkpoints
                          </div>
                        )}
                      </div>
                      {/* Progress Bar */}
                      <div
                        className={`mt-2 h-1.5 rounded-full overflow-hidden ${
                          darkMode ? "bg-gray-600" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                          style={{
                            width: `${(task.checkpoints.filter((cp) => cp.completed).length / task.checkpoints.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Task Metadata */}
                  <div
                    className={`mt-3 pt-3 border-t ${
                      darkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`flex flex-wrap items-center gap-4 text-xs ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      <span>
                        ID:{" "}
                        {task.id.split("-")[1]
                          ? task.id.split("-")[1].substring(0, 8)
                          : task.id.substring(0, 8)}
                      </span>

                      {task.updatedAt && (
                        <span>Updated: {formatDate(task.updatedAt)}</span>
                      )}

                      {task.checkpoints && task.checkpoints.length > 0 && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            task.checkpoints.filter((cp) => cp.completed)
                              .length === task.checkpoints.length
                              ? darkMode
                                ? "bg-green-900/50 text-green-300"
                                : "bg-green-100 text-green-700"
                              : darkMode
                                ? "bg-yellow-900/50 text-yellow-300"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {Math.round(
                            (task.checkpoints.filter((cp) => cp.completed)
                              .length /
                              task.checkpoints.length) *
                              100,
                          )}
                          % Complete
                        </span>
                      )}

                      {task.status === "completed" && task.completedAt && (
                        <span
                          className={`px-2 py-1 rounded-full ${
                            darkMode
                              ? "bg-green-900/50 text-green-300"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          ✅ Completed {formatDate(task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {task.status !== "archived" && (
                    <>
                      <button
                        onClick={() => onEditTask(task)}
                        className={`p-2 transition-colors rounded-lg ${
                          darkMode
                            ? "text-[var(--fg-subtle)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)]"
                            : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        }`}
                        title="Edit Task"
                      >
                        <EditIcon fontSize="small" />
                      </button>

                      <button
                        onClick={() => setDetailTask(task)}
                        className="relative rounded-lg p-2 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--accent)]"
                        title="Notes & history"
                      >
                        <NotesIcon fontSize="small" />
                        {task.comments?.length > 0 && (
                          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        )}
                      </button>

                      {task.status !== "completed" && onFocusTask && (
                        <button
                          onClick={() => onFocusTask(task)}
                          className={`p-2 transition-colors rounded-lg ${
                            darkMode
                              ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
                              : "text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                          }`}
                          title="Focus Mode"
                        >
                          <FocusIcon fontSize="small" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDuplicate(task.id)}
                        className={`p-2 transition-colors rounded-lg ${
                          darkMode
                            ? "text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                            : "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        }`}
                        title="Duplicate Task"
                      >
                        <DuplicateIcon fontSize="small" />
                      </button>

                      <button
                        onClick={() => handleTogglePinned(task.id)}
                        className={`p-2 transition-colors rounded-lg ${
                          task.pinned
                            ? "text-[var(--accent-2)]"
                            : darkMode
                              ? "text-[var(--fg-subtle)] hover:text-[var(--accent-2)] hover:bg-[var(--surface-2)]"
                              : "text-gray-600 hover:text-yellow-500 hover:bg-yellow-50"
                        }`}
                        title={task.pinned ? "Unpin Task" : "Pin Task"}
                      >
                        {task.pinned ? (
                          <StarIcon fontSize="small" />
                        ) : (
                          <StarBorderIcon fontSize="small" />
                        )}
                      </button>

                      {task.status !== "completed" && (
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, "completed")
                          }
                          className={`p-2 transition-colors rounded-lg ${
                            darkMode
                              ? "text-[var(--fg-subtle)] hover:text-[var(--success)] hover:bg-[var(--surface-2)]"
                              : "text-green-600 hover:text-green-700 hover:bg-green-50"
                          }`}
                          title="Mark Complete"
                        >
                          ✓
                        </button>
                      )}

                      <button
                        onClick={() => handleArchive(task.id)}
                        className={`p-2 transition-colors rounded-lg ${
                          darkMode
                            ? "text-[var(--fg-subtle)] hover:text-[var(--accent-2)] hover:bg-[var(--surface-2)]"
                            : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        }`}
                        title="Archive"
                      >
                        <ArchiveIcon fontSize="small" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(task.id)}
                    className={`p-2 transition-colors rounded-lg ${
                      darkMode
                        ? "text-[var(--fg-subtle)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                        : "text-red-600 hover:text-red-700 hover:bg-red-50"
                    }`}
                    title="Delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="premium-card">
          <div
            className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] border rounded-lg"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: darkMode ? "#374151 #111827" : "#D1D5DB #F9FAFB",
            }}
          >
            <table className="data-table w-full min-w-[900px] table-fixed">
              <thead>
                <tr>
                  <th
                    className="w-12"
                  >
                    <button
                      onClick={handleSelectAll}
                      className={`p-1 rounded transition-colors ${
                        selectedTasks.length === filteredTasks.length &&
                        filteredTasks.length > 0
                          ? "text-blue-500"
                          : darkMode
                            ? "text-gray-400 hover:text-gray-200"
                            : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {selectedTasks.length === filteredTasks.length &&
                      filteredTasks.length > 0 ? (
                        <CheckBoxIcon fontSize="small" />
                      ) : (
                        <CheckBoxOutlineBlankIcon fontSize="small" />
                      )}
                    </button>
                  </th>
                  <SortHeader label="Task" sortKey="title" sort={sort} onSort={toggleSort} className="w-64" />
                  <SortHeader label="Project" sortKey="project" sort={sort} onSort={toggleSort} className="w-32" />
                  <SortHeader label="Priority" sortKey="priority" sort={sort} onSort={toggleSort} className="w-24" />
                  <SortHeader label="Status" sortKey="status" sort={sort} onSort={toggleSort} className="w-28" />
                  <SortHeader label="Time" sortKey="time" sort={sort} onSort={toggleSort} className="w-28" />
                  {/* <th className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-32 border-r ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    Working For
                  </th> */}
                  {/* <th className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-32 border-r ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    Working With
                  </th> */}
                  <SortHeader label="Due date" sortKey="dueDate" sort={sort} onSort={toggleSort} className="w-28" />
                  {/* <th className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-48 border-r ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    Checkpoints
                  </th> */}
                  <th
                    className={`text-right px-4 py-3 text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider w-[132px]`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`bg-[var(--surface)] divide-gray-700 divide-y`}
              >
                {pagedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={` border-b border-[var(--border)] ${task.colorLabel ? `border-l-4 ${COLOR_LABELS[task.colorLabel]?.split(" ")[0] || ""}` : ""} ${selectedTasks.includes(task.id) ? (darkMode ? "bg-blue-900/20" : "bg-blue-50") : ""}`}
                  >
                    <td
                      className={`px-4 py-4 w-12`}
                    >
                      <button
                        onClick={() => handleSelectTask(task.id)}
                        className={`p-1 rounded transition-colors ${
                          selectedTasks.includes(task.id)
                            ? "text-blue-500"
                            : darkMode
                              ? "text-gray-500 hover:text-gray-300"
                              : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {selectedTasks.includes(task.id) ? (
                          <CheckBoxIcon fontSize="small" />
                        ) : (
                          <CheckBoxOutlineBlankIcon fontSize="small" />
                        )}
                      </button>
                    </td>
                    <td
                      className={`px-4 py-4 w-64`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {task.pinned && (
                            <StarIcon
                              className="text-yellow-500"
                              style={{ fontSize: 16 }}
                            />
                          )}
                          <div
                            className={`text-sm font-medium text-[var(--fg)] truncate`}
                          >
                            {task.title}
                          </div>
                          {task.recurrence && (
                            <span
                              className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--fg-subtle)]"
                              title={`Repeats ${task.recurrence}`}
                            >
                              <RepeatIcon sx={{ fontSize: 11 }} />
                              {task.recurrence === "weekdays" ? "weekdays" : task.recurrence}
                            </span>
                          )}
                          {task.documents?.length > 0 && (
                            <span
                              className="flex flex-shrink-0 items-center gap-0.5 font-mono text-[11px] tabular-nums text-[var(--fg-subtle)]"
                              title={`${task.documents.length} attachment${task.documents.length > 1 ? "s" : ""}`}
                            >
                              <AttachmentIcon sx={{ fontSize: 13 }} />
                              {task.documents.length}
                            </span>
                          )}
                          {/* Due date alerts */}
                          {task.status !== "completed" &&
                            task.dueDate &&
                            isOverdue(task.dueDate) && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                Overdue
                              </span>
                            )}
                          {task.status !== "completed" &&
                            task.dueDate &&
                            !isOverdue(task.dueDate) &&
                            isDueSoon(task.dueDate) && (
                              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                Due Soon
                              </span>
                            )}
                        </div>
                        {task.description && (
                          <div
                            className={`text-sm text-[var(--fg-subtle)] truncate`}
                          >
                            {task.description}
                          </div>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 max-w-full">
                            {task.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className={`px-1.5 py-0.5 rounded text-xs ${
                                  darkMode
                                    ? "bg-blue-900/50 text-blue-300"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 2 && (
                              <span
                                className={`text-xs text-[var(--fg-subtle)]`}
                              >
                                +{task.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td
                      className={`px-4 py-4 text-sm text-[var(--fg)] w-32 truncate`}
                    >
                      {task.project || "-"}
                    </td>
                    <td
                      className={`px-4 py-4 w-24`}
                    >
                      <PriorityPill priority={task.priority || "medium"} />
                    </td>
                    <td
                      className={`px-4 py-4 w-28`}
                    >
                      <StatusPill status={task.status || "todo"} />
                    </td>
                    <td className="px-4 py-4 w-28 whitespace-nowrap">
                      {task.status === "archived" ? (
                        <span className="text-[var(--fg-subtle)]">-</span>
                      ) : (
                        <TimerControl task={task} compact />
                      )}
                    </td>
                    {/* <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'} w-32 truncate border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {task.workingFor || '-'}
                    </td> */}
                    {/* <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'} w-32 truncate border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {task.workingWith || '-'}
                    </td> */}
                    <td
                      className={`px-4 py-4 text-sm text-[var(--fg)] w-28 whitespace-nowrap`}
                    >
                      {task.dueDate ? formatDate(task.dueDate) : "-"}
                    </td>
                    {/* <td className={`px-4 py-4 w-48 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {task.checkpoints && task.checkpoints.length > 0 ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="flex flex-col space-y-1 min-w-0 flex-1">
                            {task.checkpoints.slice(0, 2).map((checkpoint) => (
                              <div key={checkpoint.id} className="flex items-center gap-1 min-w-0">
                                <button
                                  onClick={() => toggleCheckpoint(task.id, checkpoint.id)}
                                  className={`flex-shrink-0 transition-colors ${
                                    checkpoint.completed
                                      ? darkMode ? 'text-green-400' : 'text-green-600'
                                      : darkMode ? 'text-gray-500' : 'text-gray-400'
                                  }`}
                                >
                                  {checkpoint.completed ? (
                                    <CheckBoxIcon sx={{ fontSize: 16 }} />
                                  ) : (
                                    <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />
                                  )}
                                </button>
                                <span className={`text-xs truncate ${
                                  checkpoint.completed 
                                    ? `line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}` 
                                    : darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`} title={checkpoint.text}>
                                  {checkpoint.text}
                                </span>
                              </div>
                            ))}
                            {task.checkpoints.length > 2 && (
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-5`}>
                                +{task.checkpoints.length - 2} more
                              </div>
                            )}
                          </div>
                          <div className={`flex-shrink-0 ml-2 px-2 py-1 rounded text-xs font-medium ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {task.checkpoints.filter(cp => cp.completed).length}/{task.checkpoints.length}
                          </div>
                        </div>
                      ) : (
                        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                      )}
                    </td> */}
                    <td className="px-4 py-4 text-right w-[132px]">
                      <div className="flex flex-nowrap items-center justify-end gap-0.5">
                        {task.status !== "archived" && (
                          <>
                            <button
                              onClick={() => onEditTask(task)}
                              className={`p-1 rounded transition-colors ${
                                darkMode
                                  ? "text-[var(--fg-subtle)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)]"
                                  : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              }`}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </button>
                            <button
                              onClick={() => setDetailTask(task)}
                              className="relative rounded p-1 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--accent)]"
                              title="Notes & history"
                            >
                              <NotesIcon fontSize="small" />
                              {task.comments?.length > 0 && (
                                <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                              )}
                            </button>
                            {task.status !== "completed" && (
                              <button
                                onClick={() => handleStatusChange(task.id, "completed")}
                                className="rounded p-1 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--success-soft)] hover:text-[var(--success)]"
                                title="Mark complete"
                              >
                                <CompleteIcon fontSize="small" />
                              </button>
                            )}
                          </>
                        )}

                        {/* Everything past the three primary actions lives in the
                            menu, where it is labelled instead of guessed at. */}
                        <OverflowMenu
                          items={[
                            {
                              label: task.pinned ? "Unpin" : "Pin to top",
                              icon: task.pinned ? StarIcon : StarBorderIcon,
                              onClick: () => handleTogglePinned(task.id),
                              hidden: task.status === "archived",
                            },
                            {
                              label: "Focus mode",
                              icon: FocusIcon,
                              onClick: () => onFocusTask?.(task),
                              hidden: task.status === "archived" || task.status === "completed" || !onFocusTask,
                            },
                            {
                              label: "Duplicate",
                              icon: DuplicateIcon,
                              onClick: () => handleDuplicate(task.id),
                              hidden: task.status === "archived",
                            },
                            {
                              label: "Archive",
                              icon: ArchiveIcon,
                              onClick: () => handleArchive(task.id),
                              hidden: task.status === "archived",
                            },
                            {
                              label: "Delete",
                              icon: DeleteIcon,
                              onClick: () => handleDelete(task.id),
                              danger: true,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pager — only when there is more than one page to walk. */}
          {pageSize !== "all" && filteredTasks.length > pageSize && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-2.5">
              <span className="font-mono text-[11px] tabular-nums text-[var(--fg-subtle)]">
                {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filteredTasks.length)} of{" "}
                {filteredTasks.length}
              </span>

              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value === "all" ? "all" : Number(e.target.value));
                    setPage(1);
                  }}
                  aria-label="Rows per page"
                  className="h-7 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-2)] px-2 text-[12px] text-[var(--fg-muted)] focus:border-[var(--accent)] focus:outline-none"
                >
                  {[25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} per page
                    </option>
                  ))}
                  <option value="all">Show all</option>
                </select>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeftIcon sx={{ fontSize: 18 }} />
                  </button>
                  <span className="px-1.5 font-mono text-[11px] tabular-nums text-[var(--fg-muted)]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    aria-label="Next page"
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRightIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <CommentDrawer
        open={!!detailTask}
        task={detailTask ? tasks.find((t) => t.id === detailTask.id) || detailTask : null}
        onClose={() => setDetailTask(null)}
      />
    </div>
  );
}
