"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Archive as ArchiveIcon,
  CheckCircle as CompleteIcon,
  Label as LabelIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

const COLOR_LABELS = [
  { id: "red", name: "Red", color: "#EF4444" },
  { id: "orange", name: "Orange", color: "#F97316" },
  { id: "yellow", name: "Yellow", color: "#EAB308" },
  { id: "green", name: "Green", color: "#22C55E" },
  { id: "blue", name: "Blue", color: "#3B82F6" },
  { id: "purple", name: "Purple", color: "#A855F7" },
  { id: "pink", name: "Pink", color: "#EC4899" },
  { id: "cyan", name: "Cyan", color: "#06B6D4" },
];

export default function ContextMenu({
  visible,
  x,
  y,
  task,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePinned,
  onArchive,
  onComplete,
  onColorLabel,
  darkMode,
}) {
  const menuRef = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Adjust position if menu goes off screen
  useEffect(() => {
    if (visible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > window.innerWidth) {
        adjustedX = window.innerWidth - rect.width - 10;
      }
      if (rect.bottom > window.innerHeight) {
        adjustedY = window.innerHeight - rect.height - 10;
      }

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [visible, x, y]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
        setShowColorPicker(false);
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [visible, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
        setShowColorPicker(false);
      }
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [visible, onClose]);

  if (!visible || !task) return null;

  const MenuItem = ({ icon, label, onClick, danger, className = "" }) => (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
        danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          : darkMode
            ? "text-gray-300 hover:bg-gray-700"
            : "text-gray-700 hover:bg-gray-100"
      } ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 min-w-[200px] rounded-xl shadow-2xl border overflow-hidden animate-scale-in ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
      style={{ left: x, top: y }}
    >
      {/* Task Info Header */}
      <div
        className={`px-4 py-3 border-b ${darkMode ? "border-gray-700 bg-gray-750" : "border-gray-200 bg-gray-50"}`}
      >
        <div
          className={`font-medium text-sm truncate ${darkMode ? "text-white" : "text-gray-800"}`}
        >
          {task.title}
        </div>
        <div
          className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          {task.status} • {task.priority}
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <MenuItem
          icon={<EditIcon fontSize="small" />}
          label="Edit Task"
          onClick={() => {
            onEdit(task);
            onClose();
          }}
        />

        <MenuItem
          icon={<DuplicateIcon fontSize="small" />}
          label="Duplicate"
          onClick={() => {
            onDuplicate(task);
            onClose();
          }}
        />

        <MenuItem
          icon={
            task.pinned ? (
              <StarIcon fontSize="small" className="text-yellow-500" />
            ) : (
              <StarBorderIcon fontSize="small" />
            )
          }
          label={task.pinned ? "Unpin Task" : "Pin Task"}
          onClick={() => {
            onTogglePinned(task);
            onClose();
          }}
        />

        {task.status !== "completed" && (
          <MenuItem
            icon={<CompleteIcon fontSize="small" className="text-green-500" />}
            label="Mark Complete"
            onClick={() => {
              onComplete(task);
              onClose();
            }}
          />
        )}

        <MenuItem
          icon={<ArchiveIcon fontSize="small" />}
          label="Archive"
          onClick={() => {
            onArchive(task);
            onClose();
          }}
        />

        {/* Color Label */}
        <div
          className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"} my-1`}
        ></div>

        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
              darkMode
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LabelIcon
              fontSize="small"
              style={{
                color: task.colorLabel
                  ? COLOR_LABELS.find((c) => c.id === task.colorLabel)?.color
                  : undefined,
              }}
            />
            <span>Color Label</span>
            <span className="ml-auto">→</span>
          </button>

          {/* Color Picker Submenu */}
          {showColorPicker && (
            <div
              className={`absolute left-full top-0 ml-1 p-2 rounded-lg shadow-xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="grid grid-cols-4 gap-2">
                {COLOR_LABELS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => {
                      onColorLabel(task, color.id);
                      onClose();
                      setShowColorPicker(false);
                    }}
                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                      task.colorLabel === color.id
                        ? "ring-2 ring-offset-2 ring-gray-400"
                        : ""
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  onColorLabel(task, null);
                  onClose();
                  setShowColorPicker(false);
                }}
                className={`w-full mt-2 py-1 text-xs rounded-lg border-2 border-dashed ${
                  darkMode
                    ? "border-gray-600 text-gray-400 hover:border-gray-500"
                    : "border-gray-300 text-gray-500 hover:border-gray-400"
                }`}
              >
                Remove color
              </button>
            </div>
          )}
        </div>

        <div
          className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"} my-1`}
        ></div>

        <MenuItem
          icon={<DeleteIcon fontSize="small" />}
          label="Delete Task"
          onClick={() => {
            onDelete(task);
            onClose();
          }}
          danger
        />
      </div>
    </div>
  );
}
