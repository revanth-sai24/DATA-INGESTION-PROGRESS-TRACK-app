"use client";
import React from 'react';
import {
  ListAlt as ListAltIcon, Archive as ArchiveIcon,
  Add as AddIcon, Download as DownloadIcon, Upload as UploadIcon,
  Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon,
  Assignment as AssignmentIcon, Dashboard as DashboardIcon, Folder as FolderIcon
} from '@mui/icons-material';

export default function Sidebar({
  drawerWidth = 320,
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
      className={`fixed h-screen z-40 flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r shadow-lg overflow-y-auto`}
      style={{ width: drawerWidth }}
    >
      {/* Brand Section */}
      {/* <div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
            <AssignmentIcon style={{ fontSize: 24, color: 'white' }} />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">TaskMaster</div>
            <div className="text-xs text-gray-500">Enterprise Edition</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 px-2">Professional Task Management Platform</div>
      </div> */}

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2 mt-5">
        <div className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4 px-2 tracking-wider`}>MAIN NAVIGATION</div>
        
        <button
          onClick={() => setActivePage('dashboard')}
          className={`group w-full flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-200 ${
            activePage === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-md' 
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
            activePage === 'dashboard' ? 'bg-white/20' : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
          }`}>
            <DashboardIcon className="text-sm" />
          </div>
          <span className="font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => setActivePage('tasks')}
          className={`group w-full flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-200 ${
            activePage === 'tasks' 
              ? 'bg-blue-600 text-white shadow-md' 
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
            activePage === 'tasks' ? 'bg-white/20' : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
          }`}>
            <ListAltIcon className="text-sm" />
          </div>
          <span className="font-medium flex-1 text-left">All Tasks</span>
          <span className={`text-xs px-2 py-1 rounded-md font-semibold ${
            activePage === 'tasks' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
          }`}>
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActivePage('projects')}
          className={`group w-full flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-200 ${
            activePage === 'projects' 
              ? 'bg-blue-600 text-white shadow-md' 
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
            activePage === 'projects' ? 'bg-white/20' : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
          }`}>
            <FolderIcon className="text-sm" />
          </div>
          <span className="font-medium flex-1 text-left">Projects</span>
          <span className={`text-xs px-2 py-1 rounded-md font-semibold ${
            activePage === 'projects' ? 'bg-white/20 text-white' : `${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`
          }`}>
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setActivePage('archived')}
          className={`group w-full flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-200 ${
            activePage === 'archived' 
              ? 'bg-blue-600 text-white shadow-md' 
              : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`
          }`}
        >
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
            activePage === 'archived' ? 'bg-white/20' : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
          }`}>
            <ArchiveIcon className="text-sm" />
          </div>
          <span className="font-medium flex-1 text-left">Archived</span>
          <span className={`text-xs px-2 py-1 rounded-md font-semibold ${
            activePage === 'archived' ? 'bg-white/20 text-white' : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`
          }`}>
            {archivedTasks.length}
          </span>
        </button>

        <div className={`h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} my-6`} />

        {/* Quick Projects */}
        <div className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4 px-2 tracking-wider`}>QUICK ACCESS</div>
        
        {projects.slice(0, 4).map((project) => (
          <button
            key={project.name || project}
            onClick={() => { 
              setActivePage('tasks'); 
              setFilter({ ...filter, project: project.name || project }); 
            }}
            className={`group w-full flex items-center justify-between rounded-lg px-3 py-2 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} transition-all`}
          >
            <span className="text-sm truncate">{project.name || project}</span>
            <span className={`text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'} px-2 py-0.5 rounded-md ml-2`}>
              {tasks.filter(t => t.project === (project.name || project)).length}
            </span>
          </button>
        ))}

        {projects.length > 4 && (
          <button
            onClick={() => setActivePage('projects')}
            className={`w-full text-left px-3 py-2 text-xs ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
          >
            +{projects.length - 4} more projects
          </button>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className={`px-4 py-6 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} space-y-4`}>
        <button
          onClick={onAddTask}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transform transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
        >
          <AddIcon fontSize="small" />
          Create New Task
        </button>

        {/* <div className="text-xs font-semibold text-gray-400 mb-2 tracking-wider">QUICK ACTIONS</div> */}
        
        <div className="grid grid-cols-3 gap-2">
          {/* <button 
            onClick={exportToCSV} 
            className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg transition-all flex flex-col items-center gap-1 group"
            title="Export Data"
          >
            <DownloadIcon fontSize="small" className="text-gray-600 group-hover:text-gray-800" />
            <span className="text-xs text-gray-600 group-hover:text-gray-800">Export</span>
          </button> */}
          
          {/* <label className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg transition-all flex flex-col items-center gap-1 group cursor-pointer"
                 title="Import Data">
            <UploadIcon fontSize="small" className="text-gray-600 group-hover:text-gray-800" />
            <span className="text-xs text-gray-600 group-hover:text-gray-800">Import</span>
            <input type="file" hidden accept=".csv" onChange={importFromCSV} />
          </label> */}
          
          {/* <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg transition-all flex flex-col items-center gap-1 group"
            title="Toggle Theme"
          >
            {darkMode ? 
              <LightModeIcon fontSize="small" className="text-gray-600 group-hover:text-gray-800" /> : 
              <DarkModeIcon fontSize="small" className="text-gray-600 group-hover:text-gray-800" />
            }
            <span className="text-xs text-gray-600 group-hover:text-gray-800">Theme</span>
          </button> */}
        </div>
        
        {/* Status Indicator */}
        {/* <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-green-700">Auto-Save Active</span>
          </div>
          <div className="text-xs text-green-600 mt-1">Data synchronized in real-time</div>
        </div> */}
      </div>
    </aside>
  );
}
