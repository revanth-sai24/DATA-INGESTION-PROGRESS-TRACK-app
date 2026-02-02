"use client";
import React, { useEffect, useCallback } from "react";

// Keyboard shortcuts configuration
const SHORTCUTS = {
  n: { description: "Create new task", action: "newTask", modifiers: ["ctrl"] },
  e: {
    description: "Edit selected task",
    action: "editTask",
    modifiers: ["ctrl"],
  },
  d: {
    description: "Delete selected task",
    action: "deleteTask",
    modifiers: ["ctrl"],
  },
  f: { description: "Focus search", action: "search", modifiers: ["ctrl"] },
  z: { description: "Undo", action: "undo", modifiers: ["ctrl"] },
  y: { description: "Redo", action: "redo", modifiers: ["ctrl"] },
  1: {
    description: "Go to Dashboard",
    action: "dashboard",
    modifiers: ["ctrl"],
  },
  2: { description: "Go to Tasks", action: "tasks", modifiers: ["ctrl"] },
  3: { description: "Go to Kanban", action: "kanban", modifiers: ["ctrl"] },
  4: { description: "Go to Projects", action: "projects", modifiers: ["ctrl"] },
  Escape: { description: "Close modal/drawer", action: "close", modifiers: [] },
  "?": {
    description: "Show shortcuts",
    action: "showHelp",
    modifiers: ["shift"],
  },
};

export function useKeyboardShortcuts(handlers = {}) {
  const handleKeyDown = useCallback(
    (event) => {
      // Don't trigger shortcuts when typing in inputs
      const tagName = event.target.tagName.toLowerCase();
      const isEditing =
        tagName === "input" ||
        tagName === "textarea" ||
        event.target.isContentEditable;

      // Allow Escape even when editing
      if (isEditing && event.key !== "Escape") return;

      const key = event.key.toLowerCase();
      const shortcut = SHORTCUTS[key] || SHORTCUTS[event.key];

      if (!shortcut) return;

      // Check modifiers
      const ctrlRequired = shortcut.modifiers.includes("ctrl");
      const shiftRequired = shortcut.modifiers.includes("shift");
      const altRequired = shortcut.modifiers.includes("alt");

      const ctrlPressed = event.ctrlKey || event.metaKey;
      const shiftPressed = event.shiftKey;
      const altPressed = event.altKey;

      if (ctrlRequired !== ctrlPressed) return;
      if (shiftRequired !== shiftPressed) return;
      if (altRequired !== altPressed) return;

      // Execute handler
      const handler = handlers[shortcut.action];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    },
    [handlers],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Keyboard Shortcuts Help Modal
export function KeyboardShortcutsModal({ isOpen, onClose, darkMode }) {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: "Task Actions",
      shortcuts: [
        { keys: ["Ctrl", "N"], description: "Create new task" },
        { keys: ["Ctrl", "E"], description: "Edit selected task" },
        { keys: ["Ctrl", "D"], description: "Delete selected task" },
      ],
    },
    {
      title: "Navigation",
      shortcuts: [
        { keys: ["Ctrl", "1"], description: "Go to Dashboard" },
        { keys: ["Ctrl", "2"], description: "Go to Tasks" },
        { keys: ["Ctrl", "3"], description: "Go to Kanban" },
        { keys: ["Ctrl", "4"], description: "Go to Projects" },
      ],
    },
    {
      title: "General",
      shortcuts: [
        { keys: ["Ctrl", "F"], description: "Focus search" },
        { keys: ["Ctrl", "Z"], description: "Undo" },
        { keys: ["Ctrl", "Y"], description: "Redo" },
        { keys: ["Esc"], description: "Close modal/drawer" },
        { keys: ["Shift", "?"], description: "Show this help" },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg mx-4 rounded-xl shadow-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              ⌨️ Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {shortcutGroups.map((group, index) => (
            <div key={group.title} className={index > 0 ? "mt-6" : ""}>
              <h3
                className={`text-sm font-semibold mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      darkMode ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <span
                      className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={key}>
                          <kbd
                            className={`px-2 py-1 text-xs font-mono rounded ${
                              darkMode
                                ? "bg-gray-600 text-gray-200 border border-gray-500"
                                : "bg-gray-200 text-gray-700 border border-gray-300"
                            }`}
                          >
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span
                              className={
                                darkMode ? "text-gray-500" : "text-gray-400"
                              }
                            >
                              +
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t ${darkMode ? "border-gray-700 text-gray-500" : "border-gray-200 text-gray-400"} text-xs text-center`}
        >
          Press{" "}
          <kbd
            className={`px-1 py-0.5 rounded ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
          >
            Esc
          </kbd>{" "}
          to close
        </div>
      </div>
    </div>
  );
}

export default SHORTCUTS;
