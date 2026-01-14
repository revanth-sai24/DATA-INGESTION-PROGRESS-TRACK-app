"use client";
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateTask, deleteTask } from '../redux/slices/taskSlice';
import {
  Edit as EditIcon, 
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Archive as ArchiveIcon,
  Assignment as TaskIcon,
  Schedule as CalendarIcon,
  Flag as PriorityIcon
} from '@mui/icons-material';

export default function TaskList({ activePage, filter, onEditTask }) {
  const dispatch = useDispatch();
  const { tasks, projects } = useSelector((state) => state.tasks);
  const [selectedTasks, setSelectedTasks] = useState([]);

  // Filter tasks based on the current page and filters
  const getFilteredTasks = () => {
    let filteredTasks = tasks;

    // Filter by page type
    if (activePage === 'tasks') {
      filteredTasks = tasks.filter(task => task.status !== 'archived');
    } else if (activePage === 'archived') {
      filteredTasks = tasks.filter(task => task.status === 'archived');
    }

    // Apply additional filters
    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.project?.toLowerCase().includes(search)
      );
    }

    if (filter?.status && filter.status !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filter.status);
    }

    if (filter?.priority && filter.priority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
    }

    if (filter?.project && filter.project !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.project === filter.project);
    }

    return filteredTasks;
  };

  const filteredTasks = getFilteredTasks();

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      dispatch(updateTask({ ...task, status: newStatus, updatedAt: new Date().toISOString() }));
    }
  };

  const handleArchive = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      dispatch(updateTask({ 
        ...task, 
        status: 'archived', 
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      }));
    }
  };

  const handleDelete = (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(taskId));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'todo': return 'text-gray-600 bg-gray-50';
      case 'on-hold': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="premium-card text-center py-12">
        <TaskIcon className="mx-auto text-gray-400 mb-4" style={{ fontSize: 64 }} />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
        </h3>
        <p className="text-gray-500">
          {tasks.length === 0 
            ? 'Create your first task to get started'
            : 'Try adjusting your search or filter criteria'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tasks Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {activePage === 'archived' ? 'Archived Tasks' : 'Tasks'}
          <span className="ml-2 text-sm text-gray-500">({filteredTasks.length})</span>
        </h2>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div key={task.id} className="premium-card hover:shadow-lg transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority || 'medium'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status || 'todo'}
                  </span>
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {task.project && (
                    <div className="flex items-center gap-1">
                      <TaskIcon fontSize="small" />
                      <span>{task.project}</span>
                    </div>
                  )}
                  
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon fontSize="small" />
                      <span>Due {formatDate(task.dueDate)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <span>Created {formatDate(task.createdAt)}</span>
                  </div>
                </div>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {task.status !== 'archived' && (
                  <>
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Task"
                    >
                      <EditIcon fontSize="small" />
                    </button>
                    
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'completed')}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark Complete"
                      >
                        ✓
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleArchive(task.id)}
                      className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Archive"
                    >
                      <ArchiveIcon fontSize="small" />
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <DeleteIcon fontSize="small" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
