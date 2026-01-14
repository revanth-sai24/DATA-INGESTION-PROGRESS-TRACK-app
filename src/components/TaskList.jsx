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
  Flag as PriorityIcon,
  ViewModule as CardViewIcon,
  ViewList as TableViewIcon
} from '@mui/icons-material';

export default function TaskList({ activePage, filter, onEditTask }) {
  const dispatch = useDispatch();
  const { tasks, projects } = useSelector((state) => state.tasks);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'card' or 'table'

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
    <div className="space-y-6">
      {/* Tasks Header with View Toggle */}
      <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {activePage === 'archived' ? 'Archived Tasks' : 'Tasks'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
          </p>
        </div>
        
        {/* View Toggle Buttons */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'card' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
            title="Card View"
          >
            <CardViewIcon fontSize="small" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'table' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
            title="Table View"
          >
            <TableViewIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Tasks Content */}
      {filteredTasks.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-white rounded-lg">
          <TaskIcon className="mx-auto text-gray-400 mb-4" style={{ fontSize: 64 }} />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-6">
            {activePage === 'archived' 
              ? 'No archived tasks to display' 
              : 'Create your first task to get started'
            }
          </p>
          {activePage !== 'archived' && (
            <button 
              onClick={() => window.location.href = '#create-task'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Task
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        /* Card View */
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

                    {task.workingFor && (
                      <div className="flex items-center gap-1">
                        <span>👤 For: {task.workingFor}</span>
                      </div>
                    )}

                    {task.workingWith && (
                      <div className="flex items-center gap-1">
                        <span>🤝 With: {task.workingWith}</span>
                      </div>
                    )}
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
      ) : (
        /* Table View */
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Working For
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Working With
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {task.project || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority || 'medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status || 'todo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {task.workingFor || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {task.workingWith || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {task.dueDate ? formatDate(task.dueDate) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {task.status !== 'archived' && (
                          <>
                            <button
                              onClick={() => onEditTask(task)}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </button>
                            {task.status !== 'completed' && (
                              <button
                                onClick={() => handleStatusChange(task.id, 'completed')}
                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                title="Complete"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={() => handleArchive(task.id)}
                              className="p-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                              title="Archive"
                            >
                              <ArchiveIcon fontSize="small" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
