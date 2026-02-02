"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  loadTasksFromCSV,
  loadProjectsFromCSV,
  undo,
  redo,
  duplicateTask,
  togglePinned,
  updateTask,
  deleteTask,
} from "../redux/slices/taskSlice";
import {
  Search as SearchIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  AccountCircle as ProfileIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Keyboard as KeyboardIcon,
  PictureAsPdf as PdfIcon,
  Palette as PaletteIcon,
  CenterFocusStrong as FocusIcon,
} from "@mui/icons-material";

import Sidebar from "./Sidebar";
import Filters from "./Filters";
import TaskList from "./TaskList";
import AnalyticsDashboard from "./AnalyticsDashboard";
import AdvancedAnalytics from "./AdvancedAnalytics";
import PDFExport from "./PDFExport";
import TaskForm from "./TaskForm";
import ProjectList from "./ProjectList";
import ArchivedTasks from "./ArchivedTasks";
import CalendarView from "./CalendarView";
import TimelineView from "./TimelineView";
import KanbanBoard from "./KanbanBoard";
import NotificationCenter from "./NotificationCenter";
import FavoritesTasks from "./FavoritesTasks";
import ContextMenu from "./ContextMenu";
import TaskQuickPreview from "./TaskQuickPreview";
import Confetti, { useConfetti } from "./Confetti";
import FocusMode from "./FocusMode";
import ThemeSelector from "./ThemeSelector";
import DashboardWidgets from "./DashboardWidgets";
import {
  useKeyboardShortcuts,
  KeyboardShortcutsModal,
} from "./KeyboardShortcuts";

export default function Layout({ children }) {
  const [isClient, setIsClient] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [focusTask, setFocusTask] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    task: null,
  });
  const [quickPreview, setQuickPreview] = useState({
    visible: false,
    task: null,
    position: { x: 0, y: 0 },
  });
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  // Confetti hook for celebrations
  const { showConfetti, triggerConfetti } = useConfetti();

  const dispatch = useDispatch();

  // Redux selectors
  const tasks = useSelector((state) => state.tasks.tasks || []);
  const archivedTasks = useSelector((state) => state.tasks.archivedTasks || []);
  const projects = useSelector((state) => state.tasks.projects || []);
  const filter = useSelector((state) => state.tasks.filter || {});
  const historyIndex = useSelector((state) => state.tasks.historyIndex);
  const history = useSelector((state) => state.tasks.history);

  // Keyboard shortcuts handlers
  const shortcutHandlers = useCallback(
    () => ({
      newTask: () => setShowTaskForm(true),
      editTask: () => {
        if (editingTask) setShowTaskForm(true);
      },
      search: () => searchRef.current?.focus(),
      undo: () => dispatch(undo()),
      redo: () => dispatch(redo()),
      dashboard: () => setActivePage("dashboard"),
      tasks: () => setActivePage("tasks"),
      kanban: () => setActivePage("kanban"),
      projects: () => setActivePage("projects"),
      close: () => {
        setShowTaskForm(false);
        setEditingTask(null);
        setContextMenu({ visible: false, x: 0, y: 0, task: null });
        setQuickPreview({
          visible: false,
          task: null,
          position: { x: 0, y: 0 },
        });
        setShowShortcutsHelp(false);
      },
      showHelp: () => setShowShortcutsHelp(true),
    }),
    [dispatch, editingTask],
  );

  useKeyboardShortcuts(shortcutHandlers());

  // Load data from CSV files on mount
  useEffect(() => {
    setIsClient(true);
    dispatch(loadTasksFromCSV());
    dispatch(loadProjectsFromCSV());
  }, [dispatch]);

  // Context menu handlers
  const handleContextMenu = (e, task) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, task });
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

  const handleComplete = (task) => {
    dispatch(
      updateTask({
        ...task,
        status: "completed",
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    triggerConfetti();
    closeContextMenu();
  };

  const handleArchive = (task) => {
    dispatch(
      updateTask({
        ...task,
        status: "archived",
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    closeContextMenu();
  };

  const handleColorLabel = (task, colorLabel) => {
    dispatch(
      updateTask({
        ...task,
        colorLabel,
        updatedAt: new Date().toISOString(),
      }),
    );
    closeContextMenu();
  };

  const handleDeleteTask = (task) => {
    if (confirm("Are you sure you want to delete this task?")) {
      dispatch(deleteTask(task.id));
    }
    closeContextMenu();
  };

  // Quick preview handlers
  const handleTaskHover = (task, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setQuickPreview({
      visible: true,
      task,
      position: { x: rect.right + 10, y: rect.top },
    });
  };

  const handleTaskLeave = () => {
    setQuickPreview({ visible: false, task: null, position: { x: 0, y: 0 } });
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const drawerWidth = 320;

  return (
    <div
      className={`flex min-h-screen relative ${darkMode ? "dark bg-gray-900" : "bg-white"}`}
      onClick={closeContextMenu}
    >
      {/* Header Bar */}
      <div
        className={`fixed top-0 left-0 right-0 h-16 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b shadow-sm z-50 flex items-center justify-between px-6`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            Task Manager
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo Buttons */}
          <button
            onClick={() => dispatch(undo())}
            disabled={historyIndex <= 0}
            className={`p-2 rounded-lg transition-colors ${
              historyIndex <= 0
                ? "opacity-50 cursor-not-allowed"
                : darkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon fontSize="small" />
          </button>
          <button
            onClick={() => dispatch(redo())}
            disabled={historyIndex >= history.length - 1}
            className={`p-2 rounded-lg transition-colors ${
              historyIndex >= history.length - 1
                ? "opacity-50 cursor-not-allowed"
                : darkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RedoIcon fontSize="small" />
          </button>

          <div
            className={`w-px h-6 ${darkMode ? "bg-gray-700" : "bg-gray-200"} mx-2`}
          ></div>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => setShowShortcutsHelp(true)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "hover:bg-gray-700 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Keyboard Shortcuts (Shift+?)"
          >
            <KeyboardIcon fontSize="small" />
          </button>

          {/* PDF Export Button */}
          <button
            onClick={() => setShowPDFExport(true)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "hover:bg-gray-700 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Export to PDF"
          >
            <PdfIcon fontSize="small" />
          </button>

          {/* Theme Selector Button */}
          <button
            onClick={() => setShowThemeSelector(true)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "hover:bg-gray-700 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Change Theme"
          >
            <PaletteIcon fontSize="small" />
          </button>

          {/* Notification Center */}
          <NotificationCenter darkMode={darkMode} />
        </div>
      </div>

      <Sidebar
        drawerWidth={drawerWidth}
        activePage={activePage}
        setActivePage={setActivePage}
        tasks={tasks}
        archivedTasks={archivedTasks}
        projects={projects}
        filter={filter}
        setFilter={(newFilter) =>
          dispatch({ type: "tasks/setFilter", payload: newFilter })
        }
        exportToCSV={() => dispatch({ type: "tasks/exportToCSV" })}
        importFromCSV={(e) =>
          dispatch({ type: "tasks/importFromCSV", payload: e })
        }
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onAddTask={() => setShowTaskForm(true)}
      />

      <main
        className={`flex-1 pt-20 p-8 animate-fade-in-up ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
        style={{ marginLeft: `${drawerWidth}px` }}
      >
        {/* Pinned/Favorites Tasks - Show on Tasks and Kanban pages */}
        {(activePage === "tasks" || activePage === "kanban") && (
          <FavoritesTasks
            darkMode={darkMode}
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskForm(true);
            }}
          />
        )}

        {activePage === "dashboard" && (
          <div className="space-y-8">
            <DashboardWidgets darkMode={darkMode} />
            <AnalyticsDashboard darkMode={darkMode} />
            <AdvancedAnalytics darkMode={darkMode} />
          </div>
        )}

        {activePage === "tasks" && (
          <>
            <Filters
              filter={filter}
              setFilter={(newFilter) =>
                dispatch({ type: "tasks/setFilter", payload: newFilter })
              }
              projects={projects}
              activePage={activePage}
              darkMode={darkMode}
            />
            <TaskList
              activePage={activePage}
              filter={filter}
              onEditTask={(task) => {
                setEditingTask(task);
                setShowTaskForm(true);
              }}
              onFocusTask={(task) => {
                setFocusTask(task);
                setShowFocusMode(true);
              }}
              onContextMenu={handleContextMenu}
              onTaskHover={handleTaskHover}
              onTaskLeave={handleTaskLeave}
              darkMode={darkMode}
            />
          </>
        )}

        {activePage === "kanban" && (
          <KanbanBoard
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskForm(true);
            }}
            filter={filter}
            darkMode={darkMode}
          />
        )}

        {activePage === "projects" && (
          <ProjectList
            setActivePage={setActivePage}
            setFilter={(newFilter) =>
              dispatch({ type: "tasks/setFilter", payload: newFilter })
            }
            darkMode={darkMode}
          />
        )}

        {activePage === "calendar" && (
          <CalendarView
            darkMode={darkMode}
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskForm(true);
            }}
          />
        )}

        {activePage === "timeline" && (
          <TimelineView
            darkMode={darkMode}
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskForm(true);
            }}
          />
        )}

        {activePage === "archived" && <ArchivedTasks darkMode={darkMode} />}
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          editingTask={editingTask}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          projects={projects}
        />
      )}

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        task={contextMenu.task}
        onClose={closeContextMenu}
        onEdit={(task) => {
          setEditingTask(task);
          setShowTaskForm(true);
        }}
        onDelete={handleDeleteTask}
        onDuplicate={handleDuplicate}
        onTogglePinned={handleTogglePinned}
        onArchive={handleArchive}
        onComplete={handleComplete}
        onColorLabel={handleColorLabel}
        darkMode={darkMode}
      />

      {/* Task Quick Preview */}
      {quickPreview.visible && quickPreview.task && (
        <TaskQuickPreview
          task={quickPreview.task}
          position={quickPreview.position}
          darkMode={darkMode}
          onClose={() =>
            setQuickPreview({
              visible: false,
              task: null,
              position: { x: 0, y: 0 },
            })
          }
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        darkMode={darkMode}
      />

      {/* PDF Export Modal */}
      <PDFExport
        isOpen={showPDFExport}
        onClose={() => setShowPDFExport(false)}
        darkMode={darkMode}
      />

      {/* Theme Selector Modal */}
      <ThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Focus Mode */}
      {showFocusMode && focusTask && (
        <FocusMode
          task={focusTask}
          onClose={() => {
            setShowFocusMode(false);
            setFocusTask(null);
          }}
          onComplete={(task) => {
            dispatch(
              updateTask({
                ...task,
                status: "completed",
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }),
            );
            triggerConfetti();
          }}
          onNextTask={() => {
            const incompleteTasks = tasks.filter(
              (t) => t.status !== "completed" && t.id !== focusTask.id,
            );
            if (incompleteTasks.length > 0) {
              setFocusTask(incompleteTasks[0]);
            } else {
              setShowFocusMode(false);
              setFocusTask(null);
            }
          }}
          darkMode={darkMode}
        />
      )}

      {/* Confetti Animation */}
      <Confetti show={showConfetti} />
    </div>
  );
}
