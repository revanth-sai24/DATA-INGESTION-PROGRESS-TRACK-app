"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Notifications as NotificationIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

export default function NotificationCenter({ darkMode }) {
  const { tasks } = useSelector((state) => state.tasks);
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setHasPermission(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          setHasPermission(permission === "granted");
        });
      }
    }
  }, []);

  // Check for overdue and due soon tasks
  const checkDueDates = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    const newNotifications = [];

    tasks.forEach((task) => {
      if (
        !task.dueDate ||
        task.status === "completed" ||
        task.status === "archived"
      )
        return;

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        // Overdue
        newNotifications.push({
          id: `overdue-${task.id}`,
          type: "overdue",
          title: "Task Overdue!",
          message: `"${task.title}" was due on ${formatDate(task.dueDate)}`,
          taskId: task.id,
          priority: "high",
          timestamp: new Date().toISOString(),
        });
      } else if (dueDate.getTime() === today.getTime()) {
        // Due today
        newNotifications.push({
          id: `today-${task.id}`,
          type: "today",
          title: "Due Today",
          message: `"${task.title}" is due today!`,
          taskId: task.id,
          priority: "high",
          timestamp: new Date().toISOString(),
        });
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        // Due tomorrow
        newNotifications.push({
          id: `tomorrow-${task.id}`,
          type: "soon",
          title: "Due Tomorrow",
          message: `"${task.title}" is due tomorrow`,
          taskId: task.id,
          priority: "medium",
          timestamp: new Date().toISOString(),
        });
      } else if (dueDate <= threeDays) {
        // Due within 3 days
        newNotifications.push({
          id: `soon-${task.id}`,
          type: "soon",
          title: "Due Soon",
          message: `"${task.title}" is due on ${formatDate(task.dueDate)}`,
          taskId: task.id,
          priority: "low",
          timestamp: new Date().toISOString(),
        });
      }
    });

    setNotifications(newNotifications);
    return newNotifications;
  }, [tasks]);

  // Check due dates on mount and when tasks change
  useEffect(() => {
    const newNotifications = checkDueDates();

    // Show browser notifications for high priority items
    if (hasPermission && newNotifications.length > 0) {
      const highPriority = newNotifications.filter(
        (n) => n.priority === "high",
      );
      if (highPriority.length > 0) {
        const shown = sessionStorage.getItem("notificationsShown") || "";
        const shownIds = shown.split(",").filter(Boolean);

        highPriority.forEach((notification) => {
          if (!shownIds.includes(notification.id)) {
            showBrowserNotification(notification);
            shownIds.push(notification.id);
          }
        });

        sessionStorage.setItem("notificationsShown", shownIds.join(","));
      }
    }
  }, [checkDueDates, hasPermission]);

  // Daily digest check
  useEffect(() => {
    const checkDailyDigest = () => {
      const lastDigest = localStorage.getItem("lastDailyDigest");
      const today = new Date().toDateString();

      if (lastDigest !== today && tasks.length > 0) {
        const todayTasks = tasks.filter((t) => {
          if (!t.dueDate || t.status === "completed" || t.status === "archived")
            return false;
          const dueDate = new Date(t.dueDate);
          return dueDate.toDateString() === today;
        });

        if (todayTasks.length > 0 && hasPermission) {
          new Notification("Daily Task Digest", {
            body: `You have ${todayTasks.length} task(s) due today!`,
            icon: "/favicon.ico",
            tag: "daily-digest",
          });
          localStorage.setItem("lastDailyDigest", today);
        }
      }
    };

    // Check on mount
    const timeout = setTimeout(checkDailyDigest, 2000);
    return () => clearTimeout(timeout);
  }, [tasks, hasPermission]);

  const showBrowserNotification = (notification) => {
    if (!hasPermission) return;

    new Notification(notification.title, {
      body: notification.message,
      icon: "/favicon.ico",
      tag: notification.id,
      requireInteraction: notification.priority === "high",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "overdue":
        return <WarningIcon className="text-red-500" />;
      case "today":
        return <ScheduleIcon className="text-orange-500" />;
      case "soon":
        return <InfoIcon className="text-yellow-500" />;
      default:
        return <NotificationIcon className="text-blue-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "overdue":
        return darkMode
          ? "bg-red-900/30 border-red-700"
          : "bg-red-50 border-red-200";
      case "today":
        return darkMode
          ? "bg-orange-900/30 border-orange-700"
          : "bg-orange-50 border-orange-200";
      case "soon":
        return darkMode
          ? "bg-yellow-900/30 border-yellow-700"
          : "bg-yellow-50 border-yellow-200";
      default:
        return darkMode
          ? "bg-blue-900/30 border-blue-700"
          : "bg-blue-50 border-blue-200";
    }
  };

  const overdueCount = notifications.filter((n) => n.type === "overdue").length;
  const todayCount = notifications.filter((n) => n.type === "today").length;
  const soonCount = notifications.filter((n) => n.type === "soon").length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`relative p-2 rounded-lg transition-colors ${
          darkMode
            ? "hover:bg-gray-700 text-gray-300"
            : "hover:bg-gray-100 text-gray-600"
        }`}
        title="Notifications"
      >
        <NotificationIcon />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div
          className={`absolute right-0 top-12 w-80 max-h-[500px] overflow-hidden rounded-xl shadow-xl border z-50 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          {/* Header */}
          <div
            className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                Notifications
              </h3>
              <button
                onClick={() => setShowPanel(false)}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <CloseIcon
                  fontSize="small"
                  className={darkMode ? "text-gray-400" : "text-gray-500"}
                />
              </button>
            </div>

            {/* Summary */}
            <div className="flex gap-3 mt-3 text-xs">
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <WarningIcon fontSize="inherit" /> {overdueCount} overdue
                </span>
              )}
              {todayCount > 0 && (
                <span className="flex items-center gap-1 text-orange-500">
                  <ScheduleIcon fontSize="inherit" /> {todayCount} today
                </span>
              )}
              {soonCount > 0 && (
                <span
                  className={`flex items-center gap-1 ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}
                >
                  <InfoIcon fontSize="inherit" /> {soonCount} soon
                </span>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[350px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div
                className={`p-8 text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                <CheckCircleIcon className="mx-auto mb-2" fontSize="large" />
                <p>All caught up!</p>
                <p className="text-sm mt-1">No pending notifications</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} relative group`}
                  >
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-full transition-opacity ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                      }`}
                    >
                      <CloseIcon
                        fontSize="small"
                        className={darkMode ? "text-gray-400" : "text-gray-500"}
                      />
                    </button>

                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`font-medium text-sm ${darkMode ? "text-white" : "text-gray-800"}`}
                        >
                          {notification.title}
                        </h4>
                        <p
                          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} truncate`}
                        >
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!hasPermission && (
            <div
              className={`p-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <button
                onClick={() => {
                  Notification.requestPermission().then((permission) => {
                    setHasPermission(permission === "granted");
                  });
                }}
                className="w-full py-2 px-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enable Browser Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
