import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    darkMode: false,
    taskFormOpen: false,
    commentDrawerOpen: false,
    confirmDialogOpen: false,
    searchQuery: '',
    formData: {
        title: '',
        description: '',
        status: 'Todo',
        project: '',
        priority: 'Medium',
        dueDate: null,
        estimatedTime: '',
        tags: [],
        subtasks: [],
        timeTracking: { elapsed: 0, isRunning: false, startTime: null }
    },
    editingTask: null,
    selectedTaskForComments: null,
    commentText: '',
    selectedProject: null,
    snackbar: { open: false, message: '', severity: 'success' }
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setDarkMode: (state, action) => {
            state.darkMode = action.payload;
        },
        setTaskFormOpen: (state, action) => {
            state.taskFormOpen = action.payload;
        },
        setCommentDrawerOpen: (state, action) => {
            state.commentDrawerOpen = action.payload;
        },
        setConfirmDialogOpen: (state, action) => {
            state.confirmDialogOpen = action.payload;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setFormData: (state, action) => {
            state.formData = { ...state.formData, ...action.payload };
        },
        resetFormData: (state) => {
            state.formData = initialState.formData;
        },
        setEditingTask: (state, action) => {
            state.editingTask = action.payload;
        },
        setSelectedTaskForComments: (state, action) => {
            state.selectedTaskForComments = action.payload;
        },
        setCommentText: (state, action) => {
            state.commentText = action.payload;
        },
        setSelectedProject: (state, action) => {
            state.selectedProject = action.payload;
        },
        setSnackbar: (state, action) => {
            state.snackbar = action.payload;
        },
        showSnackbar: (state, action) => {
            state.snackbar = {
                open: true,
                message: action.payload.message,
                severity: action.payload.severity || 'success'
            };
        },
        hideSnackbar: (state) => {
            state.snackbar = { ...state.snackbar, open: false };
        }
    }
});

export const {
    setDarkMode,
    setTaskFormOpen,
    setCommentDrawerOpen,
    setConfirmDialogOpen,
    setSearchQuery,
    setFormData,
    resetFormData,
    setEditingTask,
    setSelectedTaskForComments,
    setCommentText,
    setSelectedProject,
    setSnackbar,
    showSnackbar,
    hideSnackbar
} = uiSlice.actions;

// Selectors
export const selectDarkMode = (state) => state.ui.darkMode;
export const selectTaskFormOpen = (state) => state.ui.taskFormOpen;
export const selectCommentDrawerOpen = (state) => state.ui.commentDrawerOpen;
export const selectConfirmDialogOpen = (state) => state.ui.confirmDialogOpen;
export const selectSearchQuery = (state) => state.ui.searchQuery;
export const selectFormData = (state) => state.ui.formData;
export const selectEditingTask = (state) => state.ui.editingTask;
export const selectSelectedTaskForComments = (state) => state.ui.selectedTaskForComments;
export const selectCommentText = (state) => state.ui.commentText;
export const selectSelectedProject = (state) => state.ui.selectedProject;
export const selectSnackbar = (state) => state.ui.snackbar;

export default uiSlice.reducer;