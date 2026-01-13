"use client";
import React from 'react';
import {
  ListAlt as ListAltIcon, Archive as ArchiveIcon,
  Add as AddIcon, Download as DownloadIcon, Upload as UploadIcon,
  Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon,
  Assignment as AssignmentIcon, Dashboard as DashboardIcon, Folder as FolderIcon
} from '@mui/icons-material';

export default function Sidebar({
  drawerWidth = 280,
  activePage,
  setActivePage,
  tasks,
  archivedTasks,
  projects,
  filter,
  setFilter,
  exportToCSV,
  importFromCSV,
  darkMode,
  setDarkMode,
  onAddTask
}) {
  return (
    <aside
      className="fixed h-screen z-50 flex flex-col border-r border-slate-200 bg-white shadow-sm"
      style={{ width: drawerWidth }}
    >
      {/* Brand */}
      <div className="px-4 py-4 border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="flex items-center gap-2 mb-1">
          <AssignmentIcon style={{ fontSize: 28, color: '#2563eb' }} />
          <span className="text-lg font-semibold text-brand">TaskMaster</span>
        </div>
        <span className="text-xs text-slate-500">Professional Task Management</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 bg-slate-50/60">
        <button
          onClick={() => setActivePage('dashboard')}
          className={`mx-3 mb-1 flex items-center gap-3 rounded-md px-3 py-2 transition ${
            activePage === 'dashboard' ? 'bg-brand text-white' : 'text-slate-700 hover:bg-indigo-50'
          }`}
        >
          <DashboardIcon className="opacity-80" />
          <span className="text-sm font-medium">Dashboard</span>
        </button>

       

        <button
          onClick={() => setActivePage('tasks')}
          className={`mx-3 mb-1 flex items-center gap-3 rounded-md px-3 py-2 transition ${
            activePage === 'tasks' ? 'bg-brand text-white' : 'text-slate-700 hover:bg-indigo-50'
          }`}
        >
          <ListAltIcon className="opacity-80" />
          <span className="text-sm font-medium">Tasks</span>
          <span className={`ml-auto text-xs rounded-md px-2 py-0.5 ${
            activePage === 'tasks' ? 'bg-white/25 text-white' : 'bg-indigo-50 text-slate-700'
          }`}>{tasks.length}</span>
        </button>
        <button
          onClick={() => setActivePage('projects')}
          className={`mx-3 mb-1 flex items-center gap-3 rounded-md px-3 py-2 transition ${
            activePage === 'projects' ? 'bg-brand text-white' : 'text-slate-700 hover:bg-indigo-50'
          }`}
        >
          <FolderIcon className="opacity-80" />
          <span className="text-sm font-medium">Projects</span>
          <span className={`ml-auto text-xs rounded-md px-2 py-0.5 ${
            activePage === 'projects' ? 'bg-white/25 text-white' : 'bg-indigo-50 text-slate-700'
          }`}>{projects.length}</span>
        </button>
        <button
          onClick={() => setActivePage('archived')}
          className={`mx-3 mb-1 flex items-center gap-3 rounded-md px-3 py-2 transition ${
            activePage === 'archived' ? 'bg-brand text-white' : 'text-slate-700 hover:bg-indigo-50'
          }`}
        >
          <ArchiveIcon className="opacity-80" />
          <span className="text-sm font-medium">Archived</span>
          <span className={`ml-auto text-xs rounded-md px-2 py-0.5 ${
            activePage === 'archived' ? 'bg-white/25 text-white' : 'bg-indigo-50 text-slate-700'
          }`}>{archivedTasks.length}</span>
        </button>

        <div className="my-3 mx-4 h-px bg-slate-200" />



        {/* Quick Projects Access */}
        <div className="px-4">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500">QUICK PROJECTS</span>
        </div>

        {projects.slice(0, 5).map((project) => (
          <button
            key={project.name || project}
            onClick={() => { setActivePage('tasks'); setFilter({ ...filter, project: project.name || project }); }}
            className="mx-3 mb-1 flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
          >
            <span className="text-sm">{project.name || project}</span>
            <span className="text-[11px] rounded-md bg-indigo-50 px-2 py-0.5 text-slate-700">
              {tasks.filter(t => t.project === (project.name || project)).length}
            </span>
          </button>
        ))}

        {projects.length > 5 && (
          <button
            onClick={() => setActivePage('projects')}
            className="mx-3 mb-2 text-xs font-medium text-brand hover:text-indigo-700"
          >
            +{projects.length - 5} more
          </button>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-3 border-t border-slate-200 bg-white">
        <button
          onClick={onAddTask}
          className="w-full mb-3 inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-dark"
        >
          <AddIcon fontSize="small" /> Add New Task
        </button>

        <div className="text-[11px] font-semibold text-slate-500 mb-2">Quick Actions</div>
        <div className="flex gap-2 mb-2">
          <button onClick={exportToCSV} className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">
            <DownloadIcon fontSize="small" />
          </button>
          <label className="flex-1 cursor-pointer rounded-md bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">
            <UploadIcon fontSize="small" />
            <input type="file" hidden accept=".csv" onChange={importFromCSV} />
          </label>
          <button
            onClick={() => { if (window.confirm('Clear all data?')) { localStorage.clear(); window.location.reload(); } }}
            className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200"
          >
            {/* Optional reset icon could be added */}
            Reset
          </button>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />} {darkMode ? 'Light' : 'Dark'} Mode
        </button>
        
        {/* Auto-save indicator */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-[11px] text-emerald-600">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Auto-save enabled
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Your data is saved automatically</div>
        </div>
      </div>
    </aside>
  );
}
