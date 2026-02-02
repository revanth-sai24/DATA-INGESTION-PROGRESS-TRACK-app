"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateTask } from "../redux/slices/taskSlice";
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

export default function FavoritesTasks({ darkMode, onEditTask }) {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);

  // Get pinned/favorite tasks
  const pinnedTasks = tasks.filter(
    (task) => task.pinned && task.status !== "archived",
  );

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

  const handleUnpin = (task) => {
    dispatch(
      updateTask({
        ...task,
        pinned: false,
        updatedAt: new Date().toISOString(),
      }),
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return darkMode
          ? "bg-green-900/50 text-green-300"
          : "bg-green-100 text-green-700";
      case "in-progress":
        return darkMode
          ? "bg-blue-900/50 text-blue-300"
          : "bg-blue-100 text-blue-700";
      case "todo":
        return darkMode
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-100 text-gray-700";
      case "on-hold":
        return darkMode
          ? "bg-orange-900/50 text-orange-300"
          : "bg-orange-100 text-orange-700";
      default:
        return darkMode
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-100 text-gray-700";
    }
  };

  if (pinnedTasks.length === 0) {
    return null; // Don't render if no pinned tasks
  }

  return (
    <div
      className={`mb-6 p-4 rounded-xl ${darkMode ? "bg-gray-800/50" : "bg-yellow-50"} border ${darkMode ? "border-gray-700" : "border-yellow-200"}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <StarIcon className="text-yellow-500" />
        <h3
          className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
        >
          Pinned Tasks
        </h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${darkMode ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-200 text-yellow-800"}`}
        >
          {pinnedTasks.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pinnedTasks.map((task) => (
          <div
            key={task.id}
            className={`relative p-4 rounded-lg border ${
              darkMode
                ? "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
                : "bg-white border-gray-200 hover:shadow-md"
            } transition-all duration-200`}
            style={{
              borderLeftWidth: "4px",
              borderLeftColor: task.colorLabel
                ? {
                    red: "#EF4444",
                    orange: "#F97316",
                    yellow: "#EAB308",
                    green: "#22C55E",
                    blue: "#3B82F6",
                    purple: "#A855F7",
                    pink: "#EC4899",
                    cyan: "#06B6D4",
                  }[task.colorLabel]
                : "transparent",
            }}
          >
            {/* Alert indicator */}
            {(isOverdue(task) || isDueSoon(task)) && (
              <div
                className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${
                  isOverdue(task) ? "bg-red-500 animate-pulse" : "bg-yellow-500"
                }`}
              />
            )}

            {/* Unpin button */}
            <button
              onClick={() => handleUnpin(task)}
              className="absolute top-2 right-2 text-yellow-500 hover:text-yellow-400 transition-colors"
              title="Unpin"
            >
              <StarIcon fontSize="small" />
            </button>

            {/* Task content */}
            <h4
              className={`font-medium text-sm mb-2 pr-8 ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              {task.title}
            </h4>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status */}
              <span
                className={`px-2 py-1 rounded-full ${getStatusColor(task.status)}`}
              >
                {task.status}
              </span>

              {/* Priority */}
              <span
                className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}
              >
                <FlagIcon fontSize="inherit" />
                {task.priority}
              </span>

              {/* Due Date */}
              {task.dueDate && (
                <span
                  className={`flex items-center gap-1 ${
                    isOverdue(task)
                      ? "text-red-500 font-medium"
                      : isDueSoon(task)
                        ? "text-yellow-500"
                        : darkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                  }`}
                >
                  {isOverdue(task) && <WarningIcon fontSize="inherit" />}
                  <ScheduleIcon fontSize="inherit" />
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>

            {/* Edit button */}
            <button
              onClick={() => onEditTask(task)}
              className={`mt-3 w-full py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 ${
                darkMode
                  ? "bg-gray-600 hover:bg-gray-500 text-gray-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <EditIcon fontSize="inherit" /> Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
