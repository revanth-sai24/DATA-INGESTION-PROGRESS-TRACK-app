"use client";
import React from "react";
import { useState, useEffect } from "react";
import {
  Typography,
  Container,
  Box,
  AppBar,
  Toolbar,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Divider,
  FormHelperText,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  Badge,
  Tooltip,
  Avatar,
  LinearProgress,
  Alert,
  Snackbar
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Flag as FlagIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  // Archive as ArchiveIcon
} from "@mui/icons-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
// Add these imports at the top of your file
import {
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon,
  PieChart as PieChartIcon,
  Group as GroupIcon,
  ListAlt as ListAltIcon,
  ExpandMore as ExpandMoreIcon,
  AddComment as AddCommentIcon,
  Comment as CommentIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Archive as ArchiveIcon,
  RestoreFromTrash as RestoreIcon,
  Bookmark as BookmarkIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Drawer,
  SwipeableDrawer,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  BottomNavigation,
  BottomNavigationAction,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  Fab,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';


// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#0052cc",
    },
    secondary: {
      main: "#ff5630",
    },
    status: {
      todo: "#4caf50",
      inProgress: "#2196f3",
      done: "#9e9e9e",
    },
    priority: {
      high: "#ff5630",
      medium: "#ffab00",
      low: "#6554c0"
    }
  },
});

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "Todo",
    project: "",
    priority: "Medium",
    dueDate: null,
    estimatedTime: "",
    tags: []
  });
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState("");
  const [filter, setFilter] = useState({ status: "all", project: "all", priority: "all" });
  const [statusTabValue, setStatusTabValue] = useState(0);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [projectMenuAnchor, setProjectMenuAnchor] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [newTag, setNewTag] = useState("");
  // Add these to your existing state variables
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card', 'list', 'board'
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardView, setDashboardView] = useState(false);
  const [activePage, setActivePage] = useState('tasks');

  // Add these functions

  // Archive a task
  const archiveTask = (id) => {
    const taskToArchive = tasks.find(task => task.id === id);
    if (taskToArchive) {
      setArchivedTasks([...archivedTasks, { ...taskToArchive, archivedAt: new Date().toISOString() }]);
      setTasks(tasks.filter(task => task.id !== id));
      setSnackbar({ open: true, message: "Task archived!", severity: "info" });
    }
  };

  // Restore a task from archive
  const restoreTask = (id) => {
    const taskToRestore = archivedTasks.find(task => task.id === id);
    if (taskToRestore) {
      const { archivedAt, ...taskWithoutArchivedAt } = taskToRestore;
      setTasks([...tasks, taskWithoutArchivedAt]);
      setArchivedTasks(archivedTasks.filter(task => task.id !== id));
      setSnackbar({ open: true, message: "Task restored!", severity: "success" });
    }
  };

  // Add a comment to a task
  const addComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTaskForComments) return;

    setTasks(tasks.map(task =>
      task.id === selectedTaskForComments.id
        ? {
          ...task,
          comments: [...(task.comments || []), {
            id: Date.now(),
            text: commentText,
            createdAt: new Date().toISOString(),
          }]
        }
        : task
    ));

    setCommentText('');
    setSnackbar({ open: true, message: "Comment added!", severity: "success" });
  };

  // Request sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filter.status === "all" || task.status === filter.status;
    const projectMatch = filter.project === "all" || task.project === filter.project;
    const priorityMatch = filter.priority === "all" || task.priority === filter.priority;
    return statusMatch && projectMatch && priorityMatch;
  });


  // Sort tasks
  const sortedTasks = React.useMemo(() => {
    let sortableTasks = [...filteredTasks];
    if (sortConfig.key) {
      sortableTasks.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTasks;
  }, [filteredTasks, sortConfig]);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Search tasks
  const searchedTasks = React.useMemo(() => {
    if (!searchQuery) return sortedTasks;

    return sortedTasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [sortedTasks, searchQuery]);

  // Toggle view mode
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    const savedProjects = localStorage.getItem("projects");

    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedProjects) setProjects(JSON.parse(savedProjects));
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  // Add this useEffect
  useEffect(() => {
    const savedArchivedTasks = localStorage.getItem("archivedTasks");
    if (savedArchivedTasks) setArchivedTasks(JSON.parse(savedArchivedTasks));
  }, []);

  // Add this useEffect
  useEffect(() => {
    localStorage.setItem("archivedTasks", JSON.stringify(archivedTasks));
  }, [archivedTasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    if (editMode && editTaskId) {
      // Update existing task
      setTasks(tasks.map(task =>
        task.id === editTaskId ? { ...task, ...newTask } : task
      ));
      setSnackbar({ open: true, message: "Task updated successfully!", severity: "success" });
    } else {
      // Add new task
      const task = {
        ...newTask,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      setTasks([...tasks, task]);
      setSnackbar({ open: true, message: "Task added successfully!", severity: "success" });
    }

    // Reset form
    setNewTask({
      title: "",
      description: "",
      status: "Todo",
      project: newTask.project,
      priority: "Medium",
      dueDate: null,
      estimatedTime: "",
      tags: []
    });
    setEditMode(false);
    setEditTaskId(null);
  };

  const addProject = (e) => {
    e.preventDefault();
    if (!newProject.trim() || projects.includes(newProject)) return;

    setProjects([...projects, newProject]);
    setNewProject("");
    setSnackbar({ open: true, message: "Project added successfully!", severity: "success" });
  };

  const deleteProject = (project) => {
    // Remove the project
    setProjects(projects.filter(p => p !== project));

    // Remove all tasks associated with this project or keep them with no project
    setTasks(tasks.filter(task => task.project !== project));

    // Reset filter if we were filtering by this project
    if (filter.project === project) {
      setFilter({ ...filter, project: "all" });
    }

    setSnackbar({ open: true, message: "Project and all associated tasks deleted!", severity: "info" });
  };

  const updateTaskStatus = (id, newStatus) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, status: newStatus } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    setSnackbar({ open: true, message: "Task deleted!", severity: "info" });
  };

  const editTask = (task) => {
    setNewTask({ ...task });
    setEditMode(true);
    setEditTaskId(task.id);

    // Scroll to the form
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const addTagToTask = () => {
    if (!newTag.trim() || newTask.tags.includes(newTag)) {
      setNewTag("");
      return;
    }

    setNewTask({
      ...newTask,
      tags: [...newTask.tags, newTag]
    });
    setNewTag("");
  };

  const removeTagFromTask = (tagToRemove) => {
    setNewTask({
      ...newTask,
      tags: newTask.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleStatusTabChange = (event, newValue) => {
    setStatusTabValue(newValue);
    const statusMap = {
      0: "all",
      1: "Todo",
      2: "In Progress",
      3: "Done"
    };
    setFilter({ ...filter, status: statusMap[newValue] });
  };

  const handleProjectMenuOpen = (event, project) => {
    setProjectMenuAnchor(event.currentTarget);
    setSelectedProject(project);
  };

  const handleProjectMenuClose = () => {
    setProjectMenuAnchor(null);
    setSelectedProject(null);
  };

  const handleConfirmDeleteProject = () => {
    if (selectedProject) {
      deleteProject(selectedProject);
    }
    setConfirmDialogOpen(false);
    handleProjectMenuClose();
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  const getStatusColor = (status) => {
    switch (status) {
      case "Todo": return theme.palette.status.todo;
      case "In Progress": return theme.palette.status.inProgress;
      case "Done": return theme.palette.status.done;
      default: return "#ddd";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return theme.palette.priority.high;
      case "Medium": return theme.palette.priority.medium;
      case "Low": return theme.palette.priority.low;
      default: return "#ddd";
    }
  };

  const getProjectProgress = (projectName) => {
    const projectTasks = tasks.filter(task => task.project === projectName);
    if (projectTasks.length === 0) return 0;

    const completedTasks = projectTasks.filter(task => task.status === "Done").length;
    return (completedTasks / projectTasks.length) * 100;
  };


  // Dashboard component
  const Dashboard = () => {
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter(t => t.status === "Todo").length;
    const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
    const doneTasks = tasks.filter(t => t.status === "Done").length;

    const highPriorityTasks = tasks.filter(t => t.priority === "High").length;
    const mediumPriorityTasks = tasks.filter(t => t.priority === "Medium").length;
    const lowPriorityTasks = tasks.filter(t => t.priority === "Low").length;

    const overdueTasks = tasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done"
    ).length;

    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Dashboard</Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#f5f5f5', height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total Tasks</Typography>
                <Typography variant="h3">{totalTasks}</Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {Math.round(totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: theme.palette.status.todo + '22', height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>To Do</Typography>
                <Typography variant="h3">{todoTasks}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {Math.round(totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0)}% of total
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: theme.palette.status.inProgress + '22', height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>In Progress</Typography>
                <Typography variant="h3">{inProgressTasks}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {Math.round(totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0)}% of total
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: theme.palette.status.done + '22', height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Done</Typography>
                <Typography variant="h3">{doneTasks}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {Math.round(totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0)}% of total
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Tasks by Priority</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress
                      variant="determinate"
                      value={totalTasks > 0 ? (highPriorityTasks / totalTasks) * 100 : 0}
                      sx={{ color: theme.palette.priority.high }}
                    />
                    <Typography>High</Typography>
                    <Typography variant="h6">{highPriorityTasks}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress
                      variant="determinate"
                      value={totalTasks > 0 ? (mediumPriorityTasks / totalTasks) * 100 : 0}
                      sx={{ color: theme.palette.priority.medium }}
                    />
                    <Typography>Medium</Typography>
                    <Typography variant="h6">{mediumPriorityTasks}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress
                      variant="determinate"
                      value={totalTasks > 0 ? (lowPriorityTasks / totalTasks) * 100 : 0}
                      sx={{ color: theme.palette.priority.low }}
                    />
                    <Typography>Low</Typography>
                    <Typography variant="h6">{lowPriorityTasks}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: overdueTasks > 0 ? '#ffebee' : '#f5f5f5' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Overdue Tasks</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h3" sx={{ color: overdueTasks > 0 ? 'error.main' : 'inherit' }}>
                    {overdueTasks}
                  </Typography>
                  <Box sx={{ ml: 2 }}>
                    {overdueTasks > 0 ? (
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        You have overdue tasks that need attention!
                      </Alert>
                    ) : (
                      <Alert severity="success">
                        No overdue tasks - you're on track!
                      </Alert>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Project Progress</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Tasks</TableCell>
                      <TableCell>Completed</TableCell>
                      <TableCell>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map(project => {
                      const projectTasks = tasks.filter(task => task.project === project);
                      const completedTasks = projectTasks.filter(task => task.status === "Done").length;
                      const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;

                      return (
                        <TableRow key={project}>
                          <TableCell>{project}</TableCell>
                          <TableCell>{projectTasks.length}</TableCell>
                          <TableCell>{completedTasks}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress variant="determinate" value={progress} />
                              </Box>
                              <Typography variant="body2" color="textSecondary">
                                {Math.round(progress)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    );
  };


  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ flexGrow: 1, height: "100vh", display: "flex", flexDirection: "column" }}>
          <AppBar position="static">
            <Toolbar>
              <AssignmentIcon sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Task Tracker
              </Typography>
            </Toolbar>
          </AppBar>

          <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5' }}>
            <Box sx={{ flexGrow: 1, display: 'flex' }}>
              <ToggleButtonGroup
                value={activePage}
                exclusive
                onChange={(e, newValue) => newValue && setActivePage(newValue)}
                size="small"
              >
                <ToggleButton value="tasks">
                  <ListAltIcon sx={{ mr: 0.5 }} />
                  Tasks
                </ToggleButton>
                <ToggleButton value="dashboard">
                  <DashboardIcon sx={{ mr: 0.5 }} />
                  Dashboard
                </ToggleButton>
                <ToggleButton value="archived" disabled={archivedTasks.length === 0}>
                  <ArchiveIcon sx={{ mr: 0.5 }} />
                  Archived ({archivedTasks.length})
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField
              placeholder="Search tasks..."
              size="small"
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5 }} />,
              }}
              sx={{ width: 250, mr: 2 }}
            />

            {activePage === 'tasks' && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="card">
                  <DashboardIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="list">
                  <ListAltIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>

          <Container maxWidth="xl" sx={{ mt: 2, mb: 4, flexGrow: 1, display: "flex" }}>
            {activePage === 'dashboard' ? (
              <Dashboard />
            ) : activePage === 'archived' ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper elevation={3} sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="h6">
                        Archived Tasks
                      </Typography>
                    </Box>

                    {archivedTasks.length === 0 ? (
                      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#f5f5f5" }}>
                        <Typography color="textSecondary">
                          No archived tasks found.
                        </Typography>
                      </Paper>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Title</TableCell>
                              <TableCell>Project</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Archived On</TableCell>
                              <TableCell align="right">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {archivedTasks.map(task => (
                              <TableRow key={task.id}>
                                <TableCell>{task.title}</TableCell>
                                <TableCell>{task.project}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={task.status}
                                    size="small"
                                    sx={{ bgcolor: getStatusColor(task.status), color: "white" }}
                                  />
                                </TableCell>
                                <TableCell>{new Date(task.archivedAt).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                  <Button
                                    startIcon={<RestoreIcon />}
                                    size="small"
                                    onClick={() => restoreTask(task.id)}
                                    sx={{ mr: 1 }}
                                  >
                                    Restore
                                  </Button>
                                  <IconButton
                                    onClick={() => setArchivedTasks(archivedTasks.filter(t => t.id !== task.id))}
                                    color="secondary"
                                    size="small"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={3}>
                {/* Your existing sidebar and main content */}
                <Grid item xs={12} md={3}>
                  <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Projects
                    </Typography>
                    <form onSubmit={addProject}>
                      <TextField

                        label="New Project"
                        fullWidth
                        value={newProject}
                        onChange={(e) => setNewProject(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        startIcon={<AddIcon />}
                      >
                        Add Project
                      </Button>
                    </form>
                    <List sx={{ mt: 2 }}>
                      {projects.map((project) => (
                        <ListItem


                          key={project}
                          secondaryAction={
                            <IconButton

                              edge="end"
                              onClick={(e) => handleProjectMenuOpen(e, project)}
                              size="small"
                            >
                              <MoreVertIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText primary={project} />
                          <Menu

                            anchorEl={projectMenuAnchor}
                            open={Boolean(projectMenuAnchor) && selectedProject === project}
                            onClose={handleProjectMenuClose}
                          >
                            <MenuItem onClick={() => {
                              setFilter({ ...filter, project });
                              handleProjectMenuClose();
                            }}>
                              <FilterListIcon sx={{ mr: 1 }} />
                              Filter by Project
                            </MenuItem>
                            <MenuItem onClick={() => {
                              setConfirmDialogOpen(true);
                              handleProjectMenuClose();
                            }}>
                              <DeleteIcon sx={{ mr: 1 }} />
                              Delete Project
                            </MenuItem>
                            <MenuItem onClick={() => {
                              setFilter({ ...filter, project: "all" });
                              handleProjectMenuClose();
                            }}>
                              <RefreshIcon sx={{ mr: 1 }} />
                              Clear Filter
                            </MenuItem>
                          </Menu>
                        </ListItem>
                      ))}
                      {projects.length === 0 && (
                        <Typography color="textSecondary" sx={{ mt: 2 }}>
                          No projects found. Add a project to get started!
                        </Typography>
                      )}
                    </List>
                    <Dialog

                      open={confirmDialogOpen}
                      onClose={() => setConfirmDialogOpen(false)}

                      aria-labelledby="confirm-dialog-title"
                      aria-describedby="confirm-dialog-description"
                    >

                      <DialogTitle id="confirm-dialog-title">Confirm Delete</DialogTitle>
                      <DialogContent>
                        <DialogContentText id="confirm-dialog-description">
                          Are you sure you want to delete the project "{selectedProject}"? This will also delete all tasks associated with it.
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
                          Cancel
                        </Button>
                        <Button onClick={handleConfirmDeleteProject} color="secondary">
                          Delete
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </Paper>
                </Grid>
                

                {/* Task list view - replace your existing task list with this conditional rendering */}
                <Grid item xs={12} md={9}>
                  <Grid container spacing={3}>
                    {/* Add Task Form (keep existing code) */}
                    <Grid item xs={12}>
                      {/* Your existing add task form */}
                      <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          {editMode ? "Edit Task" : "Add New Task"}
                        </Typography>
                        <form onSubmit={addTask}>
                          <TextField
                            label="Title"
                            fullWidth
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            required
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={4}
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            sx={{ mb: 2 }}
                          />
                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Project</InputLabel>
                            <Select
                              value={newTask.project}
                              onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                              label="Project"
                            >
                              {projects.map((project) => (
                                <MenuItem key={project} value={project}>
                                  {project}
                                </MenuItem>
                              ))}
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                            </Select>
                          </FormControl>
                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                              value={newTask.status}
                              onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                              label="Status"
                            >
                              <MenuItem value="Todo">Todo</MenuItem>
                              <MenuItem value="In Progress">In Progress</MenuItem>
                              <MenuItem value="Done">Done</MenuItem>
                            </Select>
                          </FormControl>
                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Priority</InputLabel>
                            <Select
                              value={newTask.priority}
                              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                              label="Priority"
                            >
                              <MenuItem value="High">High</MenuItem>
                              <MenuItem value="Medium">Medium</MenuItem>
                              <MenuItem value="Low">Low</MenuItem>
                            </Select>
                          </FormControl>
                          <DatePicker
                            label="Due Date"
                            value={newTask.dueDate}
                            onChange={(date) => setNewTask({ ...newTask, dueDate: date })}
                            renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                          />
                          <TextField
                            label="Estimated Time (hours)"
                            type="number"
                            fullWidth
                            value={newTask.estimatedTime}
                            onChange={(e) => setNewTask({ ...newTask, estimatedTime: e.target.value })}
                            sx={{ mb: 2 }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TextField
                              label="Tags"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={addTagToTask}
                              startIcon={<AddIcon />}
                            >
                              Add Tag
                            </Button>
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
                            {newTask.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                onDelete={() => removeTagFromTask(tag)}
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                              variant="contained"
                              color="primary"
                              type="submit"
                              startIcon={editMode ? <EditIcon /> : <AddIcon />}
                            >
                              {editMode ? "Update Task" : "Add Task"}
                            </Button>
                            {editMode && (
                              <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => {
                                  setEditMode(false);
                                  setEditTaskId(null);
                                  setNewTask({
                                    title: "",
                                    description: "",
                                    status: "Todo",
                                    project: "",
                                    priority: "Medium",
                                    dueDate: null,
                                    estimatedTime: "",
                                    tags: []
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </Box>
                        </form>
                      </Paper>
                    </Grid>

                    {/* Task List - replace with this */}
                    <Grid item xs={12}>
                      <Paper elevation={3} sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                          <Typography variant="h6">
                            Tasks
                            {filter.project !== "all" && (
                              <Chip label={filter.project} size="small" sx={{ ml: 1 }} />
                            )}
                            {filter.status !== "all" && (
                              <Chip
                                label={filter.status}
                                size="small"
                                sx={{ ml: 1, bgcolor: getStatusColor(filter.status), color: "white" }}
                              />
                            )}
                            {filter.priority !== "all" && (
                              <Chip
                                label={filter.priority}
                                size="small"
                                sx={{ ml: 1, bgcolor: getPriorityColor(filter.priority), color: "white" }}
                              />
                            )}
                          </Typography>

                          <Box>
                            <IconButton
                              onClick={() => setFilter({ status: "all", project: "all", priority: "all" })}
                              title="Clear filters"
                            >
                              <RefreshIcon />
                            </IconButton>
                          </Box>
                        </Box>

                        {searchedTasks.length === 0 ? (
                          <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#f5f5f5" }}>
                            <Typography color="textSecondary">
                              No tasks found. Add some tasks to get started!
                            </Typography>
                          </Paper>
                        ) : viewMode === 'list' ? (
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>
                                    <TableSortLabel
                                      active={sortConfig.key === 'title'}
                                      direction={sortConfig.key === 'title' ? sortConfig.direction : 'asc'}
                                      onClick={() => requestSort('title')}
                                    >
                                      Title
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell>Project</TableCell>
                                  <TableCell>
                                    <TableSortLabel
                                      active={sortConfig.key === 'priority'}
                                      direction={sortConfig.key === 'priority' ? sortConfig.direction : 'asc'}
                                      onClick={() => requestSort('priority')}
                                    >
                                      Priority
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell>
                                    <TableSortLabel
                                      active={sortConfig.key === 'status'}
                                      direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                                      onClick={() => requestSort('status')}
                                    >
                                      Status
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell>
                                    <TableSortLabel
                                      active={sortConfig.key === 'dueDate'}
                                      direction={sortConfig.key === 'dueDate' ? sortConfig.direction : 'asc'}
                                      onClick={() => requestSort('dueDate')}
                                    >
                                      Due Date
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell align="right">Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {searchedTasks.map(task => (
                                  <TableRow key={task.id}>
                                    <TableCell>{task.title}</TableCell>
                                    <TableCell>{task.project}</TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <FlagIcon sx={{ color: getPriorityColor(task.priority), fontSize: 18, mr: 0.5 }} />
                                        {task.priority}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={task.status}
                                        size="small"
                                        sx={{ bgcolor: getStatusColor(task.status), color: "white" }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {task.dueDate ? (
                                        <Typography
                                          variant="body2"
                                          color={new Date(task.dueDate) < new Date() && task.status !== "Done" ?
                                            'error' : 'inherit'}
                                        >
                                          {new Date(task.dueDate).toLocaleDateString()}
                                        </Typography>
                                      ) : 'Not set'}
                                    </TableCell>
                                    <TableCell align="right">
                                      <ButtonGroup size="small">
                                        <Button
                                          startIcon={<EditIcon />}
                                          onClick={() => editTask(task)}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          startIcon={<CommentIcon />}
                                          onClick={() => {
                                            setSelectedTaskForComments(task);
                                            setCommentDrawerOpen(true);
                                          }}
                                        >
                                          {task.comments && task.comments.length > 0 ? task.comments.length : ''}
                                        </Button>
                                        <Button
                                          startIcon={<ArchiveIcon />}
                                          onClick={() => archiveTask(task.id)}
                                        >
                                          Archive
                                        </Button>
                                        <Button
                                          color="secondary"
                                          startIcon={<DeleteIcon />}
                                          onClick={() => deleteTask(task.id)}
                                        >
                                          Delete
                                        </Button>
                                      </ButtonGroup>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Grid container spacing={2}>
                            {searchedTasks.map(task => (
                              <Grid item key={task.id} xs={12} sm={6} md={4}>
                                <Card sx={{
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  borderLeft: 5,
                                  borderColor: getStatusColor(task.status)
                                }}>
                                  <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                                      <Typography variant="h6" component="div" noWrap sx={{ maxWidth: '70%' }}>
                                        {task.title}
                                      </Typography>
                                      <Box>
                                        <Tooltip title={`Priority: ${task.priority}`}>
                                          <FlagIcon sx={{ color: getPriorityColor(task.priority), fontSize: 18, mr: 0.5 }} />
                                        </Tooltip>
                                        <Chip
                                          label={task.project}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </Box>
                                    </Box>

                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        mb: 2,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                      }}
                                    >
                                      {task.description || "No description provided"}
                                    </Typography>

                                    {task.tags && task.tags.length > 0 && (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                        {task.tags.map(tag => (
                                          <Chip
                                            key={tag}
                                            label={tag}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem' }}
                                          />
                                        ))}
                                      </Box>
                                    )}

                                    <Box sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 0.5,
                                      mb: 1,
                                      fontSize: '0.75rem',
                                      color: 'text.secondary'
                                    }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                        <Typography variant="caption">
                                          Created: {new Date(task.createdAt).toLocaleDateString()}
                                        </Typography>
                                      </Box>

                                      {task.dueDate && (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <CalendarIcon sx={{
                                            fontSize: 16,
                                            mr: 0.5,
                                            color: new Date(task.dueDate) < new Date() && task.status !== "Done" ?
                                              'error.main' : 'inherit'
                                          }} />
                                          <Typography
                                            variant="caption"
                                            color={new Date(task.dueDate) < new Date() && task.status !== "Done" ?
                                              'error' : 'inherit'}
                                          >
                                            Due: {new Date(task.dueDate).toLocaleDateString()}
                                          </Typography>
                                        </Box>
                                      )}

                                      {task.estimatedTime && (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <TimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                          <Typography variant="caption">
                                            Est. Time: {task.estimatedTime} hours
                                          </Typography>
                                        </Box>
                                      )}

                                      {task.comments && task.comments.length > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <CommentIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                          <Typography variant="caption">
                                            {task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>

                                    <Chip
                                      label={task.status}
                                      size="small"
                                      sx={{ bgcolor: getStatusColor(task.status), color: "white" }}
                                    />
                                  </CardContent>

                                  <CardActions>
                                    <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                                      <Select
                                        value={task.status}
                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                        displayEmpty
                                        variant="outlined"
                                      >
                                        <MenuItem value="Todo">To Do</MenuItem>
                                        <MenuItem value="In Progress">In Progress</MenuItem>
                                        <MenuItem value="Done">Done</MenuItem>
                                      </Select>
                                    </FormControl>

                                    <IconButton
                                      onClick={() => {
                                        setSelectedTaskForComments(task);
                                        setCommentDrawerOpen(true);
                                      }}
                                      size="small"
                                      color="primary"
                                    >
                                      <CommentIcon />
                                    </IconButton>

                                    <IconButton
                                      onClick={() => editTask(task)}
                                      size="small"
                                    >
                                      <EditIcon />
                                    </IconButton>

                                    <IconButton
                                      onClick={() => archiveTask(task.id)}
                                      size="small"
                                    >
                                      <ArchiveIcon />
                                    </IconButton>

                                    <IconButton
                                      onClick={() => deleteTask(task.id)}
                                      color="secondary"
                                      size="small"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </CardActions>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Container>

          {/* Project Menu */}
          <Menu
            anchorEl={projectMenuAnchor}
            open={Boolean(projectMenuAnchor)}
            onClose={handleProjectMenuClose}
          >
            <MenuItem onClick={() => {
              setConfirmDialogOpen(true);
            }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
              Delete Project
            </MenuItem>
          </Menu>

          {/* Confirm Delete Dialog */}
          <Dialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
          >
            <DialogTitle>Delete Project</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete "{selectedProject}"? This will remove all tasks associated with this project as well.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmDeleteProject} color="error" autoFocus>
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

          {/* Comment Drawer */}
          <SwipeableDrawer
            anchor="right"
            open={commentDrawerOpen}
            onClose={() => setCommentDrawerOpen(false)}
            onOpen={() => { }}
            sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400 } } }}
          >
            {selectedTaskForComments && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Comments - {selectedTaskForComments.title}
                </Typography>

                <Box component="form" onSubmit={addComment} sx={{ mb: 3, display: 'flex' }}>
                  <TextField
                    label="Add a comment"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    multiline
                    rows={2}
                    fullWidth
                    sx={{ mr: 1 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!commentText.trim()}
                    sx={{ minWidth: 'auto', alignSelf: 'flex-end' }}
                  >
                    <AddCommentIcon />
                  </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {selectedTaskForComments.comments && selectedTaskForComments.comments.length > 0 ? (
                  <List>
                    {selectedTaskForComments.comments.map(comment => (
                      <ListItem key={comment.id} divider>
                        <ListItemText
                          primary={comment.text}
                          secondary={new Date(comment.createdAt).toLocaleString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="textSecondary" align="center" sx={{ my: 4 }}>
                    No comments yet. Add the first comment!
                  </Typography>
                )}
              </Box>
            )}
          </SwipeableDrawer>

          {/* Speed Dial for quick actions */}
          <SpeedDial
            ariaLabel="quick actions"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            icon={<SpeedDialIcon />}
          >
            <SpeedDialAction
              icon={<AddIcon />}
              tooltipTitle="Add Task"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth"
                });
              }}
            />
            <SpeedDialAction
              icon={<RefreshIcon />}
              tooltipTitle="Clear Filters"
              onClick={() => setFilter({ status: "all", project: "all", priority: "all" })}
            />
            <SpeedDialAction
              icon={<DashboardIcon />}
              tooltipTitle="Dashboard"
              onClick={() => setActivePage('dashboard')}
            />
          </SpeedDial>

          {/* Bottom Navigation for mobile */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
            <Paper elevation={3}>
              <BottomNavigation
                value={activePage}
                onChange={(event, newValue) => {
                  setActivePage(newValue);
                }}
              >
                <BottomNavigationAction label="Tasks" value="tasks" icon={<ListAltIcon />} />
                <BottomNavigationAction label="Dashboard" value="dashboard" icon={<DashboardIcon />} />
                <BottomNavigationAction
                  label="Archived"
                  value="archived"
                  icon={<ArchiveIcon />}
                  disabled={archivedTasks.length === 0}
                />
              </BottomNavigation>
            </Paper>
          </Box>

        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}



