"use client";
import React, { useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, IconButton, Chip, LinearProgress,
  Paper, List, ListItem, ListItemText, ListItemIcon, Divider, TextField, Button
} from '@mui/material';
import {
  Folder as FolderIcon, Delete as DeleteIcon, Add as AddIcon,
  CheckCircle as CheckCircleIcon, Schedule as ScheduleIcon
} from '@mui/icons-material';

export default function ProjectsView({ projects, tasks, onDeleteProject, onAddProject }) {
  const [newProjectName, setNewProjectName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newProjectName.trim() && !projects.includes(newProjectName.trim())) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
    }
  };
  const getProjectStats = (projectName) => {
    const projectTasks = tasks.filter(t => t.project === projectName);
    const completed = projectTasks.filter(t => t.status === 'Done').length;
    const inProgress = projectTasks.filter(t => t.status === 'In Progress').length;
    const total = projectTasks.length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, inProgress, completionRate };
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📁 Projects
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track all your projects
        </Typography>
      </Box>

      {/* Add New Project Form */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            Create New Project
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                label="Project Name"
                placeholder="Enter project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                variant="outlined"
                sx={{ flex: 1 }}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newProjectName.trim() || projects.includes(newProjectName.trim())}
                sx={{ px: 3, py: 1.5 }}
              >
                Create Project
              </Button>
            </Box>
            {newProjectName.trim() && projects.includes(newProjectName.trim()) && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                Project with this name already exists
              </Typography>
            )}
          </form>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
          <FolderIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Projects Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first project using the form above
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => {
            const stats = getProjectStats(project);
            return (
              <Grid size={12} sm={6} md={4} key={project}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FolderIcon color="primary" sx={{ fontSize: 28 }} />
                        <Typography variant="h6" fontWeight="bold">
                          {project}
                        </Typography>
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={() => onDeleteProject(project)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Stats */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={`${stats.total} Tasks`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<ScheduleIcon />}
                          label={`${stats.inProgress} Active`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>

                      {/* Progress Bar */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="caption" fontWeight="bold" color="primary">
                            {stats.completionRate.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={stats.completionRate}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'action.hover',
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Task Breakdown */}
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          {stats.completed}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Completed
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          {stats.inProgress}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          In Progress
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" fontWeight="bold">
                          {stats.total - stats.completed - stats.inProgress}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Todo
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
