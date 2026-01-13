"use client";
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  Grid, Card, CardContent, CardActions, Paper, Checkbox, Chip, IconButton,
  ButtonGroup, Badge, Box, Typography, FormControl, Select, MenuItem, LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon, Comment as CommentIcon, Archive as ArchiveIcon,
  Delete as DeleteIcon, PlayArrow as PlayArrowIcon, Stop as StopIcon,
  CalendarToday as CalendarIcon, AccessTime as TimeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function TaskList({
  viewMode,
  searchedTasks,
  selectedTasks,
  setSelectedTasks,
  sortConfig,
  setSortConfig,
  updateTaskStatus,
  formatTime,
  toggleTimeTracking,
  editTask,
  setSelectedTaskForComments,
  setCommentDrawerOpen,
  archiveTask,
  deleteTask,
  getPriorityColor,
  getStatusColor
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}
    >
      {viewMode === 'list' ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedTasks.length === searchedTasks.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks(searchedTasks.map(t => t.id));
                      } else {
                        setSelectedTasks([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'title'}
                    direction={sortConfig.direction}
                    onClick={() => {
                      setSortConfig({
                        key: 'title',
                        direction: sortConfig.key === 'title' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                      });
                    }}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {searchedTasks.map(task => (
                <TableRow key={task.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTasks([...selectedTasks, task.id]);
                        } else {
                          setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>
                    <Chip label={task.project || 'None'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      size="small"
                      sx={{ bgcolor: getPriorityColor(task.priority), color: 'white' }}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      >
                        <MenuItem value="Todo">Todo</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Done">Done</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption">
                        {formatTime(task.timeTracking?.elapsed || 0)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => toggleTimeTracking(task.id)}
                        color={task.timeTracking?.isRunning ? 'error' : 'success'}
                      >
                        {task.timeTracking?.isRunning ? <StopIcon /> : <PlayArrowIcon />}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <ButtonGroup size="small">
                      <IconButton onClick={() => editTask(task)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setSelectedTaskForComments(task);
                          setCommentDrawerOpen(true);
                        }}
                      >
                        <Badge badgeContent={task.comments?.length || 0} color="primary">
                          <CommentIcon />
                        </Badge>
                      </IconButton>
                      <IconButton onClick={() => archiveTask(task.id)}>
                        <ArchiveIcon />
                      </IconButton>
                      <IconButton onClick={() => deleteTask(task.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </ButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={3} sx={{ p: 3 }}>
          {searchedTasks.map(task => (
            <Grid key={task.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderLeft: 6,
                  borderColor: getStatusColor(task.status),
                  position: 'relative',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)'
                    : 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
                  boxShadow: 'none'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTasks([...selectedTasks, task.id]);
                        } else {
                          setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                        }
                      }}
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    {task.title}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={task.priority}
                      size="small"
                      sx={{ bgcolor: getPriorityColor(task.priority), color: 'white', fontWeight: 600 }}
                    />
                    {task.project && (
                      <Chip label={task.project} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {task.description || "No description"}
                  </Typography>

                  {task.tags?.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                      {task.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="soft" sx={{ bgcolor: '#eef2ff', color: '#1f2937' }} />
                      ))}
                    </Box>
                  )}

                  {task.dueDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <CalendarIcon fontSize="small" />
                      <Typography variant="caption">
                        Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                    <TimeIcon fontSize="small" />
                    <Typography variant="caption">
                      {formatTime(task.timeTracking?.elapsed || 0)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleTimeTracking(task.id)}
                      color={task.timeTracking?.isRunning ? 'error' : 'success'}
                    >
                      {task.timeTracking?.isRunning ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                    </IconButton>
                  </Box>

                  {task.subtasks && task.subtasks.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Subtasks: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    >
                      <MenuItem value="Todo">Todo</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Done">Done</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton onClick={() => editTask(task)} size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedTaskForComments(task);
                        setCommentDrawerOpen(true);
                      }}
                      size="small"
                    >
                      <Badge badgeContent={task.comments?.length || 0} color="primary">
                        <CommentIcon />
                      </Badge>
                    </IconButton>
                    <IconButton onClick={() => archiveTask(task.id)} size="small">
                      <ArchiveIcon />
                    </IconButton>
                    <IconButton onClick={() => deleteTask(task.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
}
