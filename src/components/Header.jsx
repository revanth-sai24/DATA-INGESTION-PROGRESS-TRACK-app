"use client";
import React from 'react';
import {
  Box, Typography, TextField, IconButton, ButtonGroup, Tooltip, Toolbar, Chip
} from '@mui/material';
import {
  Search as SearchIcon, ViewList as ViewListIcon, ViewModule as ViewModuleIcon,
  Undo as UndoIcon, Redo as RedoIcon, Delete as DeleteIcon, Archive as ArchiveIcon
} from '@mui/icons-material';

export default function Header({
  title = "Tasks",
  description = "Manage your tasks efficiently",
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  historyIndex,
  setHistoryIndex,
  history,
  selectedTasks,
  bulkArchive,
  bulkDelete
}) {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Page Title and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Search Bar */}
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              sx: { borderRadius: 2 }
            }}
          />

          {/* View Toggle */}
          <ButtonGroup>
            <Tooltip title="List View">
              <IconButton
                size="small"
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
              >
                <ViewListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Card View">
              <IconButton
                size="small"
                onClick={() => setViewMode('card')}
                color={viewMode === 'card' ? 'primary' : 'default'}
              >
                <ViewModuleIcon />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          {/* Undo/Redo */}
          <ButtonGroup>
            <Tooltip title="Undo">
              <span>
                <IconButton
                  size="small"
                  onClick={() => setHistoryIndex(historyIndex - 1)}
                  disabled={historyIndex <= 0}
                >
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo">
              <span>
                <IconButton
                  size="small"
                  onClick={() => setHistoryIndex(historyIndex + 1)}
                  disabled={historyIndex >= history.length - 1}
                >
                  <RedoIcon />
                </IconButton>
              </span>
            </Tooltip>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Bulk Actions Toolbar */}
      {selectedTasks.length > 0 && (
        <Box
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="body1" fontWeight="medium">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Archive Selected">
              <IconButton size="small" onClick={bulkArchive} sx={{ color: 'white' }}>
                <ArchiveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Selected">
              <IconButton size="small" onClick={bulkDelete} sx={{ color: 'white' }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  );
}
