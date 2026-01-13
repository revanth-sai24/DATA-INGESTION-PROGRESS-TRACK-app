"use client";
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectTasks,
    selectProjects,
    selectViewMode,
    selectHistory,
    selectHistoryIndex,
    selectFilter,
    selectSortConfig,
    selectFilteredTasks,
    setViewMode,
    setFilter,
    setSortConfig,
    undo,
    redo,
    updateTask,
    deleteTask,
    archiveTask,
    saveState
} from '@/redux/slices/taskSlice';
import {
    selectSearchQuery,
    setSearchQuery,
    setTaskFormOpen,
    setEditingTask,
    setFormData,
    resetFormData,
    setCommentDrawerOpen,
    setSelectedTaskForComments
} from '@/redux/slices/uiSlice';
import Header from '@/components/Header';
import Filters from '@/components/Filters';
import TaskList from '@/components/TaskList';

export default function TasksPage() {
    const [isClient, setIsClient] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState([]);

    // Redux selectors - all hooks first
    const tasks = useSelector(selectTasks);
    const projects = useSelector(selectProjects);
    const viewMode = useSelector(selectViewMode);
    const history = useSelector(selectHistory);
    const historyIndex = useSelector(selectHistoryIndex);
    const filter = useSelector(selectFilter);
    const sortConfig = useSelector(selectSortConfig);
    const filteredTasks = useSelector(selectFilteredTasks);
    const searchQuery = useSelector(selectSearchQuery);

    const dispatch = useDispatch();

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Helper functions
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return '#ff4444';
            case 'Medium': return '#ffaa00';
            case 'Low': return '#00aa00';
            default: return '#666666';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Todo': return '#6c757d';
            case 'In Progress': return '#007bff';
            case 'Done': return '#28a745';
            default: return '#6c757d';
        }
    };

    const formatTime = (minutes) => {
        if (!minutes) return '0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    // Conditional return after all hooks
    if (!isClient) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Loading...
            </Box>
        );
    }
    const handleSort = (key) => {
        const newConfig = {
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
        };
        dispatch(setSortConfig(newConfig));
    };

    const editTask = (task) => {
        dispatch(setEditingTask(task));
        dispatch(setFormData({
            title: task.title,
            description: task.description || "",
            status: task.status,
            project: task.project || "",
            priority: task.priority,
            dueDate: task.dueDate || null,
            estimatedTime: task.estimatedTime || "",
            tags: task.tags || [],
            subtasks: task.subtasks || [],
            timeTracking: task.timeTracking || { elapsed: 0, isRunning: false, startTime: null },
        }));
        dispatch(setTaskFormOpen(true));
    };

    const openCommentDrawer = (task) => {
        dispatch(setSelectedTaskForComments(task));
        dispatch(setCommentDrawerOpen(true));
    };

    const updateTaskStatus = (taskId, newStatus) => {
        const task = filteredTasks.find(t => t.id === taskId);
        if (task) {
            dispatch(updateTask({ ...task, status: newStatus }));
        }
    };

    const toggleTimeTracking = (taskId) => {
        const task = filteredTasks.find(t => t.id === taskId);
        if (task) {
            const isCurrentlyRunning = task.timeTracking?.isRunning;
            dispatch(updateTask({
                ...task,
                timeTracking: {
                    ...task.timeTracking,
                    isRunning: !isCurrentlyRunning,
                    startTime: !isCurrentlyRunning ? new Date().toISOString() : task.timeTracking.startTime
                }
            }));
        }
    };

    const bulkArchive = () => {
        if (selectedTasks.length === 0) return;
        dispatch(saveState());
        selectedTasks.forEach(taskId => dispatch(archiveTask(taskId)));
        setSelectedTasks([]);
    };

    const bulkDelete = () => {
        if (selectedTasks.length === 0) return;
        dispatch(saveState());
        selectedTasks.forEach(taskId => dispatch(deleteTask(taskId)));
        setSelectedTasks([]);
    };

    return (
        <>
            <Header
                title="Tasks"
                description="Manage your tasks efficiently"
                searchQuery={searchQuery}
                setSearchQuery={(query) => dispatch(setSearchQuery(query))}
                viewMode={viewMode}
                setViewMode={(mode) => dispatch(setViewMode(mode))}
                historyIndex={historyIndex}
                setHistoryIndex={(index) => index > historyIndex ? dispatch(redo()) : dispatch(undo())}
                history={history}
                selectedTasks={selectedTasks}
                bulkArchive={bulkArchive}
                bulkDelete={bulkDelete}
            />

            <Filters
                filter={filter}
                setFilter={(newFilter) => dispatch(setFilter(newFilter))}
                projects={projects}
                clearFilters={() => dispatch(setFilter({ status: "", project: "", priority: "" }))}
            />

            <TaskList
                viewMode={viewMode}
                searchedTasks={filteredTasks}
                selectedTasks={selectedTasks}
                setSelectedTasks={setSelectedTasks}
                sortConfig={sortConfig}
                setSortConfig={(config) => dispatch(setSortConfig(config))}
                updateTaskStatus={updateTaskStatus}
                formatTime={formatTime}
                toggleTimeTracking={toggleTimeTracking}
                editTask={editTask}
                setSelectedTaskForComments={(task) => dispatch(setSelectedTaskForComments(task))}
                setCommentDrawerOpen={(open) => dispatch(setCommentDrawerOpen(open))}
                archiveTask={(id) => dispatch(archiveTask(id))}
                deleteTask={(id) => dispatch(deleteTask(id))}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
            />
        </>
    );
}