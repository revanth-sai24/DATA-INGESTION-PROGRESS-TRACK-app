"use client";
import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Folder as FolderIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

export default function StatsCards({ tasks, projects }) {
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const completionRate = tasks.length > 0 ? ((completedTasks / tasks.length) * 100).toFixed(1) : 0;

  const stats = [
    {
      title: 'Total Tasks',
      value: tasks.length,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea'
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#f093fb'
    },
    {
      title: 'Projects',
      value: projects.length,
      icon: <FolderIcon sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#4facfe'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      color: '#43e97b'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid size={12} sm={6} md={3} key={index}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: stat.gradient,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  {stat.title}
                </Typography>
                <Box sx={{ opacity: 0.7 }}>
                  {stat.icon}
                </Box>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {stat.value}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
