"use client";
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Archive as ArchiveIcon,
  Unarchive as RestoreIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  Schedule as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { updateTask, deleteTask } from '../redux/slices/taskSlice';

export default function ArchivedTasks() {
  const dispatch = useDispatch();
  const { tasks, projects } = useSelector((state) => state.tasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [sortBy, setSortBy] = useState('archivedDate'); // archivedDate, title, project

  // Filter archived tasks
  const archivedTasks = tasks.filter(task => task.status === 'archived');
  
  const filteredTasks = archivedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !filterProject || task.project === filterProject;
    return matchesSearch && matchesProject;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'project':
        return (a.project || '').localeCompare(b.project || '');
      case 'archivedDate':
      default:
        return new Date(b.archivedAt || b.updatedAt) - new Date(a.archivedAt || a.updatedAt);
    }
  });

  const handleRestore = (task) => {
    const restoredTask = {
      ...task,
      status: 'todo',
      archivedAt: null,
      updatedAt: new Date().toISOString()
    };
    dispatch(updateTask(restoredTask));
  };

  const handlePermanentDelete = (taskId) => {
    if (confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      dispatch(deleteTask(taskId));
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Archived Tasks</h1>
          <p className="text-gray-600 mt-1">
            {archivedTasks.length} archived task{archivedTasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="premium-card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fontSize="small" />
            <input
              type="text"
              placeholder="Search archived tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Project Filter */}
          <div className="min-w-[200px]">
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map((project, index) => {
                const projectName = typeof project === 'string' ? project : project.name;
                return (
                  <option key={index} value={projectName}>
                    {projectName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort By */}
          <div className="min-w-[180px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="archivedDate">Sort by Archived Date</option>
              <option value="title">Sort by Title</option>
              <option value="project">Sort by Project</option>
            </select>
          </div>
        </div>
      </div>

      {/* Archived Tasks List */}
      {sortedTasks.length > 0 ? (
        <div className="space-y-4">
          {sortedTasks.map((task) => (
            <div key={task.id} className="premium-card hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-700 truncate">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityIcon(task.priority)} {task.priority || 'medium'}
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
                    
                    <div className="flex items-center gap-1">
                      <ArchiveIcon fontSize="small" />
                      <span>Archived {formatDate(task.archivedAt || task.updatedAt)}</span>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon fontSize="small" />
                        <span>Due {formatDate(task.dueDate)}</span>
                      </div>
                    )}

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
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleRestore(task)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Restore Task"
                  >
                    <RestoreIcon fontSize="small" />
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(task.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Permanently"
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <ArchiveIcon className="mx-auto text-gray-400 mb-4" style={{ fontSize: 64 }} />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {archivedTasks.length === 0 ? 'No archived tasks' : 'No tasks match your filters'}
          </h3>
          <p className="text-gray-500 mb-6">
            {archivedTasks.length === 0 
              ? 'Tasks you archive will appear here for future reference'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {searchTerm || filterProject ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterProject('');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      )}

      {/* Footer Stats */}
      {archivedTasks.length > 0 && (
        <div className="premium-card p-4">
          <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-gray-600">
            <span>
              Showing {sortedTasks.length} of {archivedTasks.length} archived tasks
            </span>
            <span>
              Total space used by archived tasks: ~{Math.round(JSON.stringify(archivedTasks).length / 1024)} KB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}