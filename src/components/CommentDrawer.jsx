"use client";
import React from 'react';
import {
  SwipeableDrawer, Box, Typography, TextField, Button, Divider, List,
  ListItem, ListItemText
} from '@mui/material';
import { AddComment as AddCommentIcon } from '@mui/icons-material';
import { format } from 'date-fns';

export default function CommentDrawer({
  open,
  onClose,
  selectedTask,
  commentText,
  setCommentText,
  addComment
}) {
  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400 } } }}
    >
      {selectedTask && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Comments - {selectedTask.title}
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
            >
              <AddCommentIcon />
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {selectedTask.comments?.length > 0 ? (
            <List>
              {selectedTask.comments.map(comment => (
                <ListItem key={comment.id} divider>
                  <ListItemText
                    primary={comment.text}
                    secondary={format(new Date(comment.createdAt), 'PPpp')}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="textSecondary" align="center" sx={{ my: 4 }}>
              No comments yet
            </Typography>
          )}
        </Box>
      )}
    </SwipeableDrawer>
  );
}
