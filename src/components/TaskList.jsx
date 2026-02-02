"use client";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateTask,
  deleteTask,
  duplicateTask,
  togglePinned,
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
} from "@mui/icons-material";

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

export default function TaskList({
  activePage,
  filter,
  onEditTask,
  onContextMenu,
  onTaskHover,
  onTaskLeave,
  darkMode,
}) {
  const dispatch = useDispatch();
  const { tasks, projects } = useSelector((state) => state.tasks);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // 'card' or 'table'
  const [hoveredTask, setHoveredTask] = useState(null);

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

    // Sort: pinned first, then by creation date
    return filteredTasks.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const filteredTasks = getFilteredTasks();

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

  const handleDelete = (taskId) => {
    if (confirm("Are you sure you want to delete this task?")) {
      dispatch(deleteTask(taskId));
    }
  };

  const handleDuplicate = (taskId) => {
    dispatch(duplicateTask(taskId));
  };

  const handleTogglePinned = (taskId) => {
    dispatch(togglePinned(taskId));
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

  return (
    <div className="space-y-6">
      {/* Tasks Header with View Toggle */}
      <div
        className={`flex justify-between items-center ${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-4 shadow-sm`}
      >
        <div>
          <h2
            className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            {activePage === "archived" ? "Archived Tasks" : "Tasks"}
          </h2>
          <p
            className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-500"} mt-1`}
          >
            {filteredTasks.length}{" "}
            {filteredTasks.length === 1 ? "task" : "tasks"} found
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div
          className={`flex items-center gap-2 ${darkMode ? "bg-gray-700" : "bg-gray-100"} rounded-lg p-1`}
        >
          <button
            onClick={() => setViewMode("card")}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === "card"
                ? `${darkMode ? "bg-gray-600 text-blue-400" : "bg-white text-blue-600"} shadow-sm`
                : `${darkMode ? "text-gray-300 hover:text-white hover:bg-gray-600/50" : "text-gray-600 hover:text-gray-800 hover:bg-white/50"}`
            }`}
            title="Card View"
          >
            <CardViewIcon fontSize="small" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === "table"
                ? `${darkMode ? "bg-gray-600 text-blue-400" : "bg-white text-blue-600"} shadow-sm`
                : `${darkMode ? "text-gray-300 hover:text-white hover:bg-gray-600/50" : "text-gray-600 hover:text-gray-800 hover:bg-white/50"}`
            }`}
            title="Table View"
          >
            <TableViewIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Tasks Content */}
      {filteredTasks.length === 0 ? (
        /* Empty State */
        <div
          className={`text-center py-12 ${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg`}
        >
          <TaskIcon
            className={`mx-auto ${darkMode ? "text-gray-500" : "text-gray-400"} mb-4`}
            style={{ fontSize: 64 }}
          />
          <h3
            className={`text-lg font-medium ${darkMode ? "text-gray-200" : "text-gray-600"} mb-2`}
          >
            No tasks found
          </h3>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} mb-6`}>
            {activePage === "archived"
              ? "No archived tasks to display"
              : "Create your first task to get started"}
          </p>
          {activePage !== "archived" && (
            <button
              onClick={() => (window.location.href = "#create-task")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Task
            </button>
          )}
        </div>
      ) : viewMode === "card" ? (
        /* Card View */
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`premium-card hover:shadow-lg transition-all duration-200 relative ${
                task.colorLabel ? "border-l-4" : ""
              }`}
              style={{
                borderLeftColor: task.colorLabel
                  ? COLOR_LABELS[task.colorLabel]
                  : "transparent",
              }}
              onContextMenu={(e) => onContextMenu && onContextMenu(e, task)}
              onMouseEnter={() => setHoveredTask(task.id)}
              onMouseLeave={() => setHoveredTask(null)}
            >
              {/* Alert indicators */}
              {(isOverdue(task) || isDueSoon(task)) && (
                <div
                  className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${
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

              <div className="flex items-start justify-between gap-4">
                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3
                      className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"} truncate`}
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
                      className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} mb-3 line-clamp-2`}
                    >
                      {task.description}
                    </p>
                  )}

                  <div
                    className={`flex flex-wrap items-center gap-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
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
                        <span>⏱️ Est: {task.estimatedTime}h</span>
                      </div>
                    )}

                    {task.timeElapsed > 0 && (
                      <div className="flex items-center gap-1">
                        <span>
                          ⏲️ Elapsed: {Math.round(task.timeElapsed / 60)}m
                        </span>
                      </div>
                    )}

                    {task.timeTracking?.isRunning && (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Running</span>
                        </span>
                      </div>
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
                                  ? `line-through ${darkMode ? "text-gray-400" : "text-gray-500"}`
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
                            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} ml-6`}
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
                            ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        }`}
                        title="Edit Task"
                      >
                        <EditIcon fontSize="small" />
                      </button>

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
                            ? "text-yellow-500 hover:text-yellow-400"
                            : darkMode
                              ? "text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/20"
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
                              ? "text-green-400 hover:text-green-300 hover:bg-green-900/20"
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
                            ? "text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
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
                        ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
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
            <table className="w-full table-fixed min-w-[1300px] border-collapse">
              <thead
                className={`${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"} border-b sticky top-0 z-20`}
              >
                <tr>
                  <th
                    className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider w-64 border-r ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                  >
                    Task
                  </th>
                  <th
                    className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider w-32 border-r ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                  >
                    Project
                  </th>
                  <th
                    className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider w-24 border-r ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                  >
                    Priority
                  </th>
                  <th
                    className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider w-28 border-r ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                  >
                    Status
                  </th>
                  {/* <th className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-32 border-r ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    Working For
                  </th> */}
                  {/* <th className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-32 border-r ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    Working With
                  </th> */}
                  <th
                    className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider w-24 border-r ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                  >
                    Due Date
                  </th>
                  {/* <th className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-48 border-r ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    Checkpoints
                  </th> */}
                  <th
                    className={`text-left px-4 py-3 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider w-24 border-r ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                  >
                    Documents
                  </th>
                  <th
                    className={`text-right px-4 py-3 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider w-32`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`${darkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}
              >
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} border-b ${darkMode ? "border-gray-700" : "border-gray-200"} ${task.colorLabel ? `border-l-4 ${COLOR_LABELS[task.colorLabel]?.split(" ")[0] || ""}` : ""}`}
                  >
                    <td
                      className={`px-4 py-4 w-64 border-r ${darkMode ? "border-gray-700" : "border-gray-200"}`}
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
                            className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"} truncate`}
                          >
                            {task.title}
                          </div>
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
                            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} truncate`}
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
                                className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                              >
                                +{task.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td
                      className={`px-4 py-4 text-sm ${darkMode ? "text-gray-300" : "text-gray-900"} w-32 truncate border-r ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                    >
                      {task.project || "-"}
                    </td>
                    <td
                      className={`px-4 py-4 w-24 border-r ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)} whitespace-nowrap`}
                      >
                        {task.priority || "medium"}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-4 w-28 border-r ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)} whitespace-nowrap`}
                      >
                        {task.status || "todo"}
                      </span>
                    </td>
                    {/* <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'} w-32 truncate border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {task.workingFor || '-'}
                    </td> */}
                    {/* <td className={`px-4 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'} w-32 truncate border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {task.workingWith || '-'}
                    </td> */}
                    <td
                      className={`px-4 py-4 text-sm ${darkMode ? "text-gray-300" : "text-gray-900"} w-24 whitespace-nowrap border-r ${darkMode ? "border-gray-700" : "border-gray-200"}`}
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
                    <td
                      className={`px-4 py-4 w-24 border-r ${darkMode ? "border-gray-700" : "border-gray-200"} text-center`}
                    >
                      {task.documents && task.documents.length > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg">📎</span>
                          <span
                            className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            {task.documents.length}
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                        >
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right w-32">
                      <div className="flex justify-end gap-1">
                        {task.status !== "archived" && (
                          <>
                            <button
                              onClick={() => onEditTask(task)}
                              className={`p-1 rounded transition-colors ${
                                darkMode
                                  ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                  : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              }`}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(task.id)}
                              className={`p-1 rounded transition-colors ${
                                darkMode
                                  ? "text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                                  : "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              }`}
                              title="Duplicate"
                            >
                              <DuplicateIcon fontSize="small" />
                            </button>
                            <button
                              onClick={() => handleTogglePinned(task.id)}
                              className={`p-1 rounded transition-colors ${
                                task.pinned
                                  ? "text-yellow-500 hover:text-yellow-400"
                                  : darkMode
                                    ? "text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/20"
                                    : "text-gray-600 hover:text-yellow-500 hover:bg-yellow-50"
                              }`}
                              title={task.pinned ? "Unpin" : "Pin"}
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
                                className={`p-1 rounded transition-colors ${
                                  darkMode
                                    ? "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                    : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                }`}
                                title="Complete"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={() => handleArchive(task.id)}
                              className={`p-1 rounded transition-colors ${
                                darkMode
                                  ? "text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
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
                          className={`p-1 rounded transition-colors ${
                            darkMode
                              ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              : "text-red-600 hover:text-red-700 hover:bg-red-50"
                          }`}
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
