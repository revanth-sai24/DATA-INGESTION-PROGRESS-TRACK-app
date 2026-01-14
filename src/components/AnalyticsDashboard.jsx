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

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c'];
const PRIORITY_COLORS = ['#ff6b6b', '#feca57', '#48dbfb'];

export default function AnalyticsDashboard() {
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
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Task Analytics Dashboard</h1>
        <p className="text-gray-600 text-lg">Comprehensive overview of your productivity metrics</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="metric-card group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <TaskIcon className="text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800">{totalTasks}</div>
              <div className="text-gray-600 text-sm">Total Tasks</div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000" 
                 style={{ width: totalTasks > 0 ? '100%' : '0%' }}></div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <ProjectIcon className="text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800">{projects.length}</div>
              <div className="text-gray-600 text-sm">Projects</div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000" 
                 style={{ width: projects.length > 0 ? '100%' : '0%' }}></div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CompletedIcon className="text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800">{completedTasks}</div>
              <div className="text-gray-600 text-sm">Completed</div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000" 
                 style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <TrendingUpIcon className="text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800">{completionRate}%</div>
              <div className="text-gray-600 text-sm">Completion Rate</div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000" 
                 style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Task Status Distribution</h3>
              <p className="text-gray-600 text-sm">Overview of task completion status</p>
            </div>
          </div>
          
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: '8px',
                    color: 'white'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <div>No tasks yet</div>
              </div>
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Priority Breakdown</h3>
              <p className="text-gray-600 text-sm">Task distribution by priority level</p>
            </div>
          </div>
          
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
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
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: '8px',
                    color: 'white'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
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
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-cyan-600 flex items-center justify-center">
              <span className="text-white text-lg">📁</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Project Performance</h3>
              <p className="text-gray-600 text-sm">Task completion across projects</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={projectData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#374151', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tick={{ fill: '#374151', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  color: '#374151'
                }} 
              />
              <Legend wrapperStyle={{ color: '#374151' }} />
              <Bar dataKey="tasks" fill="#667eea" name="Total Tasks" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#48dbfb" name="Completed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty State */}
      {totalTasks === 0 && (
        <div className="premium-card text-center py-16">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Ready to Get Started?</h3>
          <p className="text-gray-600 mb-6">Create your first task or import existing data to see comprehensive analytics</p>
          <div className="flex justify-center gap-4">
            <button className="btn-primary">Create First Task</button>
            <button className="btn-secondary">Import CSV Data</button>
          </div>
        </div>
      )}
    </div>
  );
}
