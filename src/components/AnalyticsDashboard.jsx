"use client";
import React from 'react';
import { useSelector } from 'react-redux';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as TaskIcon,
  Folder as ProjectIcon,
  CheckCircle as CompletedIcon
} from '@mui/icons-material';

/* Charts reuse the app's semantic colours so a "done" slice is the same green
   as a Done pill, and a high-priority slice the same red as its badge. Charts
   inventing their own palette is why they read as a separate product. */
const STATUS_COLORS = {
  Todo: '#7c8698',
  'To Do': '#7c8698',
  'In Progress': '#3b6fe0',
  Completed: '#15803d',
  Done: '#15803d',
  'On Hold': '#b45309',
};
const PRIORITY_TONES = { High: '#b91c1c', Medium: '#b45309', Low: '#5b7186' };
const COLORS = ['#3b6fe0', '#15803d', '#b45309', '#7c8698'];
const PRIORITY_COLORS = ['#b91c1c', '#b45309', '#5b7186'];
const chartColor = (map, name, i, fallback) =>
  map[name] ?? fallback[i % fallback.length];

export default function AnalyticsDashboard({ darkMode }) {
  const tasks = useSelector(state => state.tasks.tasks);
  const projects = useSelector(state => state.tasks.projects);
  
  // Calculate analytics data
  const statusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length },
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
    { name: 'On Hold', value: tasks.filter(t => t.status === 'on-hold').length }
  ].filter(item => item.value > 0);

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length }
  ].filter(item => item.value > 0);

  const projectData = projects.slice(0, 6).map(project => {
    const projectName = project.name || project;
    const projectTasks = tasks.filter(t => t.project === projectName);
    return {
      name: projectName.length > 15 ? projectName.substring(0, 15) + '...' : projectName,
      tasks: projectTasks.length,
      completed: projectTasks.filter(t => t.status === 'completed').length
    };
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="premium-card rise rise-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--surface-2)] text-[var(--fg-subtle)]">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Task Status Distribution</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Overview of task completion status</p>
            </div>
          </div>
          
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  animationDuration={900}
                  animationBegin={120}
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColor(STATUS_COLORS, entry.name, index, COLORS)} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#374151' : 'rgba(255, 255, 255, 0.95)', 
                    border: `1px solid ${darkMode ? '#4B5563' : 'rgba(255, 255, 255, 0.2)'}`, 
                    borderRadius: '8px',
                    color: darkMode ? 'white' : '#374151'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-64 flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <div>No tasks yet</div>
              </div>
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="premium-card rise rise-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--surface-2)] text-[var(--fg-subtle)]">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Priority Breakdown</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Task distribution by priority level</p>
            </div>
          </div>
          
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  animationDuration={900}
                  animationBegin={120}
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColor(PRIORITY_TONES, entry.name, index, PRIORITY_COLORS)} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#374151' : 'rgba(255, 255, 255, 0.95)', 
                    border: `1px solid ${darkMode ? '#4B5563' : 'rgba(255, 255, 255, 0.2)'}`, 
                    borderRadius: '8px',
                    color: darkMode ? 'white' : '#374151'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-64 flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-center">
                <div className="text-4xl mb-2">⚡</div>
                <div>No priority data</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Analytics */}
      {projectData.length > 0 && (
        <div className="premium-card rise rise-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--surface-2)] text-[var(--fg-subtle)]">
              <span className="text-white text-lg">📁</span>
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Project Performance</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Task completion across projects</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={projectData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: darkMode ? '#D1D5DB' : '#374151', fontSize: 12 }}
                axisLine={{ stroke: darkMode ? '#6B7280' : '#d1d5db' }}
              />
              <YAxis 
                tick={{ fill: darkMode ? '#D1D5DB' : '#374151', fontSize: 12 }}
                axisLine={{ stroke: darkMode ? '#6B7280' : '#d1d5db' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#374151' : 'white', 
                  border: `1px solid ${darkMode ? '#4B5563' : '#e5e7eb'}`, 
                  borderRadius: '8px',
                  color: darkMode ? 'white' : '#374151'
                }} 
              />
              <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
              <Bar animationDuration={900} dataKey="tasks" fill="#3b6fe0" name="Total Tasks" radius={[4, 4, 0, 0]} />
              <Bar animationDuration={900} dataKey="completed" fill="#48dbfb" name="Completed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty State */}
      {totalTasks === 0 && (
        <div className="premium-card text-center py-16">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>Ready to Get Started?</h3>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Create your first task or import existing data to see comprehensive analytics</p>
          <div className="flex justify-center gap-4">
            <button className="btn-primary">Create First Task</button>
            <button className="btn-secondary">Import CSV Data</button>
          </div>
        </div>
      )}
    </div>
  );
}
