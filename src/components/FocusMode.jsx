"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateTask } from "../redux/slices/taskSlice";
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Timer as TimerIcon,
  Flag as FlagIcon,
  CalendarToday as CalendarIcon,
  SkipNext as SkipIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from "@mui/icons-material";

export default function FocusMode({
  isOpen,
  onClose,
  task,
  onTaskComplete,
  darkMode,
}) {
  const dispatch = useDispatch();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tasks = useSelector((state) => state.tasks.tasks);

  // Get next task in queue
  const getNextTask = () => {
    const activeTasks = tasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "archived" &&
        t.id !== task?.id,
    );
    // Prioritize by: pinned first, then high priority, then due date
    return activeTasks.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (a.priority !== "high" && b.priority === "high") return 1;
      if (a.dueDate && b.dueDate)
        return new Date(a.dueDate) - new Date(b.dueDate);
      return 0;
    })[0];
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning && isOpen) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isOpen]);

  // Reset timer when task changes
  useEffect(() => {
    setTimeElapsed(0);
    setIsRunning(false);
  }, [task?.id]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle task completion
  const handleComplete = () => {
    if (task) {
      dispatch(
        updateTask({
          ...task,
          status: "completed",
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timeSpent: (task.timeSpent || 0) + timeElapsed,
        }),
      );
      onTaskComplete && onTaskComplete();
    }
  };

  // Handle skip to next task
  const handleSkipNext = () => {
    const nextTask = getNextTask();
    if (nextTask) {
      // Save current time spent
      if (task) {
        dispatch(
          updateTask({
            ...task,
            timeSpent: (task.timeSpent || 0) + timeElapsed,
            updatedAt: new Date().toISOString(),
          }),
        );
      }
      setTimeElapsed(0);
      setIsRunning(false);
      // This would require a callback to switch tasks
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
        return "text-gray-500";
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] ${darkMode ? "bg-gray-900" : "bg-gray-100"} flex flex-col`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <CloseIcon />
          </button>
          <div
            className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            Focus Mode
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Timer Display */}
        <div
          className={`text-8xl font-mono font-bold mb-8 ${
            isRunning
              ? "text-green-500"
              : darkMode
                ? "text-gray-400"
                : "text-gray-500"
          }`}
        >
          {formatTime(timeElapsed)}
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isRunning
                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {isRunning ? (
              <PauseIcon fontSize="large" />
            ) : (
              <PlayIcon fontSize="large" />
            )}
          </button>
        </div>

        {/* Task Card */}
        <div
          className={`w-full max-w-2xl p-8 rounded-2xl shadow-2xl ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {/* Task Title */}
          <h1
            className={`text-3xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            {task.title}
          </h1>

          {/* Task Description */}
          {task.description && (
            <p
              className={`text-lg mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              {task.description}
            </p>
          )}

          {/* Task Meta */}
          <div className="flex flex-wrap gap-4 mb-8">
            {task.priority && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <FlagIcon className={getPriorityColor(task.priority)} />
                <span
                  className={`capitalize ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  {task.priority} Priority
                </span>
              </div>
            )}
            {task.dueDate && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <CalendarIcon
                  className={darkMode ? "text-blue-400" : "text-blue-500"}
                />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {task.project && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  📁 {task.project}
                </span>
              </div>
            )}
          </div>

          {/* Checkpoints */}
          {task.checkpoints && task.checkpoints.length > 0 && (
            <div className="mb-8">
              <h3
                className={`text-lg font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
              >
                Checkpoints
              </h3>
              <div className="space-y-2">
                {task.checkpoints.map((cp, index) => (
                  <div
                    key={cp.id || index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        cp.completed
                          ? "bg-green-500 border-green-500"
                          : darkMode
                            ? "border-gray-500"
                            : "border-gray-300"
                      }`}
                    >
                      {cp.completed && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <span
                      className={`${
                        cp.completed
                          ? `line-through ${darkMode ? "text-gray-500" : "text-gray-400"}`
                          : darkMode
                            ? "text-gray-300"
                            : "text-gray-700"
                      }`}
                    >
                      {cp.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleComplete}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-lg transition-colors"
            >
              <CompleteIcon />
              Mark Complete
            </button>
            <button
              onClick={handleSkipNext}
              className={`px-6 py-4 rounded-xl font-semibold transition-colors ${
                darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <SkipIcon />
            </button>
          </div>
        </div>

        {/* Next Task Preview */}
        {getNextTask() && (
          <div
            className={`mt-8 p-4 rounded-xl ${darkMode ? "bg-gray-800/50" : "bg-gray-200/50"}`}
          >
            <span
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Up Next:{" "}
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                {getNextTask()?.title}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
