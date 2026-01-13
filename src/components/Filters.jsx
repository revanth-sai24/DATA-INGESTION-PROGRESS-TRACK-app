"use client";
import React from 'react';
import { FilterList as FilterListIcon } from '@mui/icons-material';

export default function Filters({ filter, setFilter, projects, clearFilters }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Filter by Status</label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="">All</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Filter by Priority</label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          >
            <option value="">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Filter by Project</label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
            value={filter.project}
            onChange={(e) => setFilter({ ...filter, project: e.target.value })}
          >
            <option value="">All</option>
            {projects.map((project) => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={clearFilters}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-dark"
          >
            <FilterListIcon fontSize="small" /> Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
