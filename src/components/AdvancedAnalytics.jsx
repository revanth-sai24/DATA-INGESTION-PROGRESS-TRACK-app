"use client";
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export default function AdvancedAnalytics({ darkMode }) {
  const tasks = useSelector((state) => state.tasks.tasks);
  const projects = useSelector((state) => state.tasks.projects);
  const [timeRange, setTimeRange] = useState("week"); // week, month, quarter

  // Calculate completion trends over time
  const completionTrends = useMemo(() => {
    const now = new Date();
    const data = [];

    const getDaysBack = () => {
      switch (timeRange) {
        case "week":
          return 7;
        case "month":
          return 30;
        case "quarter":
          return 90;
        default:
          return 7;
      }
    };

    const daysBack = getDaysBack();
    const interval = timeRange === "quarter" ? 7 : 1; // Weekly for quarter, daily otherwise

    for (let i = daysBack; i >= 0; i -= interval) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + interval);

      const completed = tasks.filter((task) => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate >= date && completedDate < endDate;
      }).length;

      const created = tasks.filter((task) => {
        const createdDate = new Date(task.createdAt);
        return createdDate >= date && createdDate < endDate;
      }).length;

      data.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        completed,
        created,
        net: completed - created,
      });
    }

    return data;
  }, [tasks, timeRange]);

  // Weekly productivity stats
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekCompleted = tasks.filter((task) => {
      if (!task.completedAt) return false;
      return new Date(task.completedAt) >= weekStart;
    }).length;

    const lastWeekCompleted = tasks.filter((task) => {
      if (!task.completedAt) return false;
      const date = new Date(task.completedAt);
      return date >= lastWeekStart && date < weekStart;
    }).length;

    const thisWeekCreated = tasks.filter((task) => {
      return new Date(task.createdAt) >= weekStart;
    }).length;

    const change =
      lastWeekCompleted > 0
        ? Math.round(
            ((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100,
          )
        : thisWeekCompleted > 0
          ? 100
          : 0;

    return {
      completed: thisWeekCompleted,
      created: thisWeekCreated,
      change,
      isPositive: change >= 0,
    };
  }, [tasks]);

  // Priority Matrix (Eisenhower Matrix)
  const priorityMatrix = useMemo(() => {
    const activeTasks = tasks.filter(
      (t) => t.status !== "completed" && t.status !== "archived",
    );

    const isUrgent = (task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const threeDaysFromNow = new Date(
        today.getTime() + 3 * 24 * 60 * 60 * 1000,
      );
      return dueDate <= threeDaysFromNow;
    };

    const isImportant = (task) => task.priority === "high";

    return {
      urgentImportant: activeTasks.filter((t) => isUrgent(t) && isImportant(t)),
      urgentNotImportant: activeTasks.filter(
        (t) => isUrgent(t) && !isImportant(t),
      ),
      notUrgentImportant: activeTasks.filter(
        (t) => !isUrgent(t) && isImportant(t),
      ),
      notUrgentNotImportant: activeTasks.filter(
        (t) => !isUrgent(t) && !isImportant(t),
      ),
    };
  }, [tasks]);

  // Workload heatmap data (last 12 weeks)
  const workloadHeatmap = useMemo(() => {
    const weeks = [];
    const now = new Date();

    for (let w = 11; w >= 0; w--) {
      const weekData = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - w * 7 - (6 - d));
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const tasksCompleted = tasks.filter((task) => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate >= date && completedDate < nextDate;
        }).length;

        weekData.push({
          date: date.toLocaleDateString(),
          day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d],
          count: tasksCompleted,
        });
      }
      weeks.push(weekData);
    }

    return weeks;
  }, [tasks]);

  // Status flow data
  const statusFlow = useMemo(() => {
    return [
      {
        name: "To Do",
        value: tasks.filter(
          (t) => t.status === "todo" && t.status !== "archived",
        ).length,
        color: "#6B7280",
      },
      {
        name: "In Progress",
        value: tasks.filter((t) => t.status === "in-progress").length,
        color: "#3B82F6",
      },
      {
        name: "Completed",
        value: tasks.filter((t) => t.status === "completed").length,
        color: "#10B981",
      },
      {
        name: "On Hold",
        value: tasks.filter((t) => t.status === "on-hold").length,
        color: "#F59E0B",
      },
    ];
  }, [tasks]);

  // Overdue analytics
  const overdueStats = useMemo(() => {
    const overdue = tasks.filter((task) => {
      if (
        !task.dueDate ||
        task.status === "completed" ||
        task.status === "archived"
      )
        return false;
      return new Date(task.dueDate) < new Date();
    });

    const byPriority = {
      high: overdue.filter((t) => t.priority === "high").length,
      medium: overdue.filter((t) => t.priority === "medium").length,
      low: overdue.filter((t) => t.priority === "low").length,
    };

    return { total: overdue.length, byPriority, tasks: overdue };
  }, [tasks]);

  const getHeatmapColor = (count) => {
    if (count === 0) return darkMode ? "bg-gray-700" : "bg-gray-200";
    if (count === 1) return "bg-green-300";
    if (count === 2) return "bg-green-400";
    if (count === 3) return "bg-green-500";
    return "bg-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2
          className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
        >
          Advanced Analytics
        </h2>
        <div
          className={`flex gap-1 p-1 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
        >
          {[
            { id: "week", label: "7 Days" },
            { id: "month", label: "30 Days" },
            { id: "quarter", label: "90 Days" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTimeRange(id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === id
                  ? "bg-blue-600 text-white"
                  : darkMode
                    ? "text-gray-300 hover:bg-gray-600"
                    : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Performance Card */}
      <div className={`premium-card`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <SpeedIcon className="text-white" />
            </div>
            <div>
              <h3
                className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                This Week's Performance
              </h3>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Compared to last week
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              weeklyStats.isPositive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {weeklyStats.isPositive ? (
              <TrendingUpIcon fontSize="small" />
            ) : (
              <TrendingDownIcon fontSize="small" />
            )}
            <span className="font-semibold">{weeklyStats.change}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
          >
            <div
              className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              {weeklyStats.completed}
            </div>
            <div
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Tasks Completed
            </div>
          </div>
          <div
            className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
          >
            <div
              className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              {weeklyStats.created}
            </div>
            <div
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Tasks Created
            </div>
          </div>
          <div
            className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
          >
            <div
              className={`text-3xl font-bold ${
                weeklyStats.completed >= weeklyStats.created
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {weeklyStats.completed - weeklyStats.created >= 0 ? "+" : ""}
              {weeklyStats.completed - weeklyStats.created}
            </div>
            <div
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Net Progress
            </div>
          </div>
        </div>
      </div>

      {/* Completion Trends Chart */}
      <div className={`premium-card`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <TrendingUpIcon className="text-white" />
          </div>
          <div>
            <h3
              className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              Completion Trends
            </h3>
            <p
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Tasks completed vs created over time
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={completionTrends}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? "#374151" : "#e5e7eb"}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? "#1F2937" : "white",
                border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                borderRadius: "8px",
                color: darkMode ? "white" : "#374151",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorCompleted)"
              name="Completed"
            />
            <Area
              type="monotone"
              dataKey="created"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorCreated)"
              name="Created"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Priority Matrix (Eisenhower) */}
      <div className={`premium-card`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <AssessmentIcon className="text-white" />
          </div>
          <div>
            <h3
              className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              Priority Matrix
            </h3>
            <p
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Eisenhower decision matrix for active tasks
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Urgent & Important */}
          <div
            className={`p-4 rounded-lg border-2 border-red-500 ${darkMode ? "bg-red-900/20" : "bg-red-50"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-600 font-semibold text-sm">
                DO FIRST
              </span>
              <span
                className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                {priorityMatrix.urgentImportant.length}
              </span>
            </div>
            <div
              className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Urgent & Important
            </div>
            <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
              {priorityMatrix.urgentImportant.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`text-xs truncate ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  • {task.title}
                </div>
              ))}
            </div>
          </div>

          {/* Not Urgent & Important */}
          <div
            className={`p-4 rounded-lg border-2 border-blue-500 ${darkMode ? "bg-blue-900/20" : "bg-blue-50"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-600 font-semibold text-sm">
                SCHEDULE
              </span>
              <span
                className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                {priorityMatrix.notUrgentImportant.length}
              </span>
            </div>
            <div
              className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Important, Not Urgent
            </div>
            <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
              {priorityMatrix.notUrgentImportant.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`text-xs truncate ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  • {task.title}
                </div>
              ))}
            </div>
          </div>

          {/* Urgent & Not Important */}
          <div
            className={`p-4 rounded-lg border-2 border-yellow-500 ${darkMode ? "bg-yellow-900/20" : "bg-yellow-50"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-600 font-semibold text-sm">
                DELEGATE
              </span>
              <span
                className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                {priorityMatrix.urgentNotImportant.length}
              </span>
            </div>
            <div
              className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Urgent, Not Important
            </div>
            <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
              {priorityMatrix.urgentNotImportant.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`text-xs truncate ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  • {task.title}
                </div>
              ))}
            </div>
          </div>

          {/* Not Urgent & Not Important */}
          <div
            className={`p-4 rounded-lg border-2 border-gray-400 ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`font-semibold text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                ELIMINATE
              </span>
              <span
                className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                {priorityMatrix.notUrgentNotImportant.length}
              </span>
            </div>
            <div
              className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Not Urgent, Not Important
            </div>
            <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
              {priorityMatrix.notUrgentNotImportant.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`text-xs truncate ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  • {task.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workload Heatmap */}
      <div className={`premium-card`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <CalendarIcon className="text-white" />
          </div>
          <div>
            <h3
              className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              Activity Heatmap
            </h3>
            <p
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Task completion activity over the last 12 weeks
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <div className="flex flex-col gap-1 text-xs text-gray-500 pr-2">
              <div className="h-4"></div>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="h-4 flex items-center">
                  {day}
                </div>
              ))}
            </div>
            {workloadHeatmap.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                <div
                  className={`text-xs text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                >
                  {weekIndex === 0 ? "W1" : weekIndex === 11 ? "Now" : ""}
                </div>
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-4 h-4 rounded-sm ${getHeatmapColor(day.count)} cursor-pointer transition-transform hover:scale-125`}
                    title={`${day.date}: ${day.count} tasks completed`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 justify-end">
          <span
            className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
          >
            Less
          </span>
          <div
            className={`w-4 h-4 rounded-sm ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
          <div className="w-4 h-4 rounded-sm bg-green-300"></div>
          <div className="w-4 h-4 rounded-sm bg-green-400"></div>
          <div className="w-4 h-4 rounded-sm bg-green-500"></div>
          <div className="w-4 h-4 rounded-sm bg-green-600"></div>
          <span
            className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
          >
            More
          </span>
        </div>
      </div>

      {/* Overdue Tasks Alert */}
      {overdueStats.total > 0 && (
        <div className={`premium-card border-l-4 border-red-500`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <WarningIcon className="text-white" />
            </div>
            <div>
              <h3
                className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                Overdue Tasks Alert
              </h3>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {overdueStats.total} task{overdueStats.total > 1 ? "s" : ""}{" "}
                past due date
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div
              className={`p-3 rounded-lg ${darkMode ? "bg-red-900/30" : "bg-red-50"}`}
            >
              <div className="text-red-500 font-bold text-xl">
                {overdueStats.byPriority.high}
              </div>
              <div
                className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                High Priority
              </div>
            </div>
            <div
              className={`p-3 rounded-lg ${darkMode ? "bg-yellow-900/30" : "bg-yellow-50"}`}
            >
              <div className="text-yellow-500 font-bold text-xl">
                {overdueStats.byPriority.medium}
              </div>
              <div
                className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Medium Priority
              </div>
            </div>
            <div
              className={`p-3 rounded-lg ${darkMode ? "bg-green-900/30" : "bg-green-50"}`}
            >
              <div className="text-green-500 font-bold text-xl">
                {overdueStats.byPriority.low}
              </div>
              <div
                className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Low Priority
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {overdueStats.tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
              >
                <div className="flex items-center gap-2">
                  <FlagIcon
                    className={`text-sm ${
                      task.priority === "high"
                        ? "text-red-500"
                        : task.priority === "medium"
                          ? "text-yellow-500"
                          : "text-green-500"
                    }`}
                    fontSize="small"
                  />
                  <span
                    className={`text-sm truncate max-w-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {task.title}
                  </span>
                </div>
                <span className="text-xs text-red-500 whitespace-nowrap">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Flow */}
      <div className={`premium-card`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <ScheduleIcon className="text-white" />
          </div>
          <div>
            <h3
              className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              Task Status Distribution
            </h3>
            <p
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Current breakdown of all tasks by status
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusFlow}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusFlow.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1F2937" : "white",
                    border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {statusFlow.map((status, index) => (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                ></div>
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {status.name}
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
                >
                  {status.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
