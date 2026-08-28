"use client";
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addProject, updateProject, deleteProject } from '../redux/slices/taskSlice';
import { useFeedback } from './ui/Feedback';
import { 
  Folder as ProjectIcon, 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  Schedule as CalendarIcon,
  ViewModule as CardViewIcon,
  ViewList as TableViewIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

export default function ProjectList({ setActivePage, setFilter, darkMode }) {
  const dispatch = useDispatch();
  const { confirm, toast } = useFeedback();
  const { tasks, projects } = useSelector((state) => state.tasks);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [archivedCount, setArchivedCount] = useState(0);

  /* Archived projects are deliberately absent from the store so no other
     screen has to filter them out; the count is read straight from the API. */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects?includeArchived=1")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setArchivedCount((d.projects || []).filter((p) => p.status === "archived").length);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [projects.length]);
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

  const handleDelete = async (projectName) => {
    const open = tasks.filter(
      (t) => t.project === projectName && t.status !== "archived",
    ).length;
    const ok = await confirm({
      title: `Archive “${projectName}”?`,
      description: open
        ? `${open} task${open === 1 ? "" : "s"} will move to Archived with it. Nothing is deleted — you can restore it later.`
        : "Nothing is deleted — you can restore it from the Archived screen.",
      confirmLabel: "Archive project",
    });
    if (ok) {
      dispatch(deleteProject(projectName));
      toast(`“${projectName}” archived`, "success");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.015em] text-[var(--fg)]">Projects</h1>
          <p className="mt-1 max-w-[60ch] text-[13px] text-[var(--fg-muted)]">
            Clients and workstreams. Archiving a project moves its tasks to Archived; nothing is deleted.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] tabular-nums text-[var(--fg-subtle)]">
            <span>{projects.length} active</span>
            {/* Archiving a project used to hide it with no way back to it from
                this screen — the archive was only reachable from the sidebar. */}
            <a
              href="#/archived"
              className="inline-flex items-center gap-1 text-[var(--fg-subtle)] underline decoration-dotted underline-offset-2 transition-colors hover:text-[var(--accent)]"
            >
              {archivedCount > 0 ? `${archivedCount} archived` : "Archived"}
              <ChevronRightIcon sx={{ fontSize: 13 }} />
            </a>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => {
            const projectName = typeof project === 'string' ? project : project.name;
            const projectData = typeof project === 'string' ? { name: project, color: '#3B82F6', status: 'active' } : project;
            const stats = getProjectStats(projectName);
            
            const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            const overdue = tasks.filter(
              (t) =>
                t.project === projectName &&
                t.dueDate &&
                t.status !== 'completed' &&
                t.status !== 'archived' &&
                String(t.dueDate).slice(0, 10) < new Date().toISOString().slice(0, 10),
            ).length;

            return (
              <div
                key={index}
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                className="premium-card rise group relative flex flex-col overflow-hidden !p-5"
              >
                {/* the project's own colour, as a hairline at the top edge */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-[2px]"
                  style={{ background: projectData.color }}
                />

                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px]"
                      style={{ background: `${projectData.color}1f`, color: projectData.color }}
                    >
                      <ProjectIcon sx={{ fontSize: 18 }} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--fg)]">
                        {projectName}
                      </h3>
                      <span className="text-[11px] capitalize text-[var(--fg-subtle)]">
                        {String(projectData.status || 'active').replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-none gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      onClick={() => handleEdit(projectData)}
                      aria-label={`Edit ${projectName}`}
                      className="rounded p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </button>
                    <button
                      onClick={() => handleDelete(projectName)}
                      aria-label={`Archive ${projectName}`}
                      className="rounded p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--danger-soft)]"
                      style={{ ['--tw-text-opacity']: 1 }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>

                {projectData.description && (
                  <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-[var(--fg-muted)]">
                    {projectData.description}
                  </p>
                )}

                {/* the number is the object of interest, the way the reference
                    cards lead with their technique count */}
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="font-mono text-[26px] font-medium leading-none tabular-nums text-[var(--accent)]">
                    {stats.total}
                  </span>
                  <span className="text-[12px] text-[var(--fg-muted)]">
                    task{stats.total === 1 ? '' : 's'} · {pct}% done
                  </span>
                </div>

                <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: projectData.color }}
                  />
                </div>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  {stats.completed > 0 && (
                    <span className="pill" style={{ color: 'var(--success)', background: 'var(--success-soft)' }}>
                      {stats.completed} done
                    </span>
                  )}
                  {stats.inProgress > 0 && (
                    <span className="pill" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>
                      {stats.inProgress} in progress
                    </span>
                  )}
                  {stats.todo > 0 && (
                    <span className="pill" style={{ color: 'var(--fg-muted)', background: 'var(--surface-2)' }}>
                      {stats.todo} to do
                    </span>
                  )}
                  {overdue > 0 && (
                    <span className="pill" style={{ color: 'var(--danger)', background: 'var(--danger-soft)' }}>
                      {overdue} overdue
                    </span>
                  )}
                  {stats.total === 0 && (
                    <span className="pill" style={{ color: 'var(--fg-subtle)', background: 'var(--surface-2)' }}>
                      no tasks yet
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (setFilter && setActivePage) {
                      setFilter({ project: projectName });
                      setActivePage('tasks');
                    }
                  }}
                  className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] py-2 text-[12px] font-medium text-[var(--fg-muted)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                >
                  Open tasks
                </button>
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