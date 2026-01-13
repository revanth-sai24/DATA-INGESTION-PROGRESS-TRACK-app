"use client";
import React from 'react';
import {
  Box, List, ListItem, ListItemText, ListItemIcon, Typography, Chip,
  Divider, TextField, IconButton, Tooltip, Button
} from '@mui/material';
import {
  ListAlt as ListAltIcon, TrendingUp as TrendingUpIcon, Archive as ArchiveIcon,
  Add as AddIcon, Download as DownloadIcon, Upload as UploadIcon,
  Refresh as RefreshIcon, Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon,
  Assignment as AssignmentIcon, Dashboard as DashboardIcon, Folder as FolderIcon,
  BarChart as BarChartIcon, Assessment as AssessmentIcon,
  CalendarToday as CalendarTodayIcon, GetApp as GetAppIcon, Settings as SettingsIcon
} from '@mui/icons-material';

export default function Sidebar({
  drawerWidth = 280,
  activePage,
  setActivePage,
  tasks,
  archivedTasks,
  projects,
  filter,
  setFilter,
  exportToCSV,
  importFromCSV,
  darkMode,
  setDarkMode,
  onAddTask
}) {
  return (
    <Box
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        bgcolor: '#f8f9fa',
        borderRight: 1,
        borderColor: '#e9ecef',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 1200,
        boxShadow: '2px 0 12px rgba(31,41,55,0.08)'
      }}
    >
      {/* Logo/Brand */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: '#e9ecef', bgcolor: '#ffffff',
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssignmentIcon sx={{ fontSize: 32, color: '#2563eb', mr: 1.5 }} />
          <Typography variant="h6" fontWeight="bold" color="#2563eb">
            TaskMaster
          </Typography>
        </Box>
        <Typography variant="caption" color="#6c757d">
          Professional Task Management
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flex: 1, py: 2, bgcolor: '#f8f9fa' }}>
        <ListItem
          component="button"
          selected={activePage === 'dashboard'}
          onClick={() => setActivePage('dashboard')}
          sx={{
            mx: 1,
            mb: 0.5,
            borderRadius: 2,
            bgcolor: activePage === 'dashboard' ? '#2563eb' : 'transparent',
            color: activePage === 'dashboard' ? 'white' : '#374151',
            transition: 'all .2s ease',
            '&:hover': { bgcolor: activePage === 'dashboard' ? '#1d4ed8' : '#eef2ff' },
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ListItemIcon sx={{ color: activePage === 'dashboard' ? 'white' : '#6b7280', minWidth: 40 }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>

       

        <ListItem
          component="button"
          selected={activePage === 'tasks'}
          onClick={() => setActivePage('tasks')}
          sx={{
            mx: 1,
            mb: 0.5,
            borderRadius: 2,
            bgcolor: activePage === 'tasks' ? '#2563eb' : 'transparent',
            color: activePage === 'tasks' ? 'white' : '#374151',
            transition: 'all .2s ease',
            '&:hover': { bgcolor: activePage === 'tasks' ? '#1d4ed8' : '#eef2ff' },
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ListItemIcon sx={{ color: activePage === 'tasks' ? 'white' : '#6b7280', minWidth: 40 }}>
            <ListAltIcon />
          </ListItemIcon>
          <ListItemText primary="Tasks" />
          <Chip size="small" label={tasks.length} sx={{ 
            bgcolor: activePage === 'tasks' ? 'rgba(255,255,255,0.25)' : '#eef2ff',
            color: activePage === 'tasks' ? 'white' : '#1f2937',
            fontWeight: 700,
            borderRadius: 8
          }} />
        </ListItem>

        <ListItem
          component="button"
          selected={activePage === 'projects'}
          onClick={() => setActivePage('projects')}
          sx={{
            mx: 1,
            mb: 0.5,
            borderRadius: 2,
            bgcolor: activePage === 'projects' ? '#2563eb' : 'transparent',
            color: activePage === 'projects' ? 'white' : '#374151',
            transition: 'all .2s ease',
            '&:hover': { bgcolor: activePage === 'projects' ? '#1d4ed8' : '#eef2ff' },
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ListItemIcon sx={{ color: activePage === 'projects' ? 'white' : '#6b7280', minWidth: 40 }}>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary="Projects" />
          <Chip size="small" label={projects.length} sx={{ 
            bgcolor: activePage === 'projects' ? 'rgba(255,255,255,0.25)' : '#eef2ff',
            color: activePage === 'projects' ? 'white' : '#1f2937',
            fontWeight: 700,
            borderRadius: 8
          }} />
        </ListItem>

        <ListItem
          component="button"
          selected={activePage === 'archived'}
          onClick={() => setActivePage('archived')}
          sx={{
            mx: 1,
            mb: 0.5,
            borderRadius: 2,
            bgcolor: activePage === 'archived' ? '#2563eb' : 'transparent',
            color: activePage === 'archived' ? 'white' : '#374151',
            transition: 'all .2s ease',
            '&:hover': { bgcolor: activePage === 'archived' ? '#1d4ed8' : '#eef2ff' },
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ListItemIcon sx={{ color: activePage === 'archived' ? 'white' : '#6b7280', minWidth: 40 }}>
            <ArchiveIcon />
          </ListItemIcon>
          <ListItemText primary="Archived" />
          <Chip size="small" label={archivedTasks.length} sx={{ 
            bgcolor: activePage === 'archived' ? 'rgba(255,255,255,0.25)' : '#eef2ff',
            color: activePage === 'archived' ? 'white' : '#1f2937',
            fontWeight: 700,
            borderRadius: 8
          }} />
        </ListItem>

        <Divider sx={{ my: 2, mx: 2, bgcolor: '#e5e7eb' }} />



        {/* Quick Projects Access */}
        <ListItem sx={{ px: 2 }}>
          <Typography variant="caption" fontWeight="bold" color="#6b7280" sx={{ letterSpacing: 0.3 }}>
            QUICK PROJECTS
          </Typography>
        </ListItem>

        {projects.slice(0, 5).map((project) => (
          <ListItem
            key={project.name || project}
            component="button"
            onClick={() => {
              setActivePage('tasks');
              setFilter({ ...filter, project: project.name || project });
            }}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 2,
              pl: 3,
              bgcolor: 'transparent',
              color: '#374151',
              '&:hover': { bgcolor: '#e5e7eb' },
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <ListItemText
              primary={project.name || project}
              primaryTypographyProps={{ fontSize: '0.875rem', color: '#374151' }}
            />
            <Chip
              size="small"
              label={tasks.filter(t => t.project === (project.name || project)).length}
              sx={{ height: 22, fontSize: '0.72rem', bgcolor: '#eef2ff', color: '#1f2937', fontWeight: 600, borderRadius: 8 }}
            />
          </ListItem>
        ))}

        {projects.length > 5 && (
          <ListItem component="button" sx={{ mx: 1, pl: 3, color: '#2563eb' }}>
            <Typography variant="caption" color="#2563eb">
              +{projects.length - 5} more
            </Typography>
          </ListItem>
        )}
      </List>

      {/* Bottom Actions */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: '#e5e7eb', bgcolor: '#ffffff' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddTask}
          sx={{ 
            mb: 2, 
            py: 1.2,
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            borderRadius: 2,
            fontWeight: 'bold'
          }}
        >
          Add New Task
        </Button>

        <Typography variant="caption" color="#6b7280" gutterBottom display="block" sx={{ mb: 1, fontWeight: 'bold' }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Tooltip title="Export CSV">
            <IconButton 
              size="small" 
              onClick={exportToCSV} 
              sx={{ 
                flex: 1, 
                bgcolor: '#f3f4f6', 
                '&:hover': { bgcolor: '#e5e7eb' },
                color: '#374151'
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import CSV">
            <IconButton 
              size="small" 
              component="label" 
              sx={{ 
                flex: 1,
                bgcolor: '#f3f4f6', 
                '&:hover': { bgcolor: '#e5e7eb' },
                color: '#374151'
              }}
            >
              <UploadIcon fontSize="small" />
              <input type="file" hidden accept=".csv" onChange={importFromCSV} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset & Load Sample Data">
            <IconButton
              size="small"
              onClick={() => {
                if (window.confirm('Clear all data and load sample tasks? This will replace your current data.')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              sx={{ 
                flex: 1,
                bgcolor: '#f3f4f6', 
                '&:hover': { bgcolor: '#e5e7eb' },
                color: '#374151'
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => setDarkMode(!darkMode)}
            startIcon={darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          >
            {darkMode ? 'Light' : 'Dark'} Mode
          </Button>
        </Tooltip>
        
        {/* Auto-save indicator */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'success.main',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />
            Auto-save enabled
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Your data is saved automatically
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
