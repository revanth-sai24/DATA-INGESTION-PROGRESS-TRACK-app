"use client";
import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateTask,
  deleteTask,
  duplicateTask,
  togglePinned,
} from "../redux/slices/taskSlice";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  MoreVert as MoreIcon,
} from "@mui/icons-material";

const KANBAN_COLUMNS = [
  {
    id: "todo",
    title: "To Do",
    color: "blue",
    bgColor: "bg-blue-500",
    lightBg: "bg-blue-50",
    darkBg: "bg-blue-900/20",
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "yellow",
    bgColor: "bg-yellow-500",
    lightBg: "bg-yellow-50",
    darkBg: "bg-yellow-900/20",
  },
  {
    id: "completed",
    title: "Completed",
    color: "green",
    bgColor: "bg-green-500",
    lightBg: "bg-green-50",
    darkBg: "bg-green-900/20",
  },
  {
    id: "on-hold",
    title: "On Hold",
    color: "orange",
    bgColor: "bg-orange-500",
    lightBg: "bg-orange-50",
    darkBg: "bg-orange-900/20",
  },
];

const COLOR_LABELS = [
  { id: "red", name: "Red", color: "#EF4444", bg: "bg-red-500" },
  { id: "orange", name: "Orange", color: "#F97316", bg: "bg-orange-500" },
  { id: "yellow", name: "Yellow", color: "#EAB308", bg: "bg-yellow-500" },
  { id: "green", name: "Green", color: "#22C55E", bg: "bg-green-500" },
  { id: "blue", name: "Blue", color: "#3B82F6", bg: "bg-blue-500" },
  { id: "purple", name: "Purple", color: "#A855F7", bg: "bg-purple-500" },
  { id: "pink", name: "Pink", color: "#EC4899", bg: "bg-pink-500" },
  { id: "cyan", name: "Cyan", color: "#06B6D4", bg: "bg-cyan-500" },
];

export default function KanbanBoard({ onEditTask, darkMode, filter }) {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    task: null,
  });
  const [colorPickerTask, setColorPickerTask] = useState(null);
  const [hoveredTask, setHoveredTask] = useState(null);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((task) => task.status !== "archived");

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search),
      );
    }
    if (filter?.priority && filter.priority !== "all") {
      result = result.filter((task) => task.priority === filter.priority);
    }
    if (filter?.project && filter.project !== "all") {
      result = result.filter((task) => task.project === filter.project);
    }

    // Sort by pinned first
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [tasks, filter]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = {};
    KANBAN_COLUMNS.forEach((col) => {
      grouped[col.id] = filteredTasks.filter((task) => {
        const status = task.status?.toLowerCase().replace(" ", "-") || "todo";
        return status === col.id;
      });
    });
    return grouped;
  }, [filteredTasks]);

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

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    // Map column id to status
    const statusMap = {
      todo: "todo",
      "in-progress": "in-progress",
      completed: "completed",
      "on-hold": "on-hold",
    };

    const newStatus =
      statusMap[destination.droppableId] || destination.droppableId;

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
  };

  const handleContextMenu = (e, task) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      task,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, task: null });
  };

  const handleDuplicate = (task) => {
    dispatch(duplicateTask(task.id));
    closeContextMenu();
  };

  const handleTogglePinned = (task) => {
    dispatch(togglePinned(task.id));
    closeContextMenu();
  };

  const handleDelete = (taskId) => {
    if (confirm("Are you sure you want to delete this task?")) {
      dispatch(deleteTask(taskId));
    }
    closeContextMenu();
  };

  const handleColorLabel = (task, colorId) => {
    dispatch(
      updateTask({
        ...task,
        colorLabel: colorId,
        updatedAt: new Date().toISOString(),
      }),
    );
    setColorPickerTask(null);
    closeContextMenu();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityIcon = (priority) => {
    const colors = {
      high: "text-red-500",
      medium: "text-yellow-500",
      low: "text-green-500",
    };
    return colors[priority?.toLowerCase()] || "text-gray-400";
  };

  return (
    <div
      className={`h-full min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      onClick={closeContextMenu}
    >
      {/* Header */}
      <div className={`mb-6 flex items-center justify-between`}>
        <div>
          <h2
            className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            Kanban Board
          </h2>
          <p
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}
          >
            Drag and drop tasks between columns
          </p>
        </div>
        <div
          className={`flex items-center gap-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Overdue
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            Due Soon
          </span>
          <span className="flex items-center gap-1">
            <StarIcon className="text-yellow-500" fontSize="small" />
            Pinned
          </span>
        </div>
      </div>

      {/* Kanban Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4 h-[calc(100vh-220px)]">
          {KANBAN_COLUMNS.map((column) => (
            <div
              key={column.id}
              className={`flex flex-col rounded-xl ${darkMode ? "bg-gray-800/50" : "bg-gray-100"} overflow-hidden`}
            >
              {/* Column Header */}
              <div className={`p-4 ${column.bgColor} text-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{column.title}</h3>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                    {tasksByStatus[column.id]?.length || 0}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 space-y-3 overflow-y-auto transition-colors ${
                      snapshot.isDraggingOver
                        ? darkMode
                          ? column.darkBg
                          : column.lightBg
                        : ""
                    }`}
                    style={{ minHeight: "200px" }}
                  >
                    {tasksByStatus[column.id]?.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onContextMenu={(e) => handleContextMenu(e, task)}
                            onMouseEnter={() => setHoveredTask(task.id)}
                            onMouseLeave={() => setHoveredTask(null)}
                            className={`
                              relative p-4 rounded-lg shadow-sm cursor-grab active:cursor-grabbing
                              ${darkMode ? "bg-gray-700 hover:bg-gray-650" : "bg-white hover:bg-gray-50"}
                              ${snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500" : ""}
                              ${task.colorLabel ? `border-l-4` : "border-l-4 border-transparent"}
                              transition-all duration-200
                            `}
                            style={{
                              ...provided.draggableProps.style,
                              borderLeftColor: task.colorLabel
                                ? COLOR_LABELS.find(
                                    (c) => c.id === task.colorLabel,
                                  )?.color
                                : "transparent",
                            }}
                          >
                            {/* Pinned Indicator */}
                            {task.pinned && (
                              <div className="absolute -top-1 -right-1">
                                <StarIcon
                                  className="text-yellow-500 drop-shadow-md"
                                  fontSize="small"
                                />
                              </div>
                            )}

                            {/* Due Date Alert */}
                            {(isOverdue(task) || isDueSoon(task)) && (
                              <div
                                className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${
                                  isOverdue(task)
                                    ? "bg-red-500 animate-pulse"
                                    : "bg-yellow-500"
                                }`}
                              />
                            )}

                            {/* Task Title */}
                            <h4
                              className={`font-medium text-sm mb-2 pr-6 ${darkMode ? "text-white" : "text-gray-800"}`}
                            >
                              {task.title}
                            </h4>

                            {/* Task Meta */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {/* Priority */}
                              <span
                                className={`text-xs ${getPriorityIcon(task.priority)}`}
                              >
                                <FlagIcon fontSize="inherit" /> {task.priority}
                              </span>

                              {/* Due Date */}
                              {task.dueDate && (
                                <span
                                  className={`text-xs flex items-center gap-1 ${
                                    isOverdue(task)
                                      ? "text-red-500 font-medium"
                                      : isDueSoon(task)
                                        ? "text-yellow-500"
                                        : darkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                  }`}
                                >
                                  {isOverdue(task) && (
                                    <WarningIcon fontSize="inherit" />
                                  )}
                                  <ScheduleIcon fontSize="inherit" />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>

                            {/* Project Badge */}
                            {task.project && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  darkMode
                                    ? "bg-gray-600 text-gray-300"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {task.project}
                              </span>
                            )}

                            {/* Checkpoints Progress */}
                            {task.checkpoints &&
                              task.checkpoints.length > 0 && (
                                <div className="mt-2">
                                  <div
                                    className={`flex items-center justify-between text-xs mb-1 ${
                                      darkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    <span>Progress</span>
                                    <span>
                                      {
                                        task.checkpoints.filter(
                                          (cp) => cp.completed,
                                        ).length
                                      }
                                      /{task.checkpoints.length}
                                    </span>
                                  </div>
                                  <div
                                    className={`h-1.5 rounded-full overflow-hidden ${
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

                            {/* Quick Actions (on hover) */}
                            {hoveredTask === task.id && (
                              <div
                                className={`absolute top-2 right-2 flex items-center gap-1 ${
                                  darkMode ? "bg-gray-800" : "bg-white"
                                } rounded-lg shadow-lg p-1`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTask(task);
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    darkMode
                                      ? "hover:bg-gray-700 text-gray-400"
                                      : "hover:bg-gray-100 text-gray-600"
                                  }`}
                                  title="Edit"
                                >
                                  <EditIcon fontSize="small" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicate(task);
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    darkMode
                                      ? "hover:bg-gray-700 text-gray-400"
                                      : "hover:bg-gray-100 text-gray-600"
                                  }`}
                                  title="Duplicate"
                                >
                                  <DuplicateIcon fontSize="small" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePinned(task);
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    task.pinned
                                      ? "text-yellow-500"
                                      : darkMode
                                        ? "hover:bg-gray-700 text-gray-400"
                                        : "hover:bg-gray-100 text-gray-600"
                                  }`}
                                  title={task.pinned ? "Unpin" : "Pin"}
                                >
                                  {task.pinned ? (
                                    <StarIcon fontSize="small" />
                                  ) : (
                                    <StarBorderIcon fontSize="small" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Empty State */}
                    {tasksByStatus[column.id]?.length === 0 && (
                      <div
                        className={`text-center py-8 ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                      >
                        <p className="text-sm">No tasks</p>
                        <p className="text-xs mt-1">Drag tasks here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.task && (
        <div
          className={`fixed z-50 min-w-[180px] rounded-lg shadow-xl border ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-2">
            <button
              onClick={() => {
                onEditTask(contextMenu.task);
                closeContextMenu();
              }}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <EditIcon fontSize="small" /> Edit Task
            </button>
            <button
              onClick={() => handleDuplicate(contextMenu.task)}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <DuplicateIcon fontSize="small" /> Duplicate
            </button>
            <button
              onClick={() => handleTogglePinned(contextMenu.task)}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {contextMenu.task.pinned ? (
                <StarIcon fontSize="small" className="text-yellow-500" />
              ) : (
                <StarBorderIcon fontSize="small" />
              )}
              {contextMenu.task.pinned ? "Unpin Task" : "Pin Task"}
            </button>

            {/* Color Label Submenu */}
            <div
              className={`px-4 py-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              <div className="mb-2">Color Label</div>
              <div className="flex flex-wrap gap-1">
                {COLOR_LABELS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorLabel(contextMenu.task, color.id)}
                    className={`w-6 h-6 rounded-full ${color.bg} ${
                      contextMenu.task.colorLabel === color.id
                        ? "ring-2 ring-offset-2 ring-gray-400"
                        : ""
                    } hover:scale-110 transition-transform`}
                    title={color.name}
                  />
                ))}
                <button
                  onClick={() => handleColorLabel(contextMenu.task, null)}
                  className={`w-6 h-6 rounded-full border-2 border-dashed ${
                    darkMode ? "border-gray-600" : "border-gray-300"
                  } hover:scale-110 transition-transform`}
                  title="Remove color"
                />
              </div>
            </div>

            <div
              className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"} my-1`}
            ></div>

            <button
              onClick={() => handleDelete(contextMenu.task.id)}
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <DeleteIcon fontSize="small" /> Delete Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
