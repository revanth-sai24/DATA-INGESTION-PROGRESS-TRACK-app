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
  Schedule as CalendarIcon
} from '@mui/icons-material';

export default function ProjectList() {
  const dispatch = useDispatch();
  const { tasks, projects } = useSelector((state) => state.tasks);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
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
          <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your project collections</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <AddIcon fontSize="small" />
          New Project
        </button>
      </div>

      {/* Project Creation Form */}
      {showForm && (
        <div className="premium-card p-6 border-l-4 border-l-blue-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter project name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">🟢 Active</option>
                  <option value="on-hold">⏸️ On Hold</option>
                  <option value="completed">✅ Completed</option>
                  <option value="archived">📦 Archived</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Project description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {/* Projects Grid */}
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
                    <h3 className="font-semibold text-gray-800">{projectName}</h3>
                    <span className="text-xs text-gray-500 capitalize">
                      {projectData.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(projectData)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <EditIcon fontSize="small" />
                  </button>
                  <button
                    onClick={() => handleDelete(projectName)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              </div>

              {/* Project Description */}
              {projectData.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {projectData.description}
                </p>
              )}

              {/* Task Statistics */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <TaskIcon fontSize="small" className="text-gray-400" />
                  <span className="text-gray-600">
                    {stats.total} tasks total
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' 
                    }}
                  ></div>
                </div>

                {/* Status Breakdown */}
                <div className="flex justify-between text-xs text-gray-600">
                  <span>✅ {stats.completed}</span>
                  <span>⚡ {stats.inProgress}</span>
                  <span>📋 {stats.todo}</span>
                </div>
              </div>

              {/* Project Actions */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View Project Tasks →
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <ProjectIcon className="mx-auto text-gray-400 mb-4" style={{ fontSize: 64 }} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to organize your tasks</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Create First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}