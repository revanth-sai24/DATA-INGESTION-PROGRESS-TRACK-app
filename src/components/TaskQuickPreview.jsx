"use client";
import React, { useState } from "react";
import {
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Folder as FolderIcon,
  Label as TagIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

export default function TaskQuickPreview({
  task,
  position,
  darkMode,
  onClose,
}) {
  if (!task) return null;

  const { x, y } = position;

  // Check if task is overdue
  const isOverdue = () => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && task.status !== "completed";
  };

  // Check if task is due soon (within 3 days)
  const isDueSoon = () => {
    if (!task.dueDate || isOverdue()) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const threeDaysFromNow = new Date(
      today.getTime() + 3 * 24 * 60 * 60 * 1000,
    );
    return dueDate <= threeDaysFromNow && task.status !== "completed";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return { text: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" };
      case "medium":
        return {
          text: "text-yellow-500",
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
        };
      case "low":
        return {
          text: "text-green-500",
          bg: "bg-green-100 dark:bg-green-900/30",
        };
      default:
        return { text: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-700" };
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          text: "text-green-600",
          bg: "bg-green-100 dark:bg-green-900/30",
        };
      case "in-progress":
        return { text: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" };
      case "todo":
        return { text: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-700" };
      case "on-hold":
        return {
          text: "text-orange-600",
          bg: "bg-orange-100 dark:bg-orange-900/30",
        };
      default:
        return { text: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-700" };
    }
  };

  const priorityColors = getPriorityColor(task.priority);
  const statusColors = getStatusColor(task.status);
  const checkpointProgress =
    task.checkpoints?.length > 0
      ? Math.round(
          (task.checkpoints.filter((cp) => cp.completed).length /
            task.checkpoints.length) *
            100,
        )
      : null;

  return (
    <div
      className={`fixed z-50 w-80 rounded-xl shadow-2xl border overflow-hidden animate-fade-in ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
      style={{
        left: Math.min(x, window.innerWidth - 340),
        top: Math.min(y + 10, window.innerHeight - 400),
      }}
    >
      {/* Color Label Bar */}
      {task.colorLabel && (
        <div
          className="h-1.5"
          style={{
            backgroundColor: {
              red: "#EF4444",
              orange: "#F97316",
              yellow: "#EAB308",
              green: "#22C55E",
              blue: "#3B82F6",
              purple: "#A855F7",
              pink: "#EC4899",
              cyan: "#06B6D4",
            }[task.colorLabel],
          }}
        />
      )}

      {/* Header */}
      <div
        className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {task.pinned && (
              <StarIcon
                className="text-yellow-500 flex-shrink-0"
                fontSize="small"
              />
            )}
            <h3
              className={`font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg flex-shrink-0 transition-colors ${
              darkMode
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Status and Priority Badges */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
          >
            {task.status}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${priorityColors.bg} ${priorityColors.text}`}
          >
            <FlagIcon fontSize="inherit" /> {task.priority}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        {task.description && (
          <div>
            <p
              className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} line-clamp-3`}
            >
              {task.description}
            </p>
          </div>
        )}

        {/* Due Date with Alert */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-2 text-sm ${
              isOverdue()
                ? "text-red-500"
                : isDueSoon()
                  ? "text-yellow-500"
                  : darkMode
                    ? "text-gray-400"
                    : "text-gray-500"
            }`}
          >
            {isOverdue() && <WarningIcon fontSize="small" />}
            <ScheduleIcon fontSize="small" />
            <span className={isOverdue() ? "font-medium" : ""}>
              {isOverdue() ? "Overdue: " : isDueSoon() ? "Due soon: " : "Due: "}
              {formatDate(task.dueDate)}
            </span>
          </div>
        )}

        {/* Project */}
        {task.project && (
          <div
            className={`flex items-center gap-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            <FolderIcon fontSize="small" />
            <span>{task.project}</span>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-0.5 rounded-full text-xs ${
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

        {/* Checkpoints Progress */}
        {checkpointProgress !== null && (
          <div>
            <div
              className={`flex items-center justify-between text-xs mb-1 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <span>Checkpoints</span>
              <span>
                {task.checkpoints.filter((cp) => cp.completed).length}/
                {task.checkpoints.length} ({checkpointProgress}%)
              </span>
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            >
              <div
                className={`h-full transition-all duration-300 ${
                  checkpointProgress === 100
                    ? "bg-green-500"
                    : checkpointProgress > 50
                      ? "bg-blue-500"
                      : "bg-yellow-500"
                }`}
                style={{ width: `${checkpointProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Metadata Footer */}
        <div
          className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <div
            className={`flex items-center justify-between text-xs ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <span>Created {formatDate(task.createdAt)}</span>
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <span>Updated {formatDate(task.updatedAt)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
