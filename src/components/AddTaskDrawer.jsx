"use client";
import React from 'react';
import {
  SwipeableDrawer, Box, Typography, TextField, Button, FormControl, InputLabel, 
  Select, MenuItem, Chip, Grid, IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Add as AddIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';

export default function AddTaskDrawer({
  open,
  onClose,
  formData,
  setFormData,
  editingTask,
  handleSubmit,
  projects
}) {
  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 600 } } }}
    >
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="bold">
            {editingTask ? '✏️ Edit Task' : '➕ Add New Task'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Task Title */}
            <Grid size={12}>
              <TextField
                fullWidth
                required
                label="Task Title"
                placeholder="Enter task title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '1.1rem',
                    padding: '4px',
                  }
                }}
              />
            </Grid>

            {/* Description */}
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                placeholder="Describe the task in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            {/* Project */}
            <Grid size={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={formData.project}
                  label="Project"
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                >
                  <MenuItem value="">
                    <em>No Project</em>
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project} value={project}>
                      {project}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Priority */}
            <Grid size={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="High">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🔴 High Priority
                    </Box>
                  </MenuItem>
                  <MenuItem value="Medium">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🟡 Medium Priority
                    </Box>
                  </MenuItem>
                  <MenuItem value="Low">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🟢 Low Priority
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid size={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Todo">📋 Todo</MenuItem>
                  <MenuItem value="In Progress">⚡ In Progress</MenuItem>
                  <MenuItem value="Done">✅ Done</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Due Date */}
            <Grid size={12} sm={6}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={(date) => setFormData({ ...formData, dueDate: date })}
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </Grid>

            {/* Tags */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                placeholder="e.g., design, urgent, frontend"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })
                }
                helperText="Separate tags with commas"
              />
              {formData.tags && formData.tags.length > 0 && (
                <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              )}
            </Grid>

            {/* Estimated Time */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Estimated Time"
                placeholder="e.g., 4 hours, 2 days"
                value={formData.estimatedTime || ''}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
              />
            </Grid>

            {/* Submit Button */}
            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                startIcon={editingTask ? <EditIcon /> : <AddIcon />}
                sx={{ 
                  py: 1.5, 
                  fontSize: '1.1rem',
                  mt: 2
                }}
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </SwipeableDrawer>
  );
}
