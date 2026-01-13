"use client";
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectTasks,
    selectProjects,
    addProject
} from '@/redux/slices/taskSlice';
import {
    setSelectedProject,
    setConfirmDialogOpen
} from '@/redux/slices/uiSlice';
import ProjectsView from '@/components/ProjectsView';

export default function ProjectsPage() {
    const [isClient, setIsClient] = useState(false);

    // Redux selectors
    const projects = useSelector(selectProjects);
    const tasks = useSelector(selectTasks);
    const dispatch = useDispatch();

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

    return (
        <ProjectsView
            projects={projects}
            tasks={tasks}
            onDeleteProject={(project) => {
                dispatch(setSelectedProject(project));
                dispatch(setConfirmDialogOpen(true));
            }}
            onAddProject={(projectName) => dispatch(addProject(projectName))}
        />
    );
}