"use client";
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addTask, updateTask } from '../redux/slices/taskSlice';
import { Close as CloseIcon, Add as PlusIcon } from '@mui/icons-material';
import DocumentManager from './DocumentManager';
import { useFeedback } from './ui/Feedback';
import { uploadPendingDocuments } from '../lib/uploadPending.mjs';

/**
 * A labelled group of fields.
 *
 * The form was ten field groups in a flat column, so the eye had to re-read
 * every label to find anything. Sections give it a shape you can scan.
 */
function Section({ title, hint, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2 border-b border-[var(--border)] pb-1.5">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          {title}
        </h3>
        {hint && <span className="text-[11px] text-[var(--fg-subtle)]">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export default function TaskForm({ editingTask, onClose, projects }) {
  const { confirm } = useFeedback();
  const titleRef = React.useRef(null);
  const [touched, setTouched] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [creatingProject, setCreatingProject] = React.useState(false);

  /* Every edit goes through here, so "are there unsaved changes?" has a single
     honest answer rather than a guess based on comparing objects. */
  const update = (patch) => {
    setDirty(true);
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const dispatch = useDispatch();
  
  // Helper function to format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // Helper function to safely parse arrays from string or return array
  const safeParseArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return [];
  };
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    recurrence: '',
    tags: [],
    workingFor: '',
    workingWith: '',
    checkpoints: [],
    documents: []
  });

  // Update form data when editingTask changes
  useEffect(() => {
    /* Loading a task into the form is not a user edit, so the unsaved-changes
       guard stays quiet until they actually touch something. */
    setDirty(false);
    setTouched(false);
    setCreatingProject(false);
    if (editingTask) {
      setFormData({
        title: editingTask.title || '',
        description: editingTask.description || '',
        project: editingTask.project || '',
        priority: editingTask.priority || 'medium',
        status: editingTask.status || 'todo',
        dueDate: formatDateForInput(editingTask.dueDate),
        recurrence: editingTask.recurrence || '',
        tags: safeParseArray(editingTask.tags),
        workingFor: editingTask.workingFor || '',
        workingWith: editingTask.workingWith || '',
        checkpoints: safeParseArray(editingTask.checkpoints),
        documents: safeParseArray(editingTask.documents)
      });
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        project: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        recurrence: '',
        tags: [],
        workingFor: '',
        workingWith: '',
        checkpoints: [],
        documents: []
      });
    }
  }, [editingTask]);

  const titleError =
    touched && !String(formData?.title ?? '').trim() ? 'A task needs a title.' : null;

  const [newTag, setNewTag] = useState('');
  const [newCheckpoint, setNewCheckpoint] = useState('');

  const addCheckpoint = () => {
    if (newCheckpoint.trim()) {
      update({
        checkpoints: [...formData.checkpoints, {
          id: Date.now(),
          text: newCheckpoint.trim(),
          completed: false,
          createdAt: new Date().toISOString()
        }]
      });
      setNewCheckpoint('');
    }
  };

  const removeCheckpoint = (checkpointId) => {
    update({ checkpoints: formData.checkpoints.filter(cp => cp.id !== checkpointId) });
  };

  const toggleCheckpoint = (checkpointId) => {
    update({
      checkpoints: formData.checkpoints.map(cp =>
        cp.id === checkpointId ? { ...cp, completed: !cp.completed } : cp
      )
    });
  };

  const handleDocumentsChange = (documents) => {
    update({ documents: documents });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      /* `required` only shows a browser bubble, which vanishes on the next
         click and says nothing about which field. */
      setTouched(true);
      titleRef.current?.focus();
      return;
    }

    // Properly format the due date
    const formattedDueDate = formData.dueDate 
      ? new Date(formData.dueDate + 'T00:00:00.000Z').toISOString()
      : '';

    const taskData = {
      ...formData,
      id: editingTask?.id || `task-${Date.now()}`,
      dueDate: formattedDueDate,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeTracking: editingTask?.timeTracking || { totalTime: 0, isRunning: false },
      // Ensure arrays are properly formatted
      tags: Array.isArray(formData.tags) ? formData.tags : [],
      checkpoints: Array.isArray(formData.checkpoints) ? formData.checkpoints : [],
      documents: Array.isArray(formData.documents) ? formData.documents : [],
      recurrence: formData.recurrence || '',
      /* The server refuses to invent a project unless it is asked to. */
      allowNewProject: creatingProject
    };

    if (editingTask) {
      await dispatch(updateTask(taskData));
    } else {
      /* Create first: files can only be attached to a task that exists. */
      await dispatch(addTask(taskData));
      const stored = await uploadPendingDocuments(taskData.documents, taskData.id);
      if (stored.some((d, i) => d !== taskData.documents[i])) {
        await dispatch(updateTask({ ...taskData, documents: stored }));
      }
    }

    onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      update({ tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  /* Closing with unsaved edits used to discard them without a word. */
  const requestClose = async () => {
    if (!dirty) return onClose();
    const ok = await confirm({
      title: 'Discard your changes?',
      description: 'This task has edits that have not been saved.',
      confirmLabel: 'Discard',
      danger: true,
    });
    if (ok) onClose();
  };

  const removeTag = (tagToRemove) => {
    update({ tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-[rgb(13_17_23/0.55)] backdrop-blur-[2px] p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg sm:max-h-[90dvh] sm:rounded-xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-[var(--fg)]">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="font-mono text-[11px] text-[var(--accent-2)]">Unsaved</span>
            )}
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="rounded-lg p-2 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <Section title="Basics">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
              Task Title *
            </label>
            <input
              ref={titleRef}
              type="text"
              value={formData.title || ''}
              onChange={(e) => update({ title: e.target.value })}
              onBlur={() => setTouched(true)}
              aria-invalid={titleError ? 'true' : undefined}
              aria-describedby={titleError ? 'task-title-error' : undefined}
              className={`w-full rounded-lg border bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                titleError
                  ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                  : 'border-[var(--border-strong)] focus:border-[var(--accent)]'
              }`}
              placeholder="What needs doing?"
            />
            {titleError && (
              <p id="task-title-error" role="alert" className="mt-1.5 text-[12px] text-[var(--danger)]">
                {titleError}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              placeholder="Describe the task..."
            />
          </div>

          </Section>

          <Section title="Where it sits">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Project
              </label>
              {/* Free text here meant a one-character typo silently created a
                  whole new project. Picking from the list cannot misfire, and
                  a new project is now something you choose to do. */}
              {creatingProject ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={formData.project}
                    onChange={(e) => update({ project: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setCreatingProject(false);
                        update({ project: editingTask?.project || "" });
                      }
                    }}
                    className="w-full rounded-lg border border-[var(--accent)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    placeholder="New project name"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCreatingProject(false);
                      update({ project: editingTask?.project || "" });
                    }}
                    className="flex-shrink-0 rounded-lg px-3 text-[13px] text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={formData.project}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setCreatingProject(true);
                      update({ project: "" });
                    } else {
                      update({ project: e.target.value });
                    }
                  }}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  <option value="">No project</option>
                  {projects.map((project) => {
                    const name = project.name || project;
                    return (
                      <option key={project.id || name} value={name}>
                        {name}
                      </option>
                    );
                  })}
                  <option value="__new__">+ New project…</option>
                </select>
              )}
              <p className="mt-1 text-[11px] text-[var(--fg-subtle)]">
                {creatingProject
                  ? "This project is created when you save the task."
                  : "Pick one, or create a new project deliberately."}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => update({ priority: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          </Section>

          <Section title="Schedule">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => update({ status: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On hold</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => update({ dueDate: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>
          </div>

          {/* Repeats — completing the task schedules the next occurrence, so
              standing work no longer has to be duplicated and re-dated. */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
              Repeats
            </label>
            <select
              value={formData.recurrence || ''}
              onChange={(e) => update({ recurrence: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] md:w-1/2"
            >
              <option value="">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Every weekday</option>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Every two weeks</option>
              <option value="monthly">Monthly</option>
            </select>
            {formData.recurrence && (
              <p className="mt-1.5 text-[12px] text-[var(--fg-subtle)]">
                Completing this task creates the next one automatically
                {formData.dueDate ? ", dated from this one's due date" : ""}.
              </p>
            )}
          </div>

          </Section>

          <Section title="Detail" hint="Optional">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn-primary text-sm"
              >
                <PlusIcon fontSize="small" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Working For
              </label>
              <input
                type="text"
                value={formData.workingFor || ''}
                onChange={(e) => update({ workingFor: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Who is this task for?"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
                Working With
              </label>
              <input
                type="text"
                value={formData.workingWith || ''}
                onChange={(e) => update({ workingWith: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--fg)] transition-colors placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Who are you working with?"
              />
            </div>
          </div>

          {/* Checkpoints Section */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--fg-muted)]">
              Checkpoints
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Add checkpoints to track progress and validate task completion
            </p>
            
            {/* Add New Checkpoint */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCheckpoint}
                onChange={(e) => setNewCheckpoint(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCheckpoint())}
                className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Add a checkpoint (e.g., Setup database connection)"
              />
              <button
                type="button"
                onClick={addCheckpoint}
                disabled={!newCheckpoint.trim()}
                className="btn-primary text-sm"
              >
                <PlusIcon fontSize="small" />
              </button>
            </div>

            {/* Checkpoint List */}
            {formData.checkpoints && formData.checkpoints.length > 0 && (
              <div className="border border-gray-200 rounded-lg">
                <div className="max-h-48 overflow-y-auto">
                  {formData.checkpoints.map((checkpoint, index) => (
                    <div
                      key={checkpoint.id}
                      className={`flex items-center gap-3 p-3 ${index < formData.checkpoints.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50`}
                    >
                      <input
                        type="checkbox"
                        checked={checkpoint.completed}
                        onChange={() => toggleCheckpoint(checkpoint.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`flex-1 text-sm ${checkpoint.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                        {checkpoint.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCheckpoint(checkpoint.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove checkpoint"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Checkpoint Progress */}
                <div className="p-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                  Progress: {formData.checkpoints.filter(cp => cp.completed).length} / {formData.checkpoints.length} completed
                  ({Math.round((formData.checkpoints.filter(cp => cp.completed).length / formData.checkpoints.length) * 100)}%)
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(formData.checkpoints.filter(cp => cp.completed).length / formData.checkpoints.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="space-y-3">

            <DocumentManager
              taskId={editingTask?.id || null}
              documents={formData.documents || []}
              onDocumentsChange={handleDocumentsChange}
              darkMode={false}
              maxFiles={10}
            />
          </div>

          </Section>

          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={requestClose}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-sm"
            >
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
