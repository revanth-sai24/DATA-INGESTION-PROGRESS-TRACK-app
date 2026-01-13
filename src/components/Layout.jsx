"use client";
import React, { useState, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectDarkMode, 
  selectTaskFormOpen, 
  selectCommentDrawerOpen, 
  selectConfirmDialogOpen,
  selectFormData,
  selectEditingTask,
  selectSelectedTaskForComments,
  selectCommentText,
  selectSelectedProject,
  selectSnackbar,
  setDarkMode,
  hideSnackbar,
  setTaskFormOpen,
  setEditingTask,
  setFormData,
  resetFormData,
  setCommentDrawerOpen,
  setSelectedTaskForComments,
  setCommentText,
  setConfirmDialogOpen,
  setSelectedProject
} from '@/redux/slices/uiSlice';
import { 
  selectTasks, 
  selectArchivedTasks, 
  selectProjects, 
  selectFilter,
  addTask,
  updateTask,
  deleteProject,
  exportToCSV,
  importFromCSV,
  setFilter,
  loadTasksFromCSV,
  loadProjectsFromCSV
} from '@/redux/slices/taskSlice';
import Sidebar from '@/components/Sidebar';
import CommentDrawer from '@/components/CommentDrawer';
import DeleteDialog from '@/components/DeleteDialog';
import AddTaskDrawer from '@/components/AddTaskDrawer';

// Modern Professional Theme
const getTheme = (darkMode) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: darkMode ? "#90caf9" : "#1976d2",
    },
    secondary: {
      main: darkMode ? "#f48fb1" : "#dc004e",
    },
    background: {
      default: darkMode ? "#0a0e27" : "#f8f9fa",
      paper: darkMode ? "#1a1f3a" : "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: darkMode
              ? '0 20px 40px rgba(0,0,0,0.5)'
              : '0 20px 40px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default function Layout({ children }) {
  const [isClient, setIsClient] = useState(false);
  const dispatch = useDispatch();
  
  // All hooks must be called before any conditional returns
  const router = useRouter();
  const pathname = usePathname();
  
  // Redux selectors
  const darkMode = useSelector(selectDarkMode);
  const tasks = useSelector(selectTasks);
  const archivedTasks = useSelector(selectArchivedTasks);
  const projects = useSelector(selectProjects);
  const filter = useSelector(selectFilter);
  const taskFormOpen = useSelector(selectTaskFormOpen);
  const formData = useSelector(selectFormData);
  const editingTask = useSelector(selectEditingTask);
  const commentDrawerOpen = useSelector(selectCommentDrawerOpen);
  const selectedTaskForComments = useSelector(selectSelectedTaskForComments);
  const commentText = useSelector(selectCommentText);
  const confirmDialogOpen = useSelector(selectConfirmDialogOpen);
  const selectedProject = useSelector(selectSelectedProject);
  const snackbar = useSelector(selectSnackbar);
  
  const theme = React.useMemo(() => getTheme(darkMode), [darkMode]);
  
  // Load data from CSV files on mount
  useEffect(() => {
    setIsClient(true);
    
    // Load tasks and projects from CSV files
    dispatch(loadTasksFromCSV());
    dispatch(loadProjectsFromCSV());
  }, [dispatch]);
  
  // Return loading state on server-side or during initial client render
  if (!isClient) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </Box>
    );
  }

  const drawerWidth = 260;

  // Get active page from pathname
  const getActivePage = () => {
    if (pathname === '/') return 'dashboard';
    return pathname.slice(1); // Remove leading slash
  };

  const setActivePage = (page) => {
    if (page === 'dashboard') {
      router.push('/');
    } else {
      router.push(`/${page}`);
    }
  };

  // Task form handlers
  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const taskData = {
      ...formData,
      id: editingTask?.id,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: editingTask?.comments || [],
    };

    if (editingTask) {
      dispatch(updateTask(taskData));
    } else {
      dispatch(addTask(taskData));
    }

    dispatch(setTaskFormOpen(false));
    dispatch(setEditingTask(null));
    dispatch(resetFormData());
  };

  // Comment handlers
  const addComment = () => {
    if (!commentText.trim() || !selectedTaskForComments) return;

    const updatedTask = {
      ...selectedTaskForComments,
      comments: [
        ...selectedTaskForComments.comments,
        {
          id: Date.now(),
          text: commentText,
          timestamp: new Date().toISOString(),
        }
      ]
    };

    dispatch(updateTask(updatedTask));
    dispatch(setCommentText(''));
    dispatch(setCommentDrawerOpen(false));
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
          {/* Sidebar */}
          <Sidebar
            drawerWidth={drawerWidth}
            activePage={getActivePage()}
            setActivePage={setActivePage}
            tasks={tasks}
            archivedTasks={archivedTasks}
            projects={projects}
            filter={filter}
            setFilter={(newFilter) => dispatch(setFilter(newFilter))}
            exportToCSV={() => dispatch(exportToCSV())}
            importFromCSV={(file) => dispatch(importFromCSV(file))}
            darkMode={darkMode}
            setDarkMode={(mode) => dispatch(setDarkMode(mode))}
            onAddTask={() => dispatch(setTaskFormOpen(true))}
          />

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              ml: `${drawerWidth}px`,
              p: 4,
              minHeight: '100vh',
            }}
          >
            {children}
          </Box>

          {/* Add Task Drawer */}
          <AddTaskDrawer
            open={taskFormOpen}
            onClose={() => {
              dispatch(setTaskFormOpen(false));
              dispatch(setEditingTask(null));
              dispatch(resetFormData());
            }}
            formData={formData}
            setFormData={(data) => dispatch(setFormData(data))}
            editingTask={editingTask}
            handleSubmit={handleTaskSubmit}
            projects={projects}
          />

          {/* Comment Drawer */}
          <CommentDrawer
            open={commentDrawerOpen}
            onClose={() => dispatch(setCommentDrawerOpen(false))}
            selectedTask={selectedTaskForComments}
            commentText={commentText}
            setCommentText={(text) => dispatch(setCommentText(text))}
            addComment={addComment}
          />

          {/* Delete Dialog */}
          <DeleteDialog
            open={confirmDialogOpen}
            onClose={() => dispatch(setConfirmDialogOpen(false))}
            projectName={selectedProject}
            onConfirm={() => {
              dispatch(deleteProject(selectedProject));
              dispatch(setConfirmDialogOpen(false));
              dispatch(setSelectedProject(null));
            }}
          />

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}