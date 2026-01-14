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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task title..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the task..."
            />
          </div>

          {/* Project and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>
          </div>

          {/* Status and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todo">📋 To Do</option>
                <option value="in-progress">⚡ In Progress</option>
                <option value="completed">✅ Completed</option>
                <option value="on-hold">⏸️ On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working For
              </label>
              <input
                type="text"
                value={formData.workingFor || ''}
                onChange={(e) => setFormData({ ...formData, workingFor: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Who is this task for?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working With
              </label>
              <input
                type="text"
                value={formData.workingWith || ''}
                onChange={(e) => setFormData({ ...formData, workingWith: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Who are you working with?"
              />
            </div>
          </div>

          {/* Checkpoints Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ✅ Task Checkpoints
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a checkpoint (e.g., Setup database connection)"
              />
              <button
                type="button"
                onClick={addCheckpoint}
                disabled={!newCheckpoint.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
              📎 Documents
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
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
