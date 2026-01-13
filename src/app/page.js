"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import {
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectTasks,
  selectProjects,
  exportToCSV,
  importFromCSV
} from '@/redux/slices/taskSlice';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);

  // Redux selectors
  const tasks = useSelector(selectTasks);
  const projects = useSelector(selectProjects);
  const dispatch = useDispatch();

  // Analytics data computed from CSV imported data only
  const statusData = useMemo(() => [
    { name: 'Todo', value: tasks.filter(t => t.status === 'Todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Done', value: tasks.filter(t => t.status === 'Done').length },
  ], [tasks]);

  const priorityData = useMemo(() => [
    { name: 'High', value: tasks.filter(t => t.priority === 'High').length },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'Medium').length },
    { name: 'Low', value: tasks.filter(t => t.priority === 'Low').length },
  ], [tasks]);

  const trendData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: startOfWeek(new Date()),
      end: endOfWeek(new Date())
    });
    return last7Days.map(date => ({
      date: format(date, 'MMM dd'),
      completed: tasks.filter(t =>
        t.status === 'Done' && new Date(t.createdAt).toDateString() === date.toDateString()
      ).length
    }));
  }, [tasks]);

  const projectData = useMemo(() => {
    return projects.map(project => ({
      name: project,
      tasks: tasks.filter(t => t.project === project).length,
      completed: tasks.filter(t => t.project === project && t.status === 'Done').length
    }));
  }, [tasks, projects]);

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

  const handleExportCSV = () => {
    dispatch(exportToCSV());
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (file) {
      dispatch(importFromCSV(file));
    }
  };

  return (
    <Box sx={{ p: 3, ml: '260px' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2563eb' }}>
          Task Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your CSV task data with analytics
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Card sx={{ flex: 1, bgcolor: '#f8fafc' }}>
          <CardContent>
            <Typography variant="h6" color="#2563eb">Total Tasks</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{tasks.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: '#f8fafc' }}>
          <CardContent>
            <Typography variant="h6" color="#2563eb">Projects</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{projects.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: '#f8fafc' }}>
          <CardContent>
            <Typography variant="h6" color="#2563eb">Completed</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {tasks.filter(t => t.status === 'Done').length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: '#f8fafc' }}>
          <CardContent>
            <Typography variant="h6" color="#2563eb">Completion Rate</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Done').length / tasks.length) * 100) : 0}%
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* CSV Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
        >
          Export to CSV
        </Button>
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadIcon />}
          sx={{ borderColor: '#2563eb', color: '#2563eb' }}
        >
          Import CSV Data
          <input
            type="file"
            hidden
            accept=".csv"
            onChange={handleImportCSV}
          />
        </Button>
      </Box>

      {/* Analytics Dashboard */}
      {tasks.length > 0 ? (
        <AnalyticsDashboard
          statusData={statusData}
          priorityData={priorityData}
          trendData={trendData}
          projectData={projectData}
        />
      ) : (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No Data Available
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Import your CSV data to see analytics and charts
            </Typography>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              Import CSV File
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={handleImportCSV}
              />
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
