"use client";
import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateTask } from "../redux/slices/taskSlice";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Event as EventIcon,
  Flag as FlagIcon,
  PlayArrow as PlayIcon,
  DragIndicator as DragIcon,
} from "@mui/icons-material";

const CalendarView = ({ darkMode, onEditTask }) => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  // Get current month and year
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonth.getDate() - i),
      });
    }

    // Current month's days
    for (let date = 1; date <= daysInMonth; date++) {
      days.push({
        date,
        isCurrentMonth: true,
        fullDate: new Date(year, month, date),
      });
    }

    // Next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let date = 1; date <= remainingDays; date++) {
      days.push({
        date,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, date),
      });
    }

    return days;
  }, [year, month]);

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    // Format date as YYYY-MM-DD in local timezone
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      // Parse the task due date and format in local timezone
      const taskDate = new Date(task.dueDate);
      const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, "0")}-${String(taskDate.getDate()).padStart(2, "0")}`;
      return taskDateStr === dateStr;
    });
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Task status update
  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      dispatch(
        updateTask({
          ...task,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }),
      );
    }
  };

  // Priority color helper
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 shadow-sm`}
      >
        <div className="flex items-center justify-between mb-4">
          <h1
            className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            Calendar View
          </h1>
          <button
            onClick={goToToday}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              darkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <TodayIcon fontSize="small" />
            Today
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "text-gray-300 hover:text-white hover:bg-gray-700"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <ChevronLeftIcon />
            </button>

            <h2
              className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              {monthNames[month]} {year}
            </h2>

            <button
              onClick={goToNextMonth}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "text-gray-300 hover:text-white hover:bg-gray-700"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div
            className={`text-sm flex items-center gap-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            <span>
              {tasks.filter((task) => task.dueDate).length} tasks scheduled
            </span>
            <span
              className={`flex items-center gap-1 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              <DragIcon style={{ fontSize: 14 }} />
              Drag tasks to reschedule
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 shadow-sm`}
      >
        {/* Week header */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {weekDays.map((day) => (
            <div
              key={day}
              className={`text-center py-2 text-sm font-medium ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-4">
          {calendarDays.map((day, index) => {
            const dayTasks = getTasksForDate(day.fullDate);
            const isSelected =
              selectedDate &&
              selectedDate.toDateString() === day.fullDate.toDateString();

            return (
              <div
                key={index}
                className={`min-h-[120px] p-3 rounded-lg border cursor-pointer transition-all ${
                  day.isCurrentMonth
                    ? darkMode
                      ? `bg-gray-700 border-gray-600 hover:bg-gray-600 ${isSelected ? "ring-2 ring-blue-500" : ""}`
                      : `bg-white border-gray-200 hover:bg-gray-50 ${isSelected ? "ring-2 ring-blue-500" : ""}`
                    : darkMode
                      ? "bg-gray-800 border-gray-700 opacity-50"
                      : "bg-gray-50 border-gray-100 opacity-50"
                } ${isToday(day.fullDate) ? "ring-2 ring-blue-400" : ""}`}
                onClick={() => setSelectedDate(day.fullDate)}
              >
                <div className={`flex items-center justify-between mb-2`}>
                  <span
                    className={`text-sm font-medium ${
                      isToday(day.fullDate)
                        ? "text-blue-600 font-bold"
                        : day.isCurrentMonth
                          ? darkMode
                            ? "text-white"
                            : "text-gray-800"
                          : darkMode
                            ? "text-gray-500"
                            : "text-gray-400"
                    }`}
                  >
                    {day.date}
                  </span>
                  {dayTasks.length > 0 && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        darkMode
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Tasks preview - Draggable */}
                <div
                  className={`space-y-1 min-h-[40px] ${
                    dragOverDate === day.fullDate.toDateString()
                      ? darkMode
                        ? "bg-blue-900/30 border-2 border-dashed border-blue-500 rounded"
                        : "bg-blue-100/50 border-2 border-dashed border-blue-400 rounded"
                      : ""
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverDate(day.fullDate.toDateString());
                  }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverDate(null);
                    if (draggedTask) {
                      // Format new due date
                      const newDueDate = `${day.fullDate.getFullYear()}-${String(day.fullDate.getMonth() + 1).padStart(2, "0")}-${String(day.fullDate.getDate()).padStart(2, "0")}`;
                      dispatch(
                        updateTask({
                          ...draggedTask,
                          dueDate: newDueDate,
                          updatedAt: new Date().toISOString(),
                        }),
                      );
                      setDraggedTask(null);
                    }
                  }}
                >
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedTask(task);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDraggedTask(null)}
                      className={`p-2 rounded text-xs ${
                        darkMode ? "bg-gray-600" : "bg-gray-100"
                      } hover:opacity-80 transition-opacity cursor-grab active:cursor-grabbing ${
                        draggedTask?.id === task.id ? "opacity-50" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask && onEditTask(task);
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <DragIcon
                          className={`w-3 h-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                          style={{ fontSize: 12 }}
                        />
                        <div
                          className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
                        />
                        <span
                          className={`font-medium truncate ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <div
                        className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} truncate pl-5`}
                      >
                        {task.project}
                      </div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div
                      className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} text-center`}
                    >
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div
          className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 shadow-sm`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            Tasks for{" "}
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>

          {getTasksForDate(selectedDate).length === 0 ? (
            <p
              className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              No tasks scheduled for this date
            </p>
          ) : (
            <div className="space-y-3">
              {getTasksForDate(selectedDate).map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}
                      />
                      <div className="flex-1">
                        <h4
                          className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}
                        >
                          {task.title}
                        </h4>
                        <p
                          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {task.description}
                        </p>
                        <div
                          className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}
                        >
                          Project: {task.project} • Priority: {task.priority} •
                          Status: {task.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditTask && onEditTask(task)}
                        className={`px-3 py-1 rounded text-xs ${
                          darkMode
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        Edit
                      </button>
                      {task.status !== "completed" && (
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, "completed")
                          }
                          className={`px-3 py-1 rounded text-xs ${
                            darkMode
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
