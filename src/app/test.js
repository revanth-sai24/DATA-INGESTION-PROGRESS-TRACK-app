"use client";
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
  Archive as ArchiveIcon
} from "@mui/icons-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';



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

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filter.status === "all" || task.status === filter.status;
    const projectMatch = filter.project === "all" || task.project === filter.project;
    const priorityMatch = filter.priority === "all" || task.priority === filter.priority;
    return statusMatch && projectMatch && priorityMatch;
  });

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

          <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1, display: "flex" }}>
            <Grid container spacing={3}>
              {/* Sidebar */}
              <Grid item xs={12} md={3}>
                <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Projects
                  </Typography>

                  <Box component="form" onSubmit={addProject} sx={{ display: "flex", mb: 2 }}>
                    <TextField
                      size="small"
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      placeholder="New project name"
                      fullWidth
                      sx={{ mr: 1 }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<AddIcon />}
                      size="small"
                    >
                      Add
                    </Button>
                  </Box>

                  <List sx={{ bgcolor: "background.paper" }}>
                    <ListItem
                      button
                      selected={filter.project === "all"}
                      onClick={() => setFilter({ ...filter, project: "all" })}
                    >
                      <ListItemText
                        primary="All Projects"
                        secondary={`${tasks.length} tasks`}
                      />
                    </ListItem>
                    {projects.map(project => {
                      const projectTasks = tasks.filter(task => task.project === project);
                      const progress = getProjectProgress(project);

                      return (
                        <ListItem
                          key={project}
                          button
                          selected={filter.project === project}
                          onClick={() => setFilter({ ...filter, project: project })}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="project-menu"
                              onClick={(e) => handleProjectMenuOpen(e, project)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={project}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <Typography variant="caption">{projectTasks.length} tasks</Typography>
                                  <Typography variant="caption">{Math.round(progress)}%</Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={progress}
                                  sx={{ width: '100%', mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Filter by Status
                  </Typography>

                  <Tabs
                    value={statusTabValue}
                    onChange={handleStatusTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab label="All" />
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Badge
                            badgeContent={tasks.filter(t => t.status === "Todo").length}
                            color="error"
                            sx={{ mr: 1 }}
                          >
                            <span>To Do</span>
                          </Badge>
                        </Box>
                      }
                    />
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Badge
                            badgeContent={tasks.filter(t => t.status === "In Progress").length}
                            color="primary"
                            sx={{ mr: 1 }}
                          >
                            <span>In Progress</span>
                          </Badge>
                        </Box>
                      }
                    />
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Badge
                            badgeContent={tasks.filter(t => t.status === "Done").length}
                            color="success"
                            sx={{ mr: 1 }}
                          >
                            <span>Done</span>
                          </Badge>
                        </Box>
                      }
                    />
                  </Tabs>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Filter by Priority
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip
                      label="All"
                      onClick={() => setFilter({ ...filter, priority: "all" })}
                      color={filter.priority === "all" ? "primary" : "default"}
                      sx={{ flex: 1, mr: 0.5 }}
                    />
                    <Chip
                      label="High"
                      onClick={() => setFilter({ ...filter, priority: "High" })}
                      color={filter.priority === "High" ? "primary" : "default"}
                      sx={{
                        flex: 1,
                        mr: 0.5,
                        bgcolor: filter.priority === "High" ? null : "rgba(255, 86, 48, 0.1)",
                        borderColor: theme.palette.priority.high
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Chip
                      label="Medium"
                      onClick={() => setFilter({ ...filter, priority: "Medium" })}
                      color={filter.priority === "Medium" ? "primary" : "default"}
                      sx={{
                        flex: 1,
                        mr: 0.5,
                        bgcolor: filter.priority === "Medium" ? null : "rgba(255, 171, 0, 0.1)",
                        borderColor: theme.palette.priority.medium
                      }}
                    />
                    <Chip
                      label="Low"
                      onClick={() => setFilter({ ...filter, priority: "Low" })}
                      color={filter.priority === "Low" ? "primary" : "default"}
                      sx={{
                        flex: 1,
                        bgcolor: filter.priority === "Low" ? null : "rgba(101, 84, 192, 0.1)",
                        borderColor: theme.palette.priority.low
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Main Content */}
              <Grid item xs={12} md={9}>
                <Grid container spacing={3}>
                  {/* Add Task Form */}
                  <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        {editMode ? "Edit Task" : "Add New Task"}
                      </Typography>

                      <Box component="form" onSubmit={addTask}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              label="Task Title"
                              value={newTask.title}
                              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                              fullWidth
                              required
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <TextField
                              label="Task Description"
                              value={newTask.description}
                              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                              multiline
                              rows={3}
                              fullWidth
                            />
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                              <InputLabel>Status</InputLabel>
                              <Select
                                value={newTask.status}
                                label="Status"
                                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                              >
                                <MenuItem value="Todo">To Do</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Done">Done</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth required error={!newTask.project}>
                              <InputLabel>Project</InputLabel>
                              <Select
                                value={newTask.project}
                                label="Project"
                                onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                                displayEmpty
                              >
                                {projects.length === 0 ? (
                                  <MenuItem value="" disabled>
                                    No projects available. Create one first.
                                  </MenuItem>
                                ) : (
                                  projects.map(project => (
                                    <MenuItem key={project} value={project}>
                                      {project}
                                    </MenuItem>
                                  ))
                                )}
                              </Select>
                              {projects.length === 0 && (
                                <FormHelperText>Add a project first</FormHelperText>
                              )}
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                              <InputLabel>Priority</InputLabel>
                              <Select
                                value={newTask.priority}
                                label="Priority"
                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                              >
                                <MenuItem value="High">
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <FlagIcon sx={{ color: theme.palette.priority.high, mr: 1 }} />
                                    High
                                  </Box>
                                </MenuItem>
                                <MenuItem value="Medium">
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <FlagIcon sx={{ color: theme.palette.priority.medium, mr: 1 }} />
                                    Medium
                                  </Box>
                                </MenuItem>
                                <MenuItem value="Low">
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <FlagIcon sx={{ color: theme.palette.priority.low, mr: 1 }} />
                                    Low
                                  </Box>
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <DatePicker
                              label="Due Date"
                              value={newTask.dueDate}
                              onChange={(date) => setNewTask({ ...newTask, dueDate: date })}
                              renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Estimated Time (hours)"
                              value={newTask.estimatedTime}
                              onChange={(e) => setNewTask({ ...newTask, estimatedTime: e.target.value })}
                              type="number"
                              inputProps={{ min: 0, step: 0.5 }}
                              fullWidth
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                              <TextField
                                label="Add Tags"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                fullWidth
                                sx={{ mr: 1 }}
                              />
                              <Button
                                variant="outlined"
                                onClick={addTagToTask}
                                disabled={!newTag.trim()}
                              >
                                Add
                              </Button>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              {newTask.tags.map(tag => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  onDelete={() => removeTagFromTask(tag)}
                                />
                              ))}
                            </Box>
                          </Grid>

                          <Grid item xs={12}>
                            <Button
                              type="submit"
                              variant="contained"
                              startIcon={editMode ? <EditIcon /> : <AddIcon />}
                              disabled={!newTask.title || !newTask.project}
                              fullWidth
                            >
                              {editMode ? "Update Task" : "Add Task"}
                            </Button>

                            {editMode && (
                              <Button
                                variant="outlined"
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
                                fullWidth
                                sx={{ mt: 1 }}
                              >
                                Cancel Editing
                              </Button>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Task List */}
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

                        <IconButton
                          onClick={() => setFilter({ status: "all", project: "all", priority: "all" })}
                          title="Clear filters"
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Box>

                      {filteredTasks.length === 0 ? (
                        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#f5f5f5" }}>
                          <Typography color="textSecondary">
                            No tasks found. Add some tasks to get started!
                          </Typography>
                        </Paper>
                      ) : (
                        <Grid container spacing={2}>
                          {filteredTasks.map(task => (
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

                                  <Button
                                    startIcon={<EditIcon />}
                                    size="small"
                                    onClick={() => editTask(task)}
                                    sx={{ mr: 1 }}
                                  >
                                    Edit
                                  </Button>

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
                Are you sure you want to delete &quot;{selectedProject}&quot;? This will remove all tasks associated with this project as well.
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
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}