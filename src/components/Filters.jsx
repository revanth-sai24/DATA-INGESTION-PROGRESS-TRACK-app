"use client";
import React from 'react';
import { 
  FilterList as FilterListIcon, 
  Clear as ClearIcon,
  Search as SearchIcon 
} from '@mui/icons-material';

export default function Filters({ filter, setFilter, projects, clearFilters, darkMode }) {
  const handleClearFilters = () => {
    setFilter({ status: '', priority: '', project: '', search: '' });
  };

  return (
    <div className="premium-card mb-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
          <FilterListIcon className="text-white text-sm" />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Smart Filters</h3>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Refine your task view with intelligent filtering</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fontSize="small" />
          <input
            type="text"
            placeholder="Search tasks by title, description, or tags..."
            className={`w-full ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800 placeholder-gray-500'} pl-12 pr-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={filter.search || ''}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
          <select
            className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            value={filter.status || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="" className={darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}>All Status</option>
            <option value="todo" className={darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}>📋 To Do</option>
            <option value="in-progress" className={darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}>⚡ In Progress</option>
            <option value="completed" className={darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}>✅ Completed</option>
            <option value="on-hold" className={darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}>⏸️ On Hold</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
          <select
            className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            value={filter.priority || ''}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          >
            <option value="" className={darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}>All Priorities</option>
            <option value="high" className={darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}>🔴 High Priority</option>
            <option value="medium" className={darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}>🟡 Medium Priority</option>
            <option value="low" className={darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}>🟢 Low Priority</option>
          </select>
        </div>

        {/* Project Filter */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Project</label>
          <select
            className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            value={filter.project || ''}
            onChange={(e) => setFilter({ ...filter, project: e.target.value })}
          >
            <option value="" className="bg-white text-gray-800">All Projects</option>
            {projects.map((project) => {
              const projectName = project.name || project;
              return (
                <option key={projectName} value={projectName} className="bg-white text-gray-800">
                  📁 {projectName}
                </option>
              );
            })}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</label>
          <button
            onClick={handleClearFilters}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
          >
            <ClearIcon fontSize="small" />
            Clear All
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filter.status || filter.priority || filter.project || filter.search) && (
        <div className={`mt-6 pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t`}>
          <div className="flex flex-wrap gap-2">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Active filters:</span>
            {filter.status && (
              <span className="bg-blue-100 border border-blue-200 px-3 py-1 rounded-full text-xs text-blue-800">
                Status: {filter.status}
              </span>
            )}
            {filter.priority && (
              <span className="bg-orange-100 border border-orange-200 px-3 py-1 rounded-full text-xs text-orange-800">
                Priority: {filter.priority}
              </span>
            )}
            {filter.project && (
              <span className="bg-green-100 border border-green-200 px-3 py-1 rounded-full text-xs text-green-800">
                Project: {filter.project}
              </span>
            )}
            {filter.search && (
              <span className="bg-purple-100 border border-purple-200 px-3 py-1 rounded-full text-xs text-purple-800">
                Search: "{filter.search}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
