"use client";
import React from 'react';
import {
  Edit as EditIcon, Comment as CommentIcon, Archive as ArchiveIcon,
  Delete as DeleteIcon, PlayArrow as PlayArrowIcon, Stop as StopIcon,
  CalendarToday as CalendarIcon, AccessTime as TimeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function TaskList({
  viewMode,
  searchedTasks,
  selectedTasks,
  setSelectedTasks,
  sortConfig,
  setSortConfig,
  updateTaskStatus,
  formatTime,
  toggleTimeTracking,
  editTask,
  setSelectedTaskForComments,
  setCommentDrawerOpen,
  archiveTask,
  deleteTask,
  getPriorityColor,
  getStatusColor
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === searchedTasks.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTasks(searchedTasks.map(t => t.id));
                      else setSelectedTasks([]);
                    }}
                  />
                </th>
                <th className="p-3 cursor-pointer select-none" onClick={() => setSortConfig({ key: 'title', direction: sortConfig.key === 'title' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Title</th>
                <th className="p-3">Project</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Time</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {searchedTasks.map(task => (
                <tr key={task.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTasks([...selectedTasks, task.id]);
                        else setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                      }}
                    />
                  </td>
                  <td className="p-3">{task.title}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs text-slate-700">
                      {task.project || 'None'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs text-white" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-3">
                    <select
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">{formatTime(task.timeTracking?.elapsed || 0)}</span>
                      <button
                        className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs ${task.timeTracking?.isRunning ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                        onClick={() => toggleTimeTracking(task.id)}
                      >
                        {task.timeTracking?.isRunning ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => editTask(task)} className="rounded-md px-2 py-1 hover:bg-slate-100"><EditIcon fontSize="small" /></button>
                      <button onClick={() => { setSelectedTaskForComments(task); setCommentDrawerOpen(true); }} className="rounded-md px-2 py-1 hover:bg-slate-100">
                        <CommentIcon fontSize="small" />
                        <span className="ml-1 text-[10px] text-slate-600">{task.comments?.length || 0}</span>
                      </button>
                      <button onClick={() => archiveTask(task.id)} className="rounded-md px-2 py-1 hover:bg-slate-100"><ArchiveIcon fontSize="small" /></button>
                      <button onClick={() => deleteTask(task.id)} className="rounded-md px-2 py-1 hover:bg-red-50 text-red-600"><DeleteIcon fontSize="small" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
          {searchedTasks.map(task => (
            <div key={task.id} className="relative rounded-lg border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-sm">
              <div className="absolute top-2 right-2">
                <input
                  type="checkbox"
                  checked={selectedTasks.includes(task.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedTasks([...selectedTasks, task.id]);
                    else setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                  }}
                />
              </div>
              <div className="border-l-4" style={{ borderColor: getStatusColor(task.status) }}>
                <div className="p-4">
                  <h3 className="text-sm font-semibold mb-2">{task.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-[11px] text-white" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                      {task.priority}
                    </span>
                    {task.project && (
                      <span className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-700">{task.project}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-2 min-h-10">{task.description || 'No description'}</p>
                  {task.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-[11px] text-slate-700">{tag}</span>
                      ))}
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 mb-2 text-[11px] text-slate-600">
                      <CalendarIcon fontSize="small" /> Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2 text-[11px] text-slate-600">
                    <TimeIcon fontSize="small" /> {formatTime(task.timeTracking?.elapsed || 0)}
                    <button
                      className={`inline-flex items-center justify-center rounded-md px-2 py-1 ${task.timeTracking?.isRunning ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                      onClick={() => toggleTimeTracking(task.id)}
                    >
                      {task.timeTracking?.isRunning ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 pb-4">
                  <select
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <button onClick={() => editTask(task)} className="rounded-md px-2 py-1 hover:bg-slate-100"><EditIcon fontSize="small" /></button>
                    <button onClick={() => { setSelectedTaskForComments(task); setCommentDrawerOpen(true); }} className="rounded-md px-2 py-1 hover:bg-slate-100">
                      <CommentIcon fontSize="small" />
                      <span className="ml-1 text-[10px] text-slate-600">{task.comments?.length || 0}</span>
                    </button>
                    <button onClick={() => archiveTask(task.id)} className="rounded-md px-2 py-1 hover:bg-slate-100"><ArchiveIcon fontSize="small" /></button>
                    <button onClick={() => deleteTask(task.id)} className="rounded-md px-2 py-1 hover:bg-red-50 text-red-600"><DeleteIcon fontSize="small" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
