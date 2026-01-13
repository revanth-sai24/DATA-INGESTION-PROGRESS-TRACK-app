"use client";
import React from 'react';
import {
  Paper, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem, Chip, Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';

export default function TaskForm({
  formData,
  setFormData,
  editingTask,
  handleSubmit,
  projects
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 4,
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={12} md={6}>
            <TextField
              fullWidth
              required
              label="📝 Task Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </Grid>

          <Grid size={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>📁 Project</InputLabel>
              <Select
                value={formData.project}
                label="📁 Project"
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project} value={project}>
                    {project}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="📄 Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>

          <Grid size={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>🎯 Priority</InputLabel>
              <Select
                value={formData.priority}
                label="🎯 Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>📊 Status</InputLabel>
              <Select
                value={formData.status}
                label="📊 Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Todo">Todo</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Done">Done</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12} md={4}>
            <DatePicker
              label="📅 Due Date"
              value={formData.dueDate}
              onChange={(date) => setFormData({ ...formData, dueDate: date })}
              slotProps={{
                textField: { fullWidth: true }
              }}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="🏷️ Tags (comma separated)"
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
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {formData.tags.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" />
                ))}
              </Box>
            )}
          </Grid>

          <Grid size={12}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              startIcon={editingTask ? <EditIcon /> : <AddIcon />}
              sx={{ borderRadius: 2, py: 1.5 }}
            >
              {editingTask ? 'Update Task' : 'Add Task'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
