"use client";
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadTasksFromCSV, loadProjectsFromCSV } from '../redux/slices/taskSlice';
import { 
  Search as SearchIcon, 
  Notifications as NotificationIcon, 
  Settings as SettingsIcon,
  AccountCircle as ProfileIcon
} from '@mui/icons-material';

import Sidebar from './Sidebar';
import Filters from './Filters';
import TaskList from './TaskList';
import AnalyticsDashboard from './AnalyticsDashboard';
import TaskForm from './TaskForm';
import ProjectList from './ProjectList';
import ArchivedTasks from './ArchivedTasks';
import CalendarView from './CalendarView';
import TimelineView from './TimelineView';

export default function Layout({ children }) {
  const [isClient, setIsClient] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  
  const dispatch = useDispatch();
  
  // Redux selectors
  const tasks = useSelector(state => state.tasks.tasks || []);
  const archivedTasks = useSelector(state => state.tasks.archivedTasks || []);
  const projects = useSelector(state => state.tasks.projects || []);
  const filter = useSelector(state => state.tasks.filter || {});

  // Load data from CSV files on mount
  useEffect(() => {
    setIsClient(true);
    dispatch(loadTasksFromCSV());
    dispatch(loadProjectsFromCSV());
  }, [dispatch]);

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const drawerWidth = 320;

  return (
    <div className={`flex min-h-screen relative ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Header Bar */}
      <div className={`fixed top-0 left-0 right-0 h-16 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm z-50 flex items-center justify-between px-6`}>
        <div className="flex items-center gap-4">
          <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Task Manager</div>
          {/* <div className="text-sm text-gray-500">Enterprise Task Management</div> */}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          {/* <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fontSize="small" />
            <input 
              type="text" 
              placeholder="Search tasks, projects..."
              className="bg-gray-100 pl-10 pr-4 py-2 rounded-lg text-gray-800 placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div> */}
          
          {/* Action Buttons */}
          {/* <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors">
            <NotificationIcon className="text-gray-600" fontSize="small" />
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors">
            <SettingsIcon className="text-gray-600" fontSize="small" />
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors">
            <ProfileIcon className="text-gray-600" fontSize="small" />
          </button> */}
        </div>
      </div>

      <Sidebar
        drawerWidth={drawerWidth}
        activePage={activePage}
        setActivePage={setActivePage}
        tasks={tasks}
        archivedTasks={archivedTasks}
        projects={projects}
        filter={filter}
        setFilter={(newFilter) => dispatch({ type: 'tasks/setFilter', payload: newFilter })}
        exportToCSV={() => dispatch({ type: 'tasks/exportToCSV' })}
        importFromCSV={(e) => dispatch({ type: 'tasks/importFromCSV', payload: e })}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onAddTask={() => setShowTaskForm(true)}
      />

      <main 
        className={`flex-1 pt-20 p-8 animate-fade-in-up ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
        style={{ marginLeft: `${drawerWidth}px` }}
      >
        {activePage === 'dashboard' && <AnalyticsDashboard darkMode={darkMode} />}
        
        {activePage === 'tasks' && (
          <>
            <Filters
              filter={filter}
              setFilter={(newFilter) => dispatch({ type: 'tasks/setFilter', payload: newFilter })}
              projects={projects}
              activePage={activePage}
              darkMode={darkMode}
            />
            <TaskList
              activePage={activePage}
              filter={filter}
              onEditTask={(task) => {
                setEditingTask(task);
                setShowTaskForm(true);
              }}
              darkMode={darkMode}
            />
          </>
        )}

        {activePage === 'projects' && (
          <ProjectList 
            setActivePage={setActivePage}
            setFilter={(newFilter) => dispatch({ type: 'tasks/setFilter', payload: newFilter })}
            darkMode={darkMode}
          />
        )}
        
        {activePage === 'calendar' && (
          <CalendarView 
            darkMode={darkMode}
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskForm(true);
            }}
          />
        )}
        
        {activePage === 'timeline' && (
          <TimelineView 
            darkMode={darkMode}
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskForm(true);
            }}
          />
        )}
        
        {activePage === 'archived' && <ArchivedTasks darkMode={darkMode} />}
      </main>

      {showTaskForm && (
        <TaskForm
          editingTask={editingTask}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          projects={projects}
        />
      )}
    </div>
  );
}