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
  Menu as MenuIcon,
} from "@mui/icons-material";

import Sidebar from "./Sidebar";
import TodayView from "./TodayView";
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
  const [activePage, setActivePage] = useState("today");
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef(null);

  // useConfetti returns { trigger, fireConfetti } — destructuring any other
  // names left fireConfetti undefined and threw on every "mark complete".
  const { trigger: confettiTrigger, fireConfetti } = useConfetti();

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
      today: () => setActivePage("today"),
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
    fireConfetti();
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
      <div className={darkMode ? "dark" : undefined}>
        <div className="flex min-h-dvh items-center justify-center bg-[var(--app-bg)]">
          <div className="flex items-center gap-3 text-sm text-[var(--fg-muted)]">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
            Loading
          </div>
        </div>
      </div>
    );
  }

  const iconBtn =
    "rounded-lg p-2 text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

  return (
    <div
      className={`relative min-h-dvh bg-[var(--app-bg)] ${darkMode ? "dark" : ""}`}
      onClick={closeContextMenu}
    >
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        tasks={tasks}
        archivedTasks={archivedTasks}
        projects={projects}
        filter={filter}
        setFilter={(newFilter) =>
          dispatch({ type: "tasks/setFilter", payload: newFilter })
        }
        onAddTask={() => setShowTaskForm(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Everything right of the drawer. The drawer is docked from lg up. */}
      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-sticky flex h-16 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)]/85 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(true);
            }}
            aria-label="Open navigation"
            className={`${iconBtn} lg:hidden`}
          >
            <MenuIcon fontSize="small" />
          </button>

          <h1 className="flex-1 truncate text-[15px] font-semibold capitalize tracking-[-0.01em] text-[var(--fg)]">
            {activePage === "today" ? "Today" : activePage}
          </h1>

          <div className="flex items-center gap-0.5">
            {/* Undo/redo are desktop-only — they need a pointer to be useful */}
            <button
              onClick={() => dispatch(undo())}
              disabled={historyIndex <= 0}
              className={`${iconBtn} hidden sm:inline-flex`}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <UndoIcon fontSize="small" />
            </button>
            <button
              onClick={() => dispatch(redo())}
              disabled={historyIndex >= history.length - 1}
              className={`${iconBtn} hidden sm:inline-flex`}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <RedoIcon fontSize="small" />
            </button>

            <span
              aria-hidden="true"
              className="mx-1.5 hidden h-5 w-px bg-[var(--border)] sm:block"
            />

            <button
              onClick={() => setShowShortcutsHelp(true)}
              className={`${iconBtn} hidden md:inline-flex`}
              title="Keyboard shortcuts (Shift+?)"
              aria-label="Keyboard shortcuts"
            >
              <KeyboardIcon fontSize="small" />
            </button>
            <button
              onClick={() => setShowPDFExport(true)}
              className={`${iconBtn} hidden sm:inline-flex`}
              title="Export to PDF"
              aria-label="Export to PDF"
            >
              <PdfIcon fontSize="small" />
            </button>
            <button
              onClick={() => setShowThemeSelector(true)}
              className={iconBtn}
              title="Appearance"
              aria-label="Appearance"
            >
              <PaletteIcon fontSize="small" />
            </button>

            <NotificationCenter darkMode={darkMode} />
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1400px] animate-fade-in-up px-4 py-6 sm:px-6 sm:py-8"
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

        {activePage === "today" && (
          <TodayView
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
      </div>

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
      {/* ThemeSelector reads `currentTheme`/`onThemeChange`; it was being given
          `setDarkMode`, which it does not accept, so picking a theme did nothing. */}
      <ThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
        darkMode={darkMode}
        currentTheme={darkMode ? "default-dark" : "default-light"}
        onThemeChange={(themeId) => setDarkMode(!String(themeId).includes("light"))}
      />

      {/* Focus Mode — `isOpen` is required; without it the component returned
          null on every render and the feature never appeared. */}
      {showFocusMode && focusTask && (
        <FocusMode
          isOpen={showFocusMode}
          task={focusTask}
          onClose={() => {
            setShowFocusMode(false);
            setFocusTask(null);
          }}
          onTaskComplete={() => {
            // FocusMode dispatches the status change itself and invokes this
            // with no arguments, so there is nothing to update here.
            fireConfetti();
            setShowFocusMode(false);
            setFocusTask(null);
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
      <Confetti trigger={confettiTrigger} />
    </div>
  );
}
