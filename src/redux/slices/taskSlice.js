import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import Papa from 'papaparse';
import { format } from 'date-fns';

// Auto-save to CSV files in public folder via API
const autoSaveTasksToCSV = async (tasksSnapshot) => {
    try {
        // Check if we're on the client side
        if (typeof window === 'undefined') {
            return;
        }

        // Call API to save tasks to public/sample-tasks.csv
        const response = await fetch('/api/save-tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tasks: tasksSnapshot }),
        });

        if (response.ok) {
            console.log('✅ Auto-saved', tasksSnapshot.length, 'tasks to sample-tasks.csv');
        } else {
            console.error('❌ Failed to save tasks to CSV');
        }

    } catch (error) {
        console.error('❌ Error auto-saving tasks:', error);
    }
};

const autoSaveProjectsToCSV = async (projectsSnapshot) => {
    try {
        // Check if we're on the client side
        if (typeof window === 'undefined') {
            return;
        }

        // Call API to save projects to public/sample-projects.csv
        const response = await fetch('/api/save-projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ projects: projectsSnapshot }),
        });

        if (response.ok) {
            console.log('✅ Auto-saved', projectsSnapshot.length, 'projects to sample-projects.csv');
        } else {
            console.error('❌ Failed to save projects to CSV');
        }

    } catch (error) {
        console.error('❌ Error auto-saving projects:', error);
    }
};

// Async thunks for CSV operations only
export const exportToCSV = createAsyncThunk(
    'tasks/exportToCSV',
    async (_, { getState }) => {
        const { tasks } = getState().tasks;
        const csvData = tasks.map(task => ({
            title: task.title,
            description: task.description,
            status: task.status,
            project: task.project,
            priority: task.priority,
            dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
            createdAt: format(new Date(task.createdAt), 'yyyy-MM-dd'),
            estimatedTime: task.estimatedTime,
            tags: task.tags.join(';'),
            timeElapsed: task.timeTracking.elapsed
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        return 'Tasks exported successfully!';
    }
);

export const importFromCSV = createAsyncThunk(
    'tasks/importFromCSV',
    async (file) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    const validRows = results.data.filter(row =>
                        row.title && row.title.trim() && row.id !== 'PROJECT'
                    );

                    const importedTasks = validRows
                        .filter(row => row.title && row.title.trim())
                        .map((row, index) => ({
                            id: row.id && row.id.startsWith('task-') ? row.id : `imported-${Date.now()}-${index}`,
                            title: row.title || '',
                            description: row.description || '',
                            status: row.status || 'Todo',
                            project: row.project || '',
                            priority: row.priority || 'Medium',
                            dueDate: row.dueDate ? new Date(row.dueDate).toISOString() : null,
                            createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
                            estimatedTime: row.estimatedTime || '',
                            tags: row.tags ? row.tags.split(';').filter(tag => tag.trim()) : [],
                            subtasks: [],
                            timeTracking: {
                                elapsed: parseInt(row.timeElapsed) || 0,
                                isRunning: false,
                                startTime: null
                            },
                            comments: []
                        }));
                    resolve(importedTasks);
                },
                error: (error) => reject(error)
            });
        });
    }
);

// Load tasks from CSV file via API
export const loadTasksFromCSV = createAsyncThunk(
    'tasks/loadTasksFromCSV',
    async () => {
        try {
            const response = await fetch('/api/load-tasks');
            const { tasks } = await response.json();
            console.log('✅ Loaded', tasks.length, 'tasks from CSV');
            return tasks || [];
        } catch (error) {
            console.error('❌ Error loading tasks from CSV:', error);
            return [];
        }
    }
);

// Load projects from CSV file via API
export const loadProjectsFromCSV = createAsyncThunk(
    'tasks/loadProjectsFromCSV',
    async () => {
        try {
            const response = await fetch('/api/load-projects');
            const { projects } = await response.json();
            console.log('✅ Loaded', projects.length, 'projects from CSV');
            return projects || [];
        } catch (error) {
            console.error('❌ Error loading projects from CSV:', error);
            return [];
        }
    }
);

const initialState = {
    tasks: [],
    archivedTasks: [],
    projects: [],
    loading: false,
    error: null,
    searchQuery: '',
    filter: { status: '', project: '', priority: '' },
    sortConfig: { key: 'createdAt', direction: 'desc' },
    selectedTasks: [],
    viewMode: 'card',
    history: [],
    historyIndex: -1
};

const taskSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        addTask: (state, action) => {
            const newTask = {
                ...action.payload,
                id: `task-${Date.now()}`,
                createdAt: new Date().toISOString(),
                dueDate: action.payload.dueDate ? new Date(action.payload.dueDate).toISOString() : null,
                timeTracking: { elapsed: 0, isRunning: false, startTime: null },
                comments: [],
                tags: action.payload.tags || [],
                description: action.payload.description || '',
                estimatedTime: action.payload.estimatedTime || ''
            };
            state.tasks.push(newTask);

            // Add project to projects array if it doesn't exist and is not empty
            if (newTask.project && newTask.project.trim() && !state.projects.includes(newTask.project)) {
                state.projects.push(newTask.project);
                // Auto-save projects to CSV with snapshot
                const projectsSnapshot = [...state.projects];
                setTimeout(() => autoSaveProjectsToCSV(projectsSnapshot), 0);
            }

            state.history.push([...state.tasks]);
            state.historyIndex = state.history.length - 1;

            // Auto-save tasks to CSV with snapshot
            const tasksSnapshot = [...state.tasks];
            setTimeout(() => autoSaveTasksToCSV(tasksSnapshot), 0);
        },
        updateTask: (state, action) => {
            const index = state.tasks.findIndex(task => task.id === action.payload.id);
            if (index !== -1) {
                const oldTask = state.tasks[index];
                const updatedTask = {
                    ...oldTask,
                    ...action.payload,
                    dueDate: action.payload.dueDate ? new Date(action.payload.dueDate).toISOString() : action.payload.dueDate
                };
                state.tasks[index] = updatedTask;

                // Handle project changes
                if (updatedTask.project && updatedTask.project.trim() && !state.projects.includes(updatedTask.project)) {
                    state.projects.push(updatedTask.project);
                }

                // Remove old project if no other tasks use it
                if (oldTask.project && oldTask.project !== updatedTask.project) {
                    const projectStillInUse = state.tasks.some(task =>
                        task.id !== updatedTask.id && task.project === oldTask.project
                    );
                    if (!projectStillInUse) {
                        state.projects = state.projects.filter(p => p !== oldTask.project);
                    }
                }

                state.history.push([...state.tasks]);
                state.historyIndex = state.history.length - 1;

                // Auto-save both tasks and projects with snapshots
                const tasksSnapshot = [...state.tasks];
                const projectsSnapshot = [...state.projects];
                setTimeout(() => {
                    autoSaveTasksToCSV(tasksSnapshot);
                    autoSaveProjectsToCSV(projectsSnapshot);
                }, 0);
            }
        },
        deleteTask: (state, action) => {
            state.tasks = state.tasks.filter(task => task.id !== action.payload);

            state.history.push([...state.tasks]);
            state.historyIndex = state.history.length - 1;

            // Auto-save tasks only
            const tasksSnapshot = [...state.tasks];
            setTimeout(() => {
                autoSaveTasksToCSV(tasksSnapshot);
            }, 0);
        },
        archiveTask: (state, action) => {
            const taskToArchive = state.tasks.find(task => task.id === action.payload);
            if (taskToArchive) {
                state.archivedTasks.push({ ...taskToArchive, archivedAt: new Date() });
                state.tasks = state.tasks.filter(task => task.id !== action.payload);
            }
        },
        restoreTask: (state, action) => {
            const taskToRestore = state.archivedTasks.find(task => task.id === action.payload);
            if (taskToRestore) {
                const { archivedAt, ...task } = taskToRestore;
                state.tasks.push(task);
                state.archivedTasks = state.archivedTasks.filter(task => task.id !== action.payload);
            }
        },
        addProject: (state, action) => {
            if (!state.projects.includes(action.payload)) {
                state.projects.push(action.payload);
                // Auto-save projects to CSV with snapshot
                const projectsSnapshot = [...state.projects];
                setTimeout(() => autoSaveProjectsToCSV(projectsSnapshot), 0);
            }
        },
        deleteProject: (state, action) => {
            state.projects = state.projects.filter(project => project !== action.payload);

            // Auto-save projects only
            const projectsSnapshot = [...state.projects];
            setTimeout(() => {
                autoSaveProjectsToCSV(projectsSnapshot);
            }, 0);
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setFilter: (state, action) => {
            state.filter = { ...state.filter, ...action.payload };
        },
        setSortConfig: (state, action) => {
            state.sortConfig = action.payload;
        },
        setSelectedTasks: (state, action) => {
            state.selectedTasks = action.payload;
        },
        setViewMode: (state, action) => {
            state.viewMode = action.payload;
        },
        toggleTimeTracking: (state, action) => {
            const task = state.tasks.find(t => t.id === action.payload);
            if (task) {
                if (task.timeTracking.isRunning) {
                    // Stop timer
                    const elapsed = Date.now() - task.timeTracking.startTime;
                    task.timeTracking.elapsed += elapsed;
                    task.timeTracking.isRunning = false;
                    task.timeTracking.startTime = null;
                } else {
                    // Start timer
                    task.timeTracking.isRunning = true;
                    task.timeTracking.startTime = Date.now();
                }
            }
        },
        undo: (state) => {
            if (state.historyIndex > 0) {
                state.historyIndex -= 1;
                state.tasks = [...state.history[state.historyIndex]];
            }
        },
        redo: (state) => {
            if (state.historyIndex < state.history.length - 1) {
                state.historyIndex += 1;
                state.tasks = [...state.history[state.historyIndex]];
            }
        },
        bulkArchive: (state, action) => {
            const tasksToArchive = state.tasks.filter(task => action.payload.includes(task.id));
            tasksToArchive.forEach(task => {
                state.archivedTasks.push({ ...task, archivedAt: new Date() });
            });
            state.tasks = state.tasks.filter(task => !action.payload.includes(task.id));
            state.selectedTasks = [];
        },
        bulkDelete: (state, action) => {
            state.tasks = state.tasks.filter(task => !action.payload.includes(task.id));
            state.selectedTasks = [];
        },
        saveState: (state) => {
            state.history.push([...state.tasks]);
            state.historyIndex = state.history.length - 1;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(exportToCSV.pending, (state) => {
                state.loading = true;
            })
            .addCase(exportToCSV.fulfilled, (state, action) => {
                state.loading = false;
                // Could add success message to state if needed
            })
            .addCase(exportToCSV.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(importFromCSV.pending, (state) => {
                state.loading = true;
            })
            .addCase(importFromCSV.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = [...state.tasks, ...action.payload];
                // Extract unique projects from imported tasks
                const importedProjects = [...new Set(action.payload.map(task => task.project).filter(Boolean))];
                const allProjects = [...new Set([...state.projects, ...importedProjects])];
                state.projects = allProjects;
                state.history.push([...state.tasks]);
                state.historyIndex = state.history.length - 1;
            })
            .addCase(importFromCSV.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(loadTasksFromCSV.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadTasksFromCSV.fulfilled, (state, action) => {
                state.loading = false;
                // Transform CSV data to ensure proper data types
                state.tasks = action.payload.map(task => ({
                    ...task,
                    tags: Array.isArray(task.tags) ? task.tags :
                        (typeof task.tags === 'string' && task.tags ? task.tags.split(';').filter(t => t.trim()) : []),
                    subtasks: task.subtasks || [],
                    timeTracking: task.timeTracking || {
                        elapsed: parseInt(task.timeElapsed) || 0,
                        isRunning: false,
                        startTime: null
                    },
                    comments: task.comments || []
                }));
                state.history.push([...state.tasks]);
                state.historyIndex = state.history.length - 1;
            })
            .addCase(loadTasksFromCSV.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(loadProjectsFromCSV.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadProjectsFromCSV.fulfilled, (state, action) => {
                state.loading = false;
                // Extract project names from CSV objects (they have {name, createdAt})
                state.projects = action.payload.map(p => typeof p === 'string' ? p : p.name);
            })
            .addCase(loadProjectsFromCSV.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const {
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
    restoreTask,
    addProject,
    deleteProject,
    setSearchQuery,
    setFilter,
    setSortConfig,
    setSelectedTasks,
    setViewMode,
    toggleTimeTracking,
    undo,
    redo,
    bulkArchive,
    bulkDelete,
    saveState
} = taskSlice.actions;

// Selectors
export const selectTasks = (state) => state.tasks.tasks;
export const selectArchivedTasks = (state) => state.tasks.archivedTasks;
export const selectProjects = (state) => state.tasks.projects;
export const selectLoading = (state) => state.tasks.loading;
export const selectError = (state) => state.tasks.error;
export const selectSearchQuery = (state) => state.tasks.searchQuery;
export const selectFilter = (state) => state.tasks.filter;
export const selectSortConfig = (state) => state.tasks.sortConfig;
export const selectSelectedTasks = (state) => state.tasks.selectedTasks;
export const selectViewMode = (state) => state.tasks.viewMode;
export const selectHistory = (state) => state.tasks.history;
export const selectHistoryIndex = (state) => state.tasks.historyIndex;

// Computed selectors - Memoized to prevent unnecessary rerenders
export const selectFilteredTasks = createSelector(
    [selectTasks, selectFilter, selectSearchQuery, selectSortConfig],
    (tasks, filter, searchQuery, sortConfig) => {
        let filtered = tasks.filter(task => {
            const matchesStatus = !filter.status || task.status === filter.status;
            const matchesProject = !filter.project || task.project === filter.project;
            const matchesPriority = !filter.priority || task.priority === filter.priority;
            const taskTags = Array.isArray(task.tags) ? task.tags : [];
            const matchesSearch = !searchQuery ||
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                taskTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesStatus && matchesProject && matchesPriority && matchesSearch;
        });

        // Sort tasks
        return filtered.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
);

export default taskSlice.reducer;