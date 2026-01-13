"use client";
import React from 'react';
import { Paper, Grid, FormControl, InputLabel, Select, MenuItem, Button, Box } from '@mui/material';
import { FilterList as FilterListIcon } from '@mui/icons-material';

export default function Filters({ filter, setFilter, projects, clearFilters }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filter.status}
              label="Filter by Status"
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Todo">Todo</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Priority</InputLabel>
            <Select
              value={filter.priority}
              label="Filter by Priority"
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Project</InputLabel>
            <Select
              value={filter.project}
              label="Filter by Project"
              onChange={(e) => setFilter({ ...filter, project: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {projects.map((project) => (
                <MenuItem key={project} value={project}>
                  {project}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
