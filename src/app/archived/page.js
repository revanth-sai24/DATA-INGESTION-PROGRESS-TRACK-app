"use client";
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectArchivedTasks,
    selectViewMode,
    selectHistory,
    selectHistoryIndex,
    selectSortConfig,
    setViewMode,
    setSortConfig,
    undo,
    redo,
    restoreTask,
    deleteTask,
    updateTask
} from '@/redux/slices/taskSlice';
import {
    selectSearchQuery,
    setSearchQuery,
    setSelectedTaskForComments,
    setCommentDrawerOpen
} from '@/redux/slices/uiSlice';
import Header from '@/components/Header';
import TaskList from '@/components/TaskList';

export default function ArchivedPage() {
    const [isClient, setIsClient] = useState(false);

    // Redux selectors - all hooks first
    const archivedTasks = useSelector(selectArchivedTasks);
    const searchQuery = useSelector(selectSearchQuery);
    const viewMode = useSelector(selectViewMode);
    const history = useSelector(selectHistory);
    const historyIndex = useSelector(selectHistoryIndex);
    const sortConfig = useSelector(selectSortConfig);
    const dispatch = useDispatch();

    // Computed values after hooks
    const searchedArchivedTasks = archivedTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    useEffect(() => {
        setIsClient(true);
    }, []);

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

    const updateTaskStatus = (taskId, newStatus) => {
        const task = archivedTasks.find(t => t.id === taskId);
        if (task) {
            dispatch(updateTask({ ...task, status: newStatus }));
        }
    };

    const toggleTimeTracking = (taskId) => {
        const task = archivedTasks.find(t => t.id === taskId);
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

    return (
        <>
            <Header
                title="Archived Tasks"
                description="View and restore archived tasks"
                searchQuery={searchQuery}
                setSearchQuery={(query) => dispatch(setSearchQuery(query))}
                viewMode={viewMode}
                setViewMode={(mode) => dispatch(setViewMode(mode))}
                historyIndex={historyIndex}
                setHistoryIndex={(index) => index > historyIndex ? dispatch(redo()) : dispatch(undo())}
                history={history}
                selectedTasks={[]}
                bulkArchive={() => { }}
                bulkDelete={() => { }}
            />

            <TaskList
                viewMode={viewMode}
                searchedTasks={searchedArchivedTasks}
                selectedTasks={[]}
                setSelectedTasks={() => { }}
                sortConfig={sortConfig}
                setSortConfig={(config) => dispatch(setSortConfig(config))}
                updateTaskStatus={updateTaskStatus}
                formatTime={formatTime}
                toggleTimeTracking={toggleTimeTracking}
                editTask={(task) => dispatch(restoreTask(task.id))}
                setSelectedTaskForComments={(task) => dispatch(setSelectedTaskForComments(task))}
                setCommentDrawerOpen={(open) => dispatch(setCommentDrawerOpen(open))}
                archiveTask={(id) => dispatch(restoreTask(id))}
                deleteTask={(id) => dispatch(deleteTask(id))}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
            />
        </>
    );
}