"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadTasksFromCSV, loadProjectsFromCSV } from '../redux/slices/taskSlice';
import { useFeedback } from './ui/Feedback';
import { 
  Archive as ArchiveIcon,
  Unarchive as RestoreIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  Schedule as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
  IndeterminateCheckBox as CheckBoxPartialIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { updateTask, deleteTask } from '../redux/slices/taskSlice';

export default function ArchivedTasks() {
  const dispatch = useDispatch();
  const { confirm, toast } = useFeedback();
  const { tasks, projects } = useSelector((state) => state.tasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [sortBy, setSortBy] = useState('archivedDate'); // archivedDate, title, project
  const [selected, setSelected] = useState([]);

  // Filter archived tasks
  const archivedTasks = tasks.filter(task => task.status === 'archived');
  
  const filteredTasks = archivedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !filterProject || task.project === filterProject;
    return matchesSearch && matchesProject;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'project':
        return (a.project || '').localeCompare(b.project || '');
      case 'archivedDate':
      default:
        return new Date(b.archivedAt || b.updatedAt) - new Date(a.archivedAt || a.updatedAt);
    }
  });

  const handleRestore = (task) => {
    const restoredTask = {
      ...task,
      status: 'todo',
      archivedAt: null,
      updatedAt: new Date().toISOString()
    };
    dispatch(updateTask(restoredTask));
  };

  const handlePermanentDelete = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const ok = await confirm({
      title: 'Delete permanently?',
      description: `“${task?.title ?? 'This task'}” cannot be recovered. Restore puts it back instead.`,
      confirmLabel: 'Delete forever',
      danger: true,
    });
    if (ok) {
      dispatch(deleteTask(taskId));
      setSelected((ids) => ids.filter((id) => id !== taskId));
      toast('Task deleted permanently', 'error');
    }
  };

  /* ── multi-select ─────────────────────────────────────────────────────── */

  const toggleOne = (taskId) =>
    setSelected((ids) =>
      ids.includes(taskId) ? ids.filter((id) => id !== taskId) : [...ids, taskId],
    );

  const visibleIds = () => sortedTasks.map((t) => t.id);
  const allSelected = () =>
    sortedTasks.length > 0 && selected.length === sortedTasks.length;

  const toggleAll = () =>
    setSelected(allSelected() ? [] : visibleIds());

  const bulkRestore = () => {
    const chosen = archivedTasks.filter((t) => selected.includes(t.id));
    for (const task of chosen) handleRestore(task);
    setSelected([]);
  };

  const bulkDeleteForever = async () => {
    const n = selected.length;
    if (n === 0) return;
    const all = n === sortedTasks.length && n > 1;
    const ok = await confirm({
      title: `Permanently delete ${n} task${n === 1 ? '' : 's'}?`,
      description: `${all ? 'That is everything shown here. ' : ''}This cannot be undone — Restore puts them back instead.`,
      confirmLabel: 'Delete forever',
      danger: true,
    });
    if (ok) {
      for (const id of selected) dispatch(deleteTask(id));
      setSelected([]);
      toast(`${n} task${n === 1 ? '' : 's'} deleted permanently`, 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-[var(--fg-muted)] bg-[var(--surface-2)]';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  /* Archiving a project hides it from the Projects screen, so this is the only
     place it can be found and put back. Fetched directly because the projects
     endpoint deliberately excludes archived rows. */
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [busyProject, setBusyProject] = useState(null);

  const loadArchivedProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects?includeArchived=1');
      const data = await res.json();
      setArchivedProjects((data.projects || []).filter((p) => p.status === 'archived'));
    } catch (err) {
      console.error('Could not load archived projects:', err);
    }
  }, []);

  useEffect(() => { loadArchivedProjects(); }, [loadArchivedProjects, tasks.length]);

  const purgeProject = async (project) => {
    const ok = await confirm({
      title: `Delete “${project.name}” permanently?`,
      description: 'It has no tasks left, so there is nothing to restore.',
      confirmLabel: 'Delete forever',
      danger: true,
    });
    if (!ok) return;
    setBusyProject(project.id);
    try {
      const res = await fetch(
        `/api/projects?id=${encodeURIComponent(project.id)}&purge=1`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Delete failed');
      await loadArchivedProjects();
      dispatch(loadProjectsFromCSV());
    } catch (err) {
      console.error('Could not delete the project:', err);
      toast(`Could not delete “${project.name}”: ${err.message}`, 'error');
    } finally {
      setBusyProject(null);
    }
  };

  const restoreProject = async (project) => {
    setBusyProject(project.id);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: project.id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Restore failed');
      await loadArchivedProjects();
      dispatch(loadProjectsFromCSV());
      dispatch(loadTasksFromCSV());
    } catch (err) {
      console.error('Could not restore the project:', err);
      toast(`Could not restore “${project.name}”: ${err.message}`, 'error');
    } finally {
      setBusyProject(null);
    }
  };

  return (
    <div className="space-y-6">
      {archivedProjects.length > 0 && (
        <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <h2 className="panel-title">Archived projects</h2>
            <span className="font-mono text-[11px] tabular-nums text-[var(--fg-subtle)]">
              {archivedProjects.length}
            </span>
          </header>
          <ul className="divide-y divide-[var(--border)]">
            {archivedProjects.map((p) => {
              const count = tasks.filter(
                (t) => t.project === p.name && t.status === 'archived',
              ).length;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ background: p.color || 'var(--fg-subtle)' }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--fg)]">
                    {p.name}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--fg-subtle)]">
                    {count > 0
                      ? `${count} archived task${count === 1 ? '' : 's'}`
                      : 'empty \u2014 nothing to restore'}
                  </span>
                  <button
                    onClick={() => restoreProject(p)}
                    disabled={busyProject === p.id}
                    className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-2.5 py-1 text-[12px] font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
                  >
                    {busyProject === p.id ? 'Working…' : count > 0 ? 'Restore' : 'Reactivate'}
                  </button>
                  <button
                    onClick={() => purgeProject(p)}
                    disabled={busyProject === p.id}
                    aria-label={`Delete the project ${p.name} permanently`}
                    className="rounded-[var(--radius-sm)] border border-transparent px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-[var(--danger-soft)] disabled:opacity-50"
                    style={{ color: 'var(--danger)' }}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-[var(--border)] px-4 py-2 text-[12px] text-[var(--fg-muted)]">
            Restoring a project brings its tasks back to the status they had before archiving. Empty ones are removed automatically when their last task is deleted.
          </p>
        </section>
      )}


      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-[var(--fg)]">Archived Tasks</h1>
          <p className="text-[var(--fg-muted)] mt-1">
            {archivedTasks.length} archived task{archivedTasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="premium-card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--fg-subtle)]" fontSize="small" />
            <input
              type="text"
              placeholder="Search archived tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-strong)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent)]"
            />
          </div>

          {/* Project Filter */}
          <div className="min-w-[200px]">
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border-strong)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent)]"
            >
              <option value="">All Projects</option>
              {projects.map((project, index) => {
                const projectName = typeof project === 'string' ? project : project.name;
                return (
                  <option key={index} value={projectName}>
                    {projectName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort By */}
          <div className="min-w-[180px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border-strong)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent)]"
            >
              <option value="archivedDate">Sort by Archived Date</option>
              <option value="title">Sort by Title</option>
              <option value="project">Sort by Project</option>
            </select>
          </div>
        </div>
      </div>

      {/* Archived Tasks List */}
      {sortedTasks.length > 0 ? (
        <div className="space-y-4">
          {sortedTasks.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-[13px] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
              >
                <span className={allSelected() ? 'text-[var(--accent)]' : 'text-[var(--fg-subtle)]'}>
                  {allSelected() ? (
                    <CheckBoxIcon fontSize="small" />
                  ) : selected.length > 0 ? (
                    <CheckBoxPartialIcon fontSize="small" />
                  ) : (
                    <CheckBoxBlankIcon fontSize="small" />
                  )}
                </span>
                {selected.length > 0
                  ? `${selected.length} of ${sortedTasks.length} selected`
                  : `Select all ${sortedTasks.length}`}
              </button>

              {selected.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={bulkRestore}
                    className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-2.5 py-1 text-[12px] font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <RestoreIcon sx={{ fontSize: 15 }} />
                    Restore
                  </button>
                  <button
                    onClick={bulkDeleteForever}
                    className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--danger)' }}
                  >
                    <DeleteIcon sx={{ fontSize: 15 }} />
                    Delete forever
                  </button>
                  <button
                    onClick={() => setSelected([])}
                    aria-label="Clear selection"
                    className="rounded p-1 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </button>
                </div>
              )}
            </div>
          )}

          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`premium-card transition-all duration-200 ${
                selected.includes(task.id)
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() => toggleOne(task.id)}
                  aria-label={`${selected.includes(task.id) ? 'Deselect' : 'Select'} ${task.title}`}
                  aria-pressed={selected.includes(task.id)}
                  className={`mt-0.5 flex-none transition-colors ${
                    selected.includes(task.id)
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--fg-subtle)] hover:text-[var(--fg)]'
                  }`}
                >
                  {selected.includes(task.id) ? (
                    <CheckBoxIcon fontSize="small" />
                  ) : (
                    <CheckBoxBlankIcon fontSize="small" />
                  )}
                </button>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[var(--fg-muted)] truncate">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityIcon(task.priority)} {task.priority || 'medium'}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-[var(--fg-muted)] mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--fg-subtle)]">
                    {task.project && (
                      <div className="flex items-center gap-1">
                        <TaskIcon fontSize="small" />
                        <span>{task.project}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <ArchiveIcon fontSize="small" />
                      <span>Archived {formatDate(task.archivedAt || task.updatedAt)}</span>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon fontSize="small" />
                        <span>Due {formatDate(task.dueDate)}</span>
                      </div>
                    )}

                    {task.workingFor && (
                      <div className="flex items-center gap-1">
                        <span>👤 For: {task.workingFor}</span>
                      </div>
                    )}

                    {task.workingWith && (
                      <div className="flex items-center gap-1">
                        <span>🤝 With: {task.workingWith}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-[var(--surface-2)] text-[var(--fg-muted)] rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleRestore(task)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Restore Task"
                  >
                    <RestoreIcon fontSize="small" />
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(task.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Permanently"
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <ArchiveIcon className="mx-auto text-[var(--fg-subtle)] mb-4" style={{ fontSize: 64 }} />
          <h3 className="text-lg font-medium text-[var(--fg-muted)] mb-2">
            {archivedTasks.length === 0 ? 'No archived tasks' : 'No tasks match your filters'}
          </h3>
          <p className="text-[var(--fg-subtle)] mb-6">
            {archivedTasks.length === 0 
              ? 'Tasks you archive will appear here for future reference'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {searchTerm || filterProject ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterProject('');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      )}

      {/* Footer Stats */}
      {archivedTasks.length > 0 && (
        <div className="premium-card p-4">
          <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-[var(--fg-muted)]">
            <span>
              Showing {sortedTasks.length} of {archivedTasks.length} archived tasks
            </span>
            <span>
              Total space used by archived tasks: ~{Math.round(JSON.stringify(archivedTasks).length / 1024)} KB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}