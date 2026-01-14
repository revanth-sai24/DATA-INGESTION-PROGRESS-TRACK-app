"use client";
import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateTask } from '../redux/slices/taskSlice';
import {
  Timeline as TimelineIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format, isToday, isYesterday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';

const TimelineView = ({ darkMode, onEditTask }) => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);
  
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, overdue, today, upcoming
  const [selectedProject, setSelectedProject] = useState('all');

  // Get unique projects
  const projects = useMemo(() => {
    const uniqueProjects = [...new Set(tasks.map(task => task.project).filter(Boolean))];
    return uniqueProjects.sort();
  }, [tasks]);

  // Filter and group tasks by timeline
  const timelineData = useMemo(() => {
    let filteredTasks = [...tasks];
    
    // Filter by project
    if (selectedProject !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.project === selectedProject);
    }

    // Filter by timeline
    const now = new Date();
    switch (selectedFilter) {
      case 'overdue':
        filteredTasks = filteredTasks.filter(task => 
          task.dueDate && new Date(task.dueDate) < startOfDay(now) && task.status !== 'completed'
        );
        break;
      case 'today':
        filteredTasks = filteredTasks.filter(task => 
          task.dueDate && isToday(new Date(task.dueDate))
        );
        break;
      case 'upcoming':
        filteredTasks = filteredTasks.filter(task => 
          task.dueDate && new Date(task.dueDate) > endOfDay(now)
        );
        break;
      default:
        // Show all tasks
        break;
    }

    // Group tasks by date and sort
    const grouped = {};
    
    filteredTasks.forEach(task => {
      let groupKey;
      let sortDate;
      
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        sortDate = dueDate.getTime();
        
        if (isToday(dueDate)) {
          groupKey = 'Today';
        } else if (isYesterday(dueDate)) {
          groupKey = 'Yesterday';
        } else if (isTomorrow(dueDate)) {
          groupKey = 'Tomorrow';
        } else if (dueDate < startOfDay(now) && task.status !== 'completed') {
          groupKey = 'Overdue';
        } else if (dueDate < startOfDay(now) && task.status === 'completed') {
          groupKey = format(dueDate, 'MMMM d, yyyy');
        } else {
          groupKey = format(dueDate, 'MMMM d, yyyy');
        }
      } else {
        groupKey = 'No Due Date';
        sortDate = task.createdAt ? new Date(task.createdAt).getTime() : 0;
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = { tasks: [], sortDate };
      }
      grouped[groupKey].tasks.push(task);
    });

    // Sort tasks within each group and sort groups
    Object.keys(grouped).forEach(key => {
      grouped[key].tasks.sort((a, b) => {
        // Sort by priority first, then by created date
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority?.toLowerCase()] || 0;
        const bPriority = priorityOrder[b.priority?.toLowerCase()] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    });

    // Sort groups by date - Future dates first, then today, then past dates
    const sortedGroups = Object.entries(grouped).sort(([keyA, valueA], [keyB, valueB]) => {
      if (keyA === 'Overdue') return 1; // Move overdue to bottom
      if (keyB === 'Overdue') return -1;
      if (keyA === 'Today') return keyB === 'Overdue' ? -1 : 0;
      if (keyB === 'Today') return keyA === 'Overdue' ? 1 : 0;
      if (keyA === 'Tomorrow') return -1; // Tomorrow at top
      if (keyB === 'Tomorrow') return 1;
      if (keyA === 'No Due Date') return 1; // No due date at bottom
      if (keyB === 'No Due Date') return -1;
      
      // For regular dates, show future dates first (descending by date for future, ascending for past)
      const now = new Date();
      const isAFuture = valueA.sortDate > now.getTime();
      const isBFuture = valueB.sortDate > now.getTime();
      
      if (isAFuture && isBFuture) {
        return valueA.sortDate - valueB.sortDate; // Future: nearest first
      } else if (!isAFuture && !isBFuture) {
        return valueB.sortDate - valueA.sortDate; // Past: most recent first
      } else {
        return isAFuture ? -1 : 1; // Future dates come before past dates
      }
    });

    return sortedGroups;
  }, [tasks, selectedFilter, selectedProject]);

  // Task status update
  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      dispatch(updateTask({ ...task, status: newStatus, updatedAt: new Date().toISOString() }));
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon className="text-green-500" />;
      case 'in-progress':
        return <PlayIcon className="text-blue-500" />;
      case 'on-hold':
        return <PauseIcon className="text-orange-500" />;
      default:
        return <CircleIcon className="text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return darkMode ? 'text-red-400 border-red-400' : 'text-red-600 border-red-600';
      case 'medium': return darkMode ? 'text-yellow-400 border-yellow-400' : 'text-yellow-600 border-yellow-600';
      case 'low': return darkMode ? 'text-green-400 border-green-400' : 'text-green-600 border-green-600';
      default: return darkMode ? 'text-gray-400 border-gray-400' : 'text-gray-600 border-gray-600';
    }
  };

  // Get group header color
  const getGroupColor = (groupName) => {
    switch (groupName) {
      case 'Overdue':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Today':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Tomorrow':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return darkMode ? 'text-gray-300 bg-gray-700 border-gray-600' : 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TimelineIcon className={`text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Timeline View
            </h1>
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {timelineData.reduce((total, [_, group]) => total + group.tasks.length, 0)} tasks
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Timeline Filter */}
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Timeline:
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Tasks</option>
              <option value="overdue">Overdue</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Project:
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
        {timelineData.length === 0 ? (
          <div className="p-12 text-center">
            <ScheduleIcon className={`text-6xl ${darkMode ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
            <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
              No tasks found
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No tasks match your current filter criteria.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className={`absolute left-8 top-0 bottom-0 w-0.5 ${
              darkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`} />

            {timelineData.map(([groupName, group], groupIndex) => (
              <div key={groupName} className="relative">
                {/* Group Header */}
                <div className={`sticky top-0 z-10 px-6 py-4 border-b ${getGroupColor(groupName)} ${
                  darkMode && groupName !== 'Overdue' && groupName !== 'Today' && groupName !== 'Tomorrow' 
                    ? 'text-gray-300 bg-gray-700 border-gray-600' 
                    : ''
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${getPriorityColor('medium')} bg-current`} />
                    <h3 className="font-semibold text-lg">{groupName}</h3>
                    <span className="text-sm opacity-75">({group.tasks.length})</span>
                  </div>
                </div>

                {/* Tasks in Group */}
                <div className="pb-6">
                  {group.tasks.map((task, taskIndex) => (
                    <div key={task.id} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute left-6 w-4 h-4 rounded-full border-2 z-10 ${
                        task.status === 'completed' 
                          ? 'bg-green-500 border-green-500' 
                          : darkMode 
                            ? 'bg-gray-800 border-gray-400' 
                            : 'bg-white border-gray-400'
                      }`}>
                        {task.status === 'completed' && (
                          <CheckCircleIcon className="w-3 h-3 text-white absolute inset-0.5" />
                        )}
                      </div>

                      {/* Task Content */}
                      <div className="ml-16 mr-6 py-4">
                        <div className={`p-4 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-gray-50 border-gray-200'
                        } hover:shadow-md transition-shadow`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Task header */}
                              <div className="flex items-start gap-3 mb-2">
                                <div className="flex-1">
                                  <h4 className={`font-semibold ${
                                    task.status === 'completed' ? 'line-through opacity-60' : ''
                                  } ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className={`text-sm mt-1 ${
                                      darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Priority badge */}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                  getPriorityColor(task.priority)
                                } bg-opacity-20`}>
                                  {task.priority || 'medium'}
                                </span>
                              </div>

                              {/* Task metadata */}
                              <div className={`flex flex-wrap items-center gap-4 text-xs ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(task.status)}
                                  <span className="capitalize">{task.status || 'todo'}</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <EventIcon fontSize="small" />
                                  <span>{task.project || 'No Project'}</span>
                                </div>
                                
                                {task.workingFor && (
                                  <div className="flex items-center gap-1">
                                    <PersonIcon fontSize="small" />
                                    <span>For: {task.workingFor}</span>
                                  </div>
                                )}
                                
                                {task.workingWith && (
                                  <div className="flex items-center gap-1">
                                    <GroupIcon fontSize="small" />
                                    <span>With: {task.workingWith}</span>
                                  </div>
                                )}
                                
                                {task.dueDate && (
                                  <div className="flex items-center gap-1">
                                    <ScheduleIcon fontSize="small" />
                                    <span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                                  </div>
                                )}
                              </div>

                              {/* Progress indicator for checkpoints */}
                              {task.checkpoints && task.checkpoints.length > 0 && (
                                <div className="mt-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium">Progress:</span>
                                    <span className="text-xs">
                                      {task.checkpoints.filter(cp => cp.completed).length}/{task.checkpoints.length} checkpoints
                                    </span>
                                  </div>
                                  <div className={`h-1.5 rounded-full overflow-hidden ${
                                    darkMode ? 'bg-gray-600' : 'bg-gray-200'
                                  }`}>
                                    <div 
                                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                                      style={{ 
                                        width: `${(task.checkpoints.filter(cp => cp.completed).length / task.checkpoints.length) * 100}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onEditTask && onEditTask(task)}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode 
                                    ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20' 
                                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                }`}
                                title="Edit Task"
                              >
                                <EditIcon fontSize="small" />
                              </button>
                              
                              {task.status !== 'completed' && (
                                <button
                                  onClick={() => handleStatusChange(task.id, 'completed')}
                                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    darkMode 
                                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                                      : 'bg-green-600 hover:bg-green-700 text-white'
                                  }`}
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;