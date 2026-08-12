"use client";
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addTask, updateTask } from '../redux/slices/taskSlice';
import { Close as CloseIcon, Add as PlusIcon } from '@mui/icons-material';
import DocumentManager from './DocumentManager';

export default function TaskForm({ editingTask, onClose, projects }) {
  const dispatch = useDispatch();
  
  // Helper function to format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // Helper function to safely parse arrays from string or return array
  const safeParseArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return [];
  };
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    tags: [],
    workingFor: '',
    workingWith: '',
    checkpoints: [],
    documents: []
  });

  // Update form data when editingTask changes
  useEffect(() => {
    if (editingTask) {
      console.log('📝 Updating form with task data:', editingTask);
      setFormData({
        title: editingTask.title || '',
        description: editingTask.description || '',
        project: editingTask.project || '',
        priority: editingTask.priority || 'medium',
        status: editingTask.status || 'todo',
        dueDate: formatDateForInput(editingTask.dueDate),
        tags: safeParseArray(editingTask.tags),
        workingFor: editingTask.workingFor || '',
        workingWith: editingTask.workingWith || '',
        checkpoints: safeParseArray(editingTask.checkpoints),
        documents: safeParseArray(editingTask.documents)
      });
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        project: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        tags: [],
        workingFor: '',
        workingWith: '',
        checkpoints: [],
        documents: []
      });
    }
  }, [editingTask]);

  const [newTag, setNewTag] = useState('');
  const [newCheckpoint, setNewCheckpoint] = useState('');

  const addCheckpoint = () => {
    if (newCheckpoint.trim()) {
      setFormData({
        ...formData,
        checkpoints: [...formData.checkpoints, {
          id: Date.now(),
          text: newCheckpoint.trim(),
          completed: false,
          createdAt: new Date().toISOString()
        }]
      });
      setNewCheckpoint('');
    }
  };

  const removeCheckpoint = (checkpointId) => {
    setFormData({
      ...formData,
      checkpoints: formData.checkpoints.filter(cp => cp.id !== checkpointId)
    });
  };

  const toggleCheckpoint = (checkpointId) => {
    setFormData({
      ...formData,
      checkpoints: formData.checkpoints.map(cp => 
        cp.id === checkpointId ? { ...cp, completed: !cp.completed } : cp
      )
    });
  };

  const handleDocumentsChange = (documents) => {
    setFormData({
      ...formData,
      documents: documents
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Properly format the due date
    const formattedDueDate = formData.dueDate 
      ? new Date(formData.dueDate + 'T00:00:00.000Z').toISOString()
      : '';

    const taskData = {
      ...formData,
      id: editingTask?.id || `task-${Date.now()}`,
      dueDate: formattedDueDate,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeTracking: editingTask?.timeTracking || { totalTime: 0, isRunning: false },
      // Ensure arrays are properly formatted
      tags: Array.isArray(formData.tags) ? formData.tags : [],
      checkpoints: Array.isArray(formData.checkpoints) ? formData.checkpoints : [],
      documents: Array.isArray(formData.documents) ? formData.documents : []
    };

    if (editingTask) {
      dispatch(updateTask(taskData));
    } else {
      dispatch(addTask(taskData));
    }
    
    onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ 
        ...formData, 
        tags: [...formData.tags, newTag.trim()] 
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-[rgb(13_17_23/0.55)] backdrop-blur-[2px] p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg sm:max-h-[90dvh] sm:rounded-xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-[var(--fg)]">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CloseIcon className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              placeholder="Enter task title..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              placeholder="Describe the task..."
            />
          </div>

          {/* Project and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Project
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  placeholder="Type project name or select from existing..."
                  list="project-options"
                />
                <datalist id="project-options">
                  {projects.map((project) => (
                    <option key={project.id || project.name || project} value={project.name || project} />
                  ))}
                </datalist>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You can type any project name or select from existing projects
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Status and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On hold</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn-primary text-sm"
              >
                <PlusIcon fontSize="small" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Working For and Working With */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Working For
              </label>
              <input
                type="text"
                value={formData.workingFor || ''}
                onChange={(e) => setFormData({ ...formData, workingFor: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Who is this task for?"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Working With
              </label>
              <input
                type="text"
                value={formData.workingWith || ''}
                onChange={(e) => setFormData({ ...formData, workingWith: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Who are you working with?"
              />
            </div>
          </div>

          {/* Checkpoints Section */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
              Checkpoints
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Add checkpoints to track progress and validate task completion
            </p>
            
            {/* Add New Checkpoint */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCheckpoint}
                onChange={(e) => setNewCheckpoint(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCheckpoint())}
                className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Add a checkpoint (e.g., Setup database connection)"
              />
              <button
                type="button"
                onClick={addCheckpoint}
                disabled={!newCheckpoint.trim()}
                className="btn-primary text-sm"
              >
                <PlusIcon fontSize="small" />
              </button>
            </div>

            {/* Checkpoint List */}
            {formData.checkpoints && formData.checkpoints.length > 0 && (
              <div className="border border-gray-200 rounded-lg">
                <div className="max-h-48 overflow-y-auto">
                  {formData.checkpoints.map((checkpoint, index) => (
                    <div
                      key={checkpoint.id}
                      className={`flex items-center gap-3 p-3 ${index < formData.checkpoints.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50`}
                    >
                      <input
                        type="checkbox"
                        checked={checkpoint.completed}
                        onChange={() => toggleCheckpoint(checkpoint.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`flex-1 text-sm ${checkpoint.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                        {checkpoint.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCheckpoint(checkpoint.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove checkpoint"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Checkpoint Progress */}
                <div className="p-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                  Progress: {formData.checkpoints.filter(cp => cp.completed).length} / {formData.checkpoints.length} completed
                  ({Math.round((formData.checkpoints.filter(cp => cp.completed).length / formData.checkpoints.length) * 100)}%)
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(formData.checkpoints.filter(cp => cp.completed).length / formData.checkpoints.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              Documents
            </h4>
            <p className="text-xs text-gray-600">
              Attach files or add links for additional context and resources
            </p>
            
            <DocumentManager
              documents={formData.documents || []}
              onDocumentsChange={handleDocumentsChange}
              darkMode={false}
              maxFiles={10}
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-sm"
            >
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
