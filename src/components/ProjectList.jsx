"use client";
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addProject, updateProject, deleteProject } from '../redux/slices/taskSlice';
import { 
  Folder as ProjectIcon, 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  Schedule as CalendarIcon,
  ViewModule as CardViewIcon,
  ViewList as TableViewIcon
} from '@mui/icons-material';

export default function ProjectList({ setActivePage, setFilter, darkMode }) {
  const dispatch = useDispatch();
  const { tasks, projects } = useSelector((state) => state.tasks);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    status: 'active'
  });

  // Calculate project stats
  const getProjectStats = (projectName) => {
    const projectTasks = tasks.filter(task => task.project === projectName);
    return {
      total: projectTasks.length,
      completed: projectTasks.filter(task => task.status === 'completed').length,
      inProgress: projectTasks.filter(task => task.status === 'in-progress').length,
      todo: projectTasks.filter(task => task.status === 'todo').length
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const projectData = {
      ...formData,
      id: editingProject?.id || Date.now().toString(),
      createdAt: editingProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingProject) {
      dispatch(updateProject(projectData));
    } else {
      dispatch(addProject(projectData));
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3B82F6', status: 'active' });
    setEditingProject(null);
    setShowForm(false);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData(project);
    setShowForm(true);
  };

  const handleDelete = (projectName) => {
    if (confirm(`Are you sure you want to delete the project "${projectName}"? This will remove the project from all tasks.`)) {
      dispatch(deleteProject(projectName));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Projects</h1>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Manage your project collections</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-1`}>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'card' 
                  ? `${darkMode ? 'bg-gray-600 text-blue-400' : 'bg-white text-blue-600'} shadow-sm` 
                  : `${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`
              }`}
              title="Card View"
            >
              <CardViewIcon fontSize="small" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table' 
                  ? `${darkMode ? 'bg-gray-600 text-blue-400' : 'bg-white text-blue-600'} shadow-sm` 
                  : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-600/50' : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'}`
              }`}
              title="Table View"
            >
              <TableViewIcon fontSize="small" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <AddIcon fontSize="small" />
            New Project
          </button>
        </div>
      </div>

      {/* Project Creation Form */}
      {showForm && (
        <div className={`premium-card p-6 border-l-4 border-l-blue-500 ${darkMode ? 'bg-gray-800' : ''}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  placeholder="Enter project name..."
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="active">🟢 Active</option>
                  <option value="on-hold">⏸️ On Hold</option>
                  <option value="completed">✅ Completed</option>
                  <option value="archived">📦 Archived</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
                placeholder="Project description..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Project Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className={`w-12 h-10 border rounded-lg cursor-pointer ${
                    darkMode ? 'border-gray-600' : 'border-gray-300'
                  }`}
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingProject ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Content */}
      {viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const projectName = typeof project === 'string' ? project : project.name;
            const projectData = typeof project === 'string' ? { name: project, color: '#3B82F6', status: 'active' } : project;
            const stats = getProjectStats(projectName);
            
            return (
              <div key={index} className="premium-card hover:shadow-lg transition-all duration-200">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: projectData.color }}
                    ></div>
                    <div>
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{projectName}</h3>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>
                        {projectData.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(projectData)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        darkMode 
                          ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/20' 
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <EditIcon fontSize="small" />
                    </button>
                    <button
                      onClick={() => handleDelete(projectName)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        darkMode 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                  </div>
                </div>

                {/* Project Description */}
                {projectData.description && (
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 line-clamp-2`}>
                    {projectData.description}
                  </p>
                )}

                {/* Task Statistics */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <TaskIcon fontSize="small" className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {stats.total} tasks total
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className={`w-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' 
                      }}
                    ></div>
                  </div>

                  {/* Status Breakdown */}
                  <div className={`flex justify-between text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>✅ {stats.completed}</span>
                    <span>⚡ {stats.inProgress}</span>
                    <span>📋 {stats.todo}</span>
                  </div>
                </div>

                {/* Project Actions */}
                <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                  <button 
                    onClick={() => {
                      if (setFilter && setActivePage) {
                        setFilter({ project: projectName });
                        setActivePage('tasks');
                      }
                    }}
                    className={`w-full text-sm font-medium transition-colors ${
                      darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    View Project Tasks →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b`}>
                <tr>
                  <th className={`text-left px-6 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Project
                  </th>
                  <th className={`text-left px-6 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`text-left px-6 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Description
                  </th>
                  <th className={`text-left px-6 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Tasks
                  </th>
                  <th className={`text-left px-6 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Progress
                  </th>
                  <th className={`text-left px-6 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Created
                  </th>
                  <th className={`text-right px-6 py-3 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                {projects.map((project, index) => {
                  const projectName = typeof project === 'string' ? project : project.name;
                  const projectData = typeof project === 'string' ? { name: project, color: '#3B82F6', status: 'active' } : project;
                  const stats = getProjectStats(projectName);
                  
                  return (
                    <tr key={index} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: projectData.color }}
                          ></div>
                          <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {projectName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          projectData.status === 'active' ? 'bg-green-100 text-green-800' :
                          projectData.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                          projectData.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {projectData.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'} max-w-xs truncate`}>
                          {projectData.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {stats.total} total
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {stats.completed} completed
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`w-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ 
                              width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' 
                            }}
                          ></div>
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {projectData.createdAt ? new Date(projectData.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              if (setFilter && setActivePage) {
                                setFilter({ project: projectName });
                                setActivePage('tasks');
                              }
                            }}
                            className={`p-1 rounded transition-colors ${
                              darkMode 
                                ? 'text-green-400 hover:text-green-300 hover:bg-green-900/20' 
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            }`}
                            title="View Tasks"
                          >
                            <TaskIcon fontSize="small" />
                          </button>
                          <button
                            onClick={() => handleEdit(projectData)}
                            className={`p-1 rounded transition-colors ${
                              darkMode 
                                ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20' 
                                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                            }`}
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </button>
                          <button
                            onClick={() => handleDelete(projectName)}
                            className={`p-1 rounded transition-colors ${
                              darkMode 
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title="Delete"
                          >
                            <DeleteIcon fontSize="small" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="col-span-full text-center py-12">
          <ProjectIcon className={`mx-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`} style={{ fontSize: 64 }} />
          <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-600'} mb-2`}>No projects yet</h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>Create your first project to organize your tasks</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Create First Project
          </button>
        </div>
      )}
    </div>
  );
}