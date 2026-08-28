import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import Papa from "papaparse";
import { format } from "date-fns";

/**
 * Task state.
 *
 * Every mutation goes to the database through /api/tasks and /api/projects and
 * the store is replaced from the response, so what you see is always what was
 * persisted. The previous implementation rewrote the whole CSV file from Redux
 * on every keystroke-level change; a failed load followed by any edit truncated
 * it, which is how four projects were lost.
 */

const jsonFetch = async (url, options) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${options?.method ?? "GET"} ${url} failed`);
  return data;
};

/* ── loading ────────────────────────────────────────────────────────────── */

export const loadTasksFromCSV = createAsyncThunk("tasks/load", async () => {
  const { tasks } = await jsonFetch("/api/tasks");
  return tasks ?? [];
});

export const loadProjectsFromCSV = createAsyncThunk("projects/load", async () => {
  const { projects } = await jsonFetch("/api/projects");
  return projects ?? [];
});

/* ── task mutations ─────────────────────────────────────────────────────── */

export const addTask = createAsyncThunk("tasks/add", async (task) => {
  const { tasks } = await jsonFetch("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
  return tasks;
});

/** The user's local calendar day — the server runs in UTC and would file a
    late-evening completion under the wrong date. */
const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* Fields an undo can meaningfully put back. Timestamps and derived data are
   the server's business and are deliberately excluded. */
const UNDOABLE_FIELDS = [
  "title", "description", "status", "priority", "project", "dueDate",
  "estimatedTime", "workingFor", "workingWith", "pinned", "colorLabel", "tags",
];

const same = (a, b) =>
  Array.isArray(a) || Array.isArray(b)
    ? JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
    : (a ?? "") === (b ?? "");

export const updateTask = createAsyncThunk(
  "tasks/update",
  async (task, { getState, dispatch }) => {
    /* Capture the inverse before the write: undo has to reach the database,
       not just the store, or it silently un-does nothing. */
    const prev = getState().tasks.tasks.find((t) => t.id === task.id);
    if (prev) {
      const before = {};
      const after = {};
      for (const f of UNDOABLE_FIELDS) {
        if (f in task && !same(prev[f], task[f])) {
          before[f] = prev[f] ?? null;
          after[f] = task[f];
        }
      }
      if (Object.keys(before).length > 0) {
        dispatch(
          pushHistory({
            kind: "update",
            id: task.id,
            label: describeChange(before, after, prev.title),
            before,
            after,
          }),
        );
      }
    }

    const { tasks } = await jsonFetch("/api/tasks", {
      method: "PATCH",
      body: JSON.stringify({ ...task, logDate: localDay() }),
    });
    return tasks;
  },
);

export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async (id, { getState, dispatch }) => {
    const doomed = getState().tasks.tasks.find((t) => t.id === id);
    if (doomed) {
      dispatch(pushHistory({ kind: "delete", id, label: `Delete "${doomed.title}"`, task: doomed }));
    }
    const { tasks } = await jsonFetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return tasks;
  },
);

/** A short human label for the history entry, e.g. 'Status of "DQ check"'. */
function describeChange(before, after, title) {
  const keys = Object.keys(before);
  const name = keys.length === 1 ? keys[0] : `${keys.length} fields`;
  const pretty = { dueDate: "due date", colorLabel: "colour", estimatedTime: "estimate" }[name] || name;
  return `${pretty.charAt(0).toUpperCase()}${pretty.slice(1)} of "${title}"`;
}

export const reorderTasks = createAsyncThunk("tasks/reorder", async (ordered) => {
  const { tasks } = await jsonFetch("/api/tasks", {
    method: "PATCH",
    body: JSON.stringify({ reorder: ordered }),
  });
  return tasks;
});

/* Derived operations, expressed in terms of an update so the server stays the
   single source of truth for timestamps. */

export const archiveTask = createAsyncThunk("tasks/archive", async (id, { getState }) => {
  const task = getState().tasks.tasks.find((t) => t.id === id);
  const { tasks } = await jsonFetch("/api/tasks", {
    method: "PATCH",
    body: JSON.stringify({ ...task, id, status: "archived" }),
  });
  return tasks;
});

export const restoreTask = createAsyncThunk("tasks/restore", async (id, { getState }) => {
  const task = getState().tasks.tasks.find((t) => t.id === id);
  const { tasks } = await jsonFetch("/api/tasks", {
    method: "PATCH",
    body: JSON.stringify({ ...task, id, status: "todo" }),
  });
  return tasks;
});

export const togglePinned = createAsyncThunk("tasks/pin", async (id, { getState }) => {
  const task = getState().tasks.tasks.find((t) => t.id === id);
  const { tasks } = await jsonFetch("/api/tasks", {
    method: "PATCH",
    body: JSON.stringify({ ...task, id, pinned: !task?.pinned }),
  });
  return tasks;
});

export const setColorLabel = createAsyncThunk(
  "tasks/colorLabel",
  async ({ taskId, colorLabel }, { getState }) => {
    const task = getState().tasks.tasks.find((t) => t.id === taskId);
    const { tasks } = await jsonFetch("/api/tasks", {
      method: "PATCH",
      body: JSON.stringify({ ...task, id: taskId, colorLabel }),
    });
    return tasks;
  },
);

export const duplicateTask = createAsyncThunk("tasks/duplicate", async (id, { getState }) => {
  const source = getState().tasks.tasks.find((t) => t.id === id);
  if (!source) return getState().tasks.tasks;
  const { tasks } = await jsonFetch("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      ...source,
      id: undefined,
      title: `${source.title} (Copy)`,
      status: "todo",
      pinned: false,
      completedAt: null,
      checkpoints: (source.checkpoints ?? []).map((cp) => ({
        ...cp,
        id: undefined,
        completed: false,
      })),
    }),
  });
  return tasks;
});

export const bulkArchive = createAsyncThunk("tasks/bulkArchive", async (ids, { getState }) => {
  let tasks = getState().tasks.tasks;
  for (const id of ids) {
    const task = tasks.find((t) => t.id === id);
    if (!task) continue;
    ({ tasks } = await jsonFetch("/api/tasks", {
      method: "PATCH",
      body: JSON.stringify({ ...task, status: "archived" }),
    }));
  }
  return tasks;
});

export const bulkDelete = createAsyncThunk("tasks/bulkDelete", async (ids) => {
  let tasks = [];
  for (const id of ids) {
    ({ tasks } = await jsonFetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }));
  }
  return tasks;
});

/* ── time tracking ──────────────────────────────────────────────────────── */

export const startTimer = createAsyncThunk("time/start", async (taskId) => {
  const { tasks } = await jsonFetch("/api/time-entries", {
    method: "POST",
    body: JSON.stringify({ task_id: taskId }),
  });
  return tasks;
});

export const stopTimer = createAsyncThunk("time/stop", async (taskId) => {
  const { tasks } = await jsonFetch("/api/time-entries", {
    method: "PATCH",
    body: JSON.stringify({ task_id: taskId }),
  });
  return tasks;
});

/* ── comments ───────────────────────────────────────────────────────────── */

export const addComment = createAsyncThunk("comments/add", async ({ taskId, body, author }) => {
  const { tasks } = await jsonFetch("/api/comments", {
    method: "POST",
    body: JSON.stringify({ task_id: taskId, body, author }),
  });
  return tasks;
});

export const deleteComment = createAsyncThunk("comments/delete", async (id) => {
  const { tasks } = await jsonFetch(`/api/comments?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return tasks;
});

/* ── undo / redo ────────────────────────────────────────────────────────── */

/** Replay one history entry in the given direction, against the database. */
async function replay(entry, direction, getState) {
  if (entry.kind === "update") {
    const current = getState().tasks.tasks.find((t) => t.id === entry.id);
    const patch = direction === "undo" ? entry.before : entry.after;
    const { tasks } = await jsonFetch("/api/tasks", {
      method: "PATCH",
      body: JSON.stringify({ ...current, id: entry.id, ...patch, logDate: localDay() }),
    });
    return tasks;
  }

  if (entry.kind === "delete") {
    if (direction === "undo") {
      /* Recreated with its original id, so a redo can find it again. */
      const { tasks } = await jsonFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify(entry.task),
      });
      return tasks;
    }
    const { tasks } = await jsonFetch(`/api/tasks?id=${encodeURIComponent(entry.id)}`, {
      method: "DELETE",
    });
    return tasks;
  }

  throw new Error(`Cannot ${direction} a ${entry.kind}`);
}

export const undoLast = createAsyncThunk(
  "tasks/undoLast",
  async (_, { getState, dispatch }) => {
    const entry = getState().tasks.undoStack.at(-1);
    if (!entry) return getState().tasks.tasks;
    const tasks = await replay(entry, "undo", getState);
    dispatch(popUndo());
    return tasks;
  },
);

export const redoLast = createAsyncThunk(
  "tasks/redoLast",
  async (_, { getState, dispatch }) => {
    const entry = getState().tasks.redoStack.at(-1);
    if (!entry) return getState().tasks.tasks;
    const tasks = await replay(entry, "redo", getState);
    dispatch(popRedo());
    return tasks;
  },
);

/* ── project mutations ──────────────────────────────────────────────────── */

export const addProject = createAsyncThunk("projects/add", async (project) => {
  const payload = typeof project === "string" ? { name: project } : project;
  const { projects } = await jsonFetch("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return projects;
});

export const updateProject = createAsyncThunk("projects/update", async (project) => {
  const { projects } = await jsonFetch("/api/projects", {
    method: "PATCH",
    body: JSON.stringify(project),
  });
  return projects;
});

export const deleteProject = createAsyncThunk("projects/delete", async (idOrName) => {
  const data = await jsonFetch(`/api/projects?id=${encodeURIComponent(idOrName)}`, {
    method: "DELETE",
  });
  return data;
});

/* ── export / import ────────────────────────────────────────────────────── */

/**
 * Export to CSV.
 *
 * Pass the rows you are looking at to export exactly those; with no argument
 * it falls back to everything. The export was previously all-or-nothing and
 * only reachable from a screen that is no longer mounted.
 */
export const exportToCSV = createAsyncThunk("tasks/exportToCSV", async (rows, { getState }) => {
  const tasks = Array.isArray(rows) && rows.length ? rows : getState().tasks.tasks;
  const csv = Papa.unparse(
    tasks.map((task) => ({
      title: task.title,
      description: task.description,
      status: task.status,
      project: task.project,
      priority: task.priority,
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      createdAt: task.createdAt ? format(new Date(task.createdAt), "yyyy-MM-dd") : "",
      completedAt: task.completedAt ? format(new Date(task.completedAt), "yyyy-MM-dd") : "",
      estimatedTime: task.estimatedTime,
      tags: (task.tags ?? []).join(";"),
      timeElapsed: task.timeTracking?.elapsed ?? 0,
      workingFor: task.workingFor || "",
      workingWith: task.workingWith || "",
      pinned: task.pinned || false,
      colorLabel: task.colorLabel || "",
    })),
  );

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  link.download = `tasks-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  return `Exported ${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
});

export const importFromCSV = createAsyncThunk("tasks/importFromCSV", async (file) => {
  const rows = await new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data),
      error: reject,
    });
  });

  let tasks = [];
  for (const row of rows) {
    if (!row.title?.trim()) continue;
    ({ tasks } = await jsonFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: row.title,
        description: row.description || "",
        status: row.status || "todo",
        project: row.project || "",
        priority: row.priority || "medium",
        dueDate: row.dueDate || null,
        estimatedTime: row.estimatedTime || "",
        tags: row.tags ? row.tags.split(";").filter(Boolean) : [],
      }),
    }));
  }
  return tasks;
});

/* ── slice ──────────────────────────────────────────────────────────────── */

const initialState = {
  tasks: [],
  archivedTasks: [],
  projects: [],
  loading: false,
  saving: false,
  error: null,
  searchQuery: "",
  filter: { status: "", project: "", priority: "" },
  sortConfig: { key: "createdAt", direction: "desc" },
  selectedTasks: [],
  viewMode: "card",
  selectedTask: null,
  /* Inverse operations, newest last. Snapshots of the task array were kept
     here before; they could not survive a reload because the database never
     saw them. */
  undoStack: [],
  redoStack: [],
};

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setSearchQuery: (s, a) => void (s.searchQuery = a.payload),
    setFilter: (s, a) => void (s.filter = { ...s.filter, ...a.payload }),
    setSortConfig: (s, a) => void (s.sortConfig = a.payload),
    setSelectedTasks: (s, a) => void (s.selectedTasks = a.payload),
    setViewMode: (s, a) => void (s.viewMode = a.payload),
    setSelectedTask: (s, a) => void (s.selectedTask = a.payload),
    clearError: (s) => void (s.error = null),

    /* A new action invalidates anything that was undone. 50 is plenty for a
       session and keeps the store small. */
    pushHistory: (s, a) => {
      s.undoStack.push(a.payload);
      if (s.undoStack.length > 50) s.undoStack.shift();
      s.redoStack = [];
    },
    popUndo: (s) => {
      const entry = s.undoStack.pop();
      if (entry) s.redoStack.push(entry);
    },
    popRedo: (s) => {
      const entry = s.redoStack.pop();
      if (entry) s.undoStack.push(entry);
    },

    /* Call sites still dispatch this; the inverse is now recorded by the
       thunks themselves, at the point the change is actually known. */
    saveState: () => {},

    /* Kept for call sites that dispatch it directly; the real work now happens
       in startTimer/stopTimer against time_entries so a running timer survives
       a reload. */
    toggleTimeTracking: () => {},
  },

  extraReducers: (builder) => {
    const setTasks = (s, a) => {
      s.saving = false;
      s.loading = false;
      if (Array.isArray(a.payload)) {
        s.tasks = a.payload;
        s.archivedTasks = a.payload.filter((t) => t.status === "archived");
      }
    };
    /* Project mutations can change task rows too (archiving a project archives
       its tasks, renaming one changes the name every task reports), so the
       response carries both lists and both are applied together. Without this
       the Archived screen showed stale statuses until a manual reload. */
    const setProjects = (s, a) => {
      s.saving = false;
      s.loading = false;
      const p = a.payload;
      if (Array.isArray(p)) {
        s.projects = p;
        return;
      }
      if (Array.isArray(p?.projects)) s.projects = p.projects;
      if (Array.isArray(p?.tasks)) {
        s.tasks = p.tasks;
        s.archivedTasks = p.tasks.filter((t) => t.status === "archived");
      }
    };
    const fail = (s, a) => {
      s.saving = false;
      s.loading = false;
      s.error = a.error?.message ?? "Something went wrong";
    };

    const taskThunks = [
      loadTasksFromCSV, addTask, updateTask, deleteTask, reorderTasks,
      archiveTask, restoreTask, togglePinned, setColorLabel, duplicateTask,
      bulkArchive, bulkDelete, importFromCSV,
      startTimer, stopTimer, addComment, deleteComment,
      undoLast, redoLast,
    ];
    const projectThunks = [loadProjectsFromCSV, addProject, updateProject, deleteProject];

    for (const thunk of taskThunks) {
      builder
        .addCase(thunk.pending, (s) => void (s.saving = true, s.error = null))
        .addCase(thunk.fulfilled, setTasks)
        .addCase(thunk.rejected, fail);
    }
    for (const thunk of projectThunks) {
      builder
        .addCase(thunk.pending, (s) => void (s.saving = true, s.error = null))
        .addCase(thunk.fulfilled, setProjects)
        .addCase(thunk.rejected, fail);
    }

    // deleteProject returns { deleted, unassignedTasks, projects } — setProjects
    // already unwraps that shape, so it needs no case of its own here.
    builder.addCase(exportToCSV.rejected, fail);
  },
});

export const {
  setSearchQuery, setFilter, setSortConfig, setSelectedTasks, setViewMode,
  setSelectedTask, clearError, saveState, pushHistory, popUndo, popRedo,
  toggleTimeTracking,
} = taskSlice.actions;

/* ── selectors ──────────────────────────────────────────────────────────── */

export const selectTasks = (s) => s.tasks.tasks;
export const selectArchivedTasks = (s) => s.tasks.archivedTasks;
export const selectProjects = (s) => s.tasks.projects;
export const selectLoading = (s) => s.tasks.loading;
export const selectSaving = (s) => s.tasks.saving;
export const selectError = (s) => s.tasks.error;
export const selectSearchQuery = (s) => s.tasks.searchQuery;
export const selectFilter = (s) => s.tasks.filter;
export const selectSortConfig = (s) => s.tasks.sortConfig;
export const selectSelectedTasks = (s) => s.tasks.selectedTasks;
export const selectViewMode = (s) => s.tasks.viewMode;
export const selectCanUndo = (s) => s.tasks.undoStack.length > 0;
export const selectCanRedo = (s) => s.tasks.redoStack.length > 0;
export const selectNextUndo = (s) => s.tasks.undoStack.at(-1)?.label ?? null;
export const selectNextRedo = (s) => s.tasks.redoStack.at(-1)?.label ?? null;
export const selectSelectedTask = (s) => s.tasks.selectedTask;
export const selectPinnedTasks = (s) =>
  s.tasks.tasks.filter((t) => t.pinned && t.status !== "archived");

export const selectFilteredTasks = createSelector(
  [selectTasks, selectFilter, selectSearchQuery, selectSortConfig],
  (tasks, filter, searchQuery, sortConfig) => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.project && task.project !== filter.project) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (!q) return true;
      return (
        task.title?.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q) ||
        (task.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    });

    const dir = sortConfig.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortConfig.key] ?? "";
      const bv = b[sortConfig.key] ?? "";
      if (av < bv) return -dir;
      if (av > bv) return dir;
      return 0;
    });
  },
);

export default taskSlice.reducer;
