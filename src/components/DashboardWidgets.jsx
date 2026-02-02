"use client";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Flag as FlagIcon,
  Folder as FolderIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  Star as StarIcon,
} from "@mui/icons-material";

// Widget Components
const TotalTasksWidget = ({ darkMode }) => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const total = tasks.filter((t) => t.status !== "archived").length;

  return (
    <div className="text-center">
      <div
        className={`text-4xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}
      >
        {total}
      </div>
      <div
        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        Total Tasks
      </div>
    </div>
  );
};

const CompletedWidget = ({ darkMode }) => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const completed = tasks.filter((t) => t.status === "completed").length;
  const total = tasks.filter((t) => t.status !== "archived").length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="text-center">
      <div className={`text-4xl font-bold mb-2 text-green-500`}>
        {completed}
      </div>
      <div
        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        Completed ({percentage}%)
      </div>
    </div>
  );
};

const OverdueWidget = ({ darkMode }) => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const overdue = tasks.filter((t) => {
    if (!t.dueDate || t.status === "completed" || t.status === "archived")
      return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  return (
    <div className="text-center">
      <div
        className={`text-4xl font-bold mb-2 ${overdue > 0 ? "text-red-500" : "text-green-500"}`}
      >
        {overdue}
      </div>
      <div
        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        Overdue Tasks
      </div>
    </div>
  );
};

const DueTodayWidget = ({ darkMode }) => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const today = new Date().toDateString();
  const dueToday = tasks.filter((t) => {
    if (!t.dueDate || t.status === "completed" || t.status === "archived")
      return false;
    return new Date(t.dueDate).toDateString() === today;
  }).length;

  return (
    <div className="text-center">
      <div
        className={`text-4xl font-bold mb-2 ${dueToday > 0 ? "text-yellow-500" : darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        {dueToday}
      </div>
      <div
        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        Due Today
      </div>
    </div>
  );
};

const HighPriorityWidget = ({ darkMode }) => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const highPriority = tasks.filter(
    (t) =>
      t.priority === "high" &&
      t.status !== "completed" &&
      t.status !== "archived",
  ).length;

  return (
    <div className="text-center">
      <div className={`text-4xl font-bold mb-2 text-red-500`}>
        {highPriority}
      </div>
      <div
        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        High Priority
      </div>
    </div>
  );
};

const InProgressWidget = ({ darkMode }) => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const inProgress = tasks.filter((t) => t.status === "in-progress").length;

  return (
    <div className="text-center">
      <div className={`text-4xl font-bold mb-2 text-blue-500`}>
        {inProgress}
      </div>
      <div
        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        In Progress
      </div>
    </div>
  );
};

const ProjectsWidget = ({ darkMode }) => {
  const projects = useSelector((state) => state.tasks.projects);

  return (
    <div className="text-center">
      <div
        className={`text-4xl font-bold mb-2 ${darkMode ? "text-purple-400" : "text-purple-500"}`}
      >
        {projects.length}
      </div>
      <div
        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        Projects
      </div>
    </div>
  );
};

const PinnedWidget = ({ darkMode }) => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const pinned = tasks.filter(
    (t) => t.pinned && t.status !== "archived",
  ).length;

  return (
    <div className="text-center">
      <div className={`text-4xl font-bold mb-2 text-yellow-500`}>{pinned}</div>
      <div
        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        Pinned Tasks
      </div>
    </div>
  );
};

const RecentTasksWidget = ({ darkMode }) => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const recent = tasks
    .filter((t) => t.status !== "archived")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  return (
    <div className="space-y-2">
      {recent.length > 0 ? (
        recent.map((task) => (
          <div
            key={task.id}
            className={`p-2 rounded-lg text-sm truncate ${
              darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {task.title}
          </div>
        ))
      ) : (
        <div
          className={`text-center text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}
        >
          No recent tasks
        </div>
      )}
    </div>
  );
};

const WeeklyProgressWidget = ({ darkMode }) => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const completedThisWeek = tasks.filter((t) => {
    if (!t.completedAt) return false;
    return new Date(t.completedAt) >= weekStart;
  }).length;

  const createdThisWeek = tasks.filter((t) => {
    return new Date(t.createdAt) >= weekStart;
  }).length;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Completed
        </span>
        <span className={`font-bold text-green-500`}>{completedThisWeek}</span>
      </div>
      <div className="flex justify-between items-center">
        <span
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Created
        </span>
        <span
          className={`font-bold ${darkMode ? "text-blue-400" : "text-blue-500"}`}
        >
          {createdThisWeek}
        </span>
      </div>
    </div>
  );
};

// Widget definitions
const AVAILABLE_WIDGETS = [
  {
    id: "total",
    name: "Total Tasks",
    icon: TaskIcon,
    component: TotalTasksWidget,
    size: "small",
  },
  {
    id: "completed",
    name: "Completed",
    icon: CompletedIcon,
    component: CompletedWidget,
    size: "small",
  },
  {
    id: "overdue",
    name: "Overdue",
    icon: ScheduleIcon,
    component: OverdueWidget,
    size: "small",
  },
  {
    id: "dueToday",
    name: "Due Today",
    icon: CalendarIcon,
    component: DueTodayWidget,
    size: "small",
  },
  {
    id: "highPriority",
    name: "High Priority",
    icon: FlagIcon,
    component: HighPriorityWidget,
    size: "small",
  },
  {
    id: "inProgress",
    name: "In Progress",
    icon: TrendingIcon,
    component: InProgressWidget,
    size: "small",
  },
  {
    id: "projects",
    name: "Projects",
    icon: FolderIcon,
    component: ProjectsWidget,
    size: "small",
  },
  {
    id: "pinned",
    name: "Pinned",
    icon: StarIcon,
    component: PinnedWidget,
    size: "small",
  },
  {
    id: "recent",
    name: "Recent Tasks",
    icon: TimerIcon,
    component: RecentTasksWidget,
    size: "medium",
  },
  {
    id: "weekly",
    name: "Weekly Progress",
    icon: TrendingIcon,
    component: WeeklyProgressWidget,
    size: "medium",
  },
];

export default function DashboardWidgets({ darkMode }) {
  const [activeWidgets, setActiveWidgets] = useState([
    "total",
    "completed",
    "overdue",
    "dueToday",
    "highPriority",
    "inProgress",
    "projects",
    "pinned",
  ]);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const toggleWidget = (widgetId) => {
    setActiveWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId],
    );
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
        >
          Quick Stats
        </h2>
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isCustomizing
              ? "bg-blue-500 text-white"
              : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <SettingsIcon fontSize="small" />
          {isCustomizing ? "Done" : "Customize"}
        </button>
      </div>

      {/* Widget Selector (shown when customizing) */}
      {isCustomizing && (
        <div
          className={`mb-4 p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
        >
          <p
            className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Click to toggle widgets:
          </p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_WIDGETS.map((widget) => (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeWidgets.includes(widget.id)
                    ? "bg-blue-500 text-white"
                    : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <widget.icon fontSize="small" />
                {widget.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {activeWidgets.map((widgetId) => {
          const widget = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
          if (!widget) return null;

          const WidgetComponent = widget.component;
          const colSpan = widget.size === "medium" ? "col-span-2" : "";

          return (
            <div
              key={widget.id}
              className={`${colSpan} p-4 rounded-xl transition-all ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-750"
                  : "bg-white hover:shadow-lg"
              } shadow-md relative group`}
            >
              {/* Widget Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <widget.icon
                    className={`${darkMode ? "text-gray-500" : "text-gray-400"}`}
                    fontSize="small"
                  />
                  <span
                    className={`text-xs font-medium uppercase tracking-wide ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {widget.name}
                  </span>
                </div>
                {isCustomizing && (
                  <button
                    onClick={() => toggleWidget(widget.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-red-500"
                  >
                    <CloseIcon fontSize="small" />
                  </button>
                )}
              </div>

              {/* Widget Content */}
              <WidgetComponent darkMode={darkMode} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
