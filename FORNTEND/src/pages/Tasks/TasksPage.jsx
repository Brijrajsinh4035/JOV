import React, { useEffect, useState, useMemo } from 'react';
import { taskApi, projectApi } from '../../api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/ui/uiSlice';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import { Skeleton, SkeletonKanban, SkeletonTable } from '../../components/common/Skeleton';
import {
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  GripVertical,
  FolderGit2,
  User,
  Filter,
  X,
  Download,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { formatDate, getInitials, exportToCSV } from '../../utils/formatters';

const KANBAN_COLUMNS = [
  {
    id: 'todo',
    title: 'To Do',
    description: 'Tasks scheduled or queued',
    accentColor: 'border-t-slate-400',
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-700',
    badgeClass: 'bg-slate-200 text-slate-700',
    icon: Clock,
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    description: 'Actively being executed',
    accentColor: 'border-t-blue-500',
    headerBg: 'bg-blue-50/70',
    headerText: 'text-blue-700',
    badgeClass: 'bg-blue-100 text-blue-800',
    icon: RefreshCw,
  },
  {
    id: 'review',
    title: 'Under Review',
    description: 'Pending QA or approval',
    accentColor: 'border-t-amber-500',
    headerBg: 'bg-amber-50/70',
    headerText: 'text-amber-700',
    badgeClass: 'bg-amber-100 text-amber-800',
    icon: AlertCircle,
  },
  {
    id: 'blocked',
    title: 'Blocked',
    description: 'Impediments requiring clearance',
    accentColor: 'border-t-rose-500',
    headerBg: 'bg-rose-50/70',
    headerText: 'text-rose-700',
    badgeClass: 'bg-rose-100 text-rose-800',
    icon: AlertTriangle,
  },
  {
    id: 'done',
    title: 'Completed',
    description: 'Finished & verified',
    accentColor: 'border-t-emerald-500',
    headerBg: 'bg-emerald-50/70',
    headerText: 'text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle2,
  },
];

const PRIORITY_BORDER_MAP = {
  critical: 'border-l-4 border-l-rose-500',
  high: 'border-l-4 border-l-amber-500',
  medium: 'border-l-4 border-l-blue-400',
  low: 'border-l-4 border-l-slate-300',
};

const TasksPage = () => {
  const dispatch = useAppDispatch();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View switch: 'kanban' | 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskDueDate, setTaskDueDate] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tRes, pRes] = await Promise.all([taskApi.getAll(), projectApi.getAll()]);
      setTasks(Array.isArray(tRes) ? tRes : tRes?.data || []);
      const projs = Array.isArray(pRes) ? pRes : pRes?.data || [];
      setProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0]._id || projs[0].id);
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed loading tasks' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Open Modal with pre-assigned column status
  const handleOpenCreateModal = (columnId = 'todo') => {
    setTaskStatus(columnId);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskDueDate('');
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]._id || projects[0].id);
    }
    setIsModalOpen(true);
  };

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProjectId) {
      dispatch(addToast({ type: 'error', message: 'Task title and project are required' }));
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        projectId: selectedProjectId,
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate ? new Date(taskDueDate) : null,
      };

      const res = await taskApi.create(payload);
      const created = res?.data || res;
      setTasks((prev) => [created, ...prev]);
      dispatch(addToast({ type: 'success', message: 'Task created successfully' }));
      setIsModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to create task' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move Task Status (Manual or Drag-and-Drop)
  const handleMoveStatus = async (task, nextStatus) => {
    const taskId = task._id || task.id;
    if (task.status === nextStatus) return;

    // Optimistic UI Update
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      await taskApi.update(taskId, { status: nextStatus });
      dispatch(addToast({ type: 'info', message: `Task moved to ${nextStatus.replace('-', ' ')}` }));
    } catch (err) {
      // Rollback on failure
      setTasks(prevTasks);
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to update task status' }));
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskApi.delete(taskId);
        setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));
        dispatch(addToast({ type: 'info', message: 'Task deleted' }));
      } catch (err) {
        dispatch(addToast({ type: 'error', message: err.message || 'Failed to delete task' }));
      }
    }
  };

  // Native HTML5 Drag and Drop Handlers
  const handleDragStart = (e, task) => {
    const taskId = task._id || task.id;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    // Only clear if actually leaving the column element
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => (t._id || t.id) === taskId);
    if (!task) return;

    if (task.status !== targetColumnId) {
      await handleMoveStatus(task, targetColumnId);
    }
    setDraggedTaskId(null);
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Project filter
      if (projectFilter !== 'ALL') {
        const tProjId = t.projectId?._id || t.projectId?.id || t.projectId;
        if (String(tProjId) !== String(projectFilter)) return false;
      }
      // Priority filter
      if (priorityFilter !== 'ALL') {
        if (t.priority !== priorityFilter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesProj = t.projectId?.name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesProj) return false;
      }
      return true;
    });
  }, [tasks, projectFilter, priorityFilter, searchQuery]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const review = tasks.filter((t) => t.status === 'review').length;
    const blocked = tasks.filter((t) => t.status === 'blocked').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, todo, inProgress, review, blocked, done, completionPercent };
  }, [tasks]);

  const clearFilters = () => {
    setSearchQuery('');
    setProjectFilter('ALL');
    setPriorityFilter('ALL');
  };

  const hasActiveFilters = searchQuery || projectFilter !== 'ALL' || priorityFilter !== 'ALL';

  // Check if a task is overdue
  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'done') return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const handleExportCSV = () => {
    if (!filteredTasks || filteredTasks.length === 0) {
      dispatch(
        addToast({
          type: 'warning',
          message: 'No tasks match the current filter selection to export.',
        })
      );
      return;
    }

    const headers = [
      { label: 'Task ID', key: 'id', value: (t) => (t._id || t.id || '').toString().slice(-8) },
      { label: 'Task Title', key: 'title', value: (t) => t.title || 'Untitled' },
      { label: 'Description', key: 'description', value: (t) => t.description || 'N/A' },
      {
        label: 'Linked Scheme / Project',
        key: 'project',
        value: (t) => t.projectId?.name || 'Unassigned',
      },
      { label: 'Status', key: 'status', value: (t) => (t.status || 'todo').toUpperCase() },
      { label: 'Priority', key: 'priority', value: (t) => (t.priority || 'medium').toUpperCase() },
      { label: 'Due Date', key: 'dueDate', value: (t) => formatDate(t.dueDate) },
      { label: 'Assignee', key: 'assignedTo', value: (t) => t.assignedTo?.name || 'Unassigned' },
    ];

    const projTag = projectFilter === 'ALL' ? 'all_projects' : 'project_filtered';
    const prioTag = priorityFilter === 'ALL' ? 'all_priorities' : priorityFilter.toLowerCase();
    const filename = `task_tracker_${projTag}_${prioTag}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    const success = exportToCSV(filteredTasks, headers, filename);
    if (success) {
      dispatch(
        addToast({
          type: 'success',
          message: `Exported ${filteredTasks.length} task(s) to CSV`,
        })
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shadow-2xs">
              <Layers size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Task Management
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage, drag & drop work items across development and operational workflows
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & View Toggle */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid size={15} />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table List View"
            >
              <List size={15} />
              <span>List</span>
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={loadData}
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            title={`Export ${filteredTasks.length} filtered tasks to CSV`}
          >
            Export CSV ({filteredTasks.length})
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenCreateModal('todo')}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Kanban Metric Cards & Progress */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Total Tasks</span>
            <Layers size={16} className="text-slate-400" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-12 rounded mt-2" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats.total}</div>
          )}
          <span className="text-[11px] text-slate-400 mt-1">Across all projects</span>
        </div>

        {/* To Do */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-semibold">To Do</span>
            <Clock size={16} className="text-slate-400" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-12 rounded mt-2" />
          ) : (
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-2">{stats.todo}</div>
          )}
          <span className="text-[11px] text-slate-400 mt-1">Queued items</span>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
            <span className="text-xs font-semibold">In Progress</span>
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-12 rounded mt-2" />
          ) : (
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-2">{stats.inProgress}</div>
          )}
          <span className="text-[11px] text-blue-500/80 mt-1">Active development</span>
        </div>

        {/* Review */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-semibold">Review</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-12 rounded mt-2" />
          ) : (
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-2">{stats.review}</div>
          )}
          <span className="text-[11px] text-amber-600/80 mt-1">Pending approval</span>
        </div>

        {/* Blocked */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
            <span className="text-xs font-semibold">Blocked</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-12 rounded mt-2" />
          ) : (
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-2">{stats.blocked}</div>
          )}
          <span className="text-[11px] text-rose-600/80 mt-1">Needs attention</span>
        </div>

        {/* Done / Completion */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-semibold">Completion</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-16 rounded mt-2" />
          ) : (
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.done}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">({stats.completionPercent}%)</span>
            </div>
          )}
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-0 sm:min-w-[240px] flex-1 sm:max-w-xs w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search tasks or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <FolderGit2 size={13} className="text-slate-400" />
              Project:
            </span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Filter size={13} className="text-slate-400" />
              Priority:
            </span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Clear Filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <X size={12} />
              Reset Filters
            </button>
          )}
        </div>

        {/* Task Counter */}
        <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
          Showing <span className="text-slate-900 font-bold">{filteredTasks.length}</span> of{' '}
          <span className="text-slate-900 font-bold">{tasks.length}</span> tasks
        </div>
      </div>

      {/* MAIN VIEW: KANBAN BOARD OR LIST */}
      {isLoading ? (
        viewMode === 'kanban' ? <SkeletonKanban /> : <SkeletonTable rows={6} columns={6} />
      ) : viewMode === 'kanban' ? (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4.5 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const ColumnIcon = col.icon;
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isColumnDropTarget = dragOverColumnId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-2xl border transition-all duration-200 flex flex-col min-h-[520px] ${
                  isColumnDropTarget
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/40 shadow-md'
                    : 'bg-slate-100/70 border-slate-200/90 shadow-2xs'
                }`}
              >
                {/* Column Header */}
                <div
                  className={`p-3.5 rounded-t-2xl border-b border-slate-200/80 border-t-4 ${col.accentColor} ${col.headerBg} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <ColumnIcon size={16} className={col.headerText} />
                    <span className={`font-bold text-sm tracking-tight ${col.headerText}`}>
                      {col.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeClass}`}
                    >
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Quick Add Card to this Column */}
                  <button
                    onClick={() => handleOpenCreateModal(col.id)}
                    title={`Add task to ${col.title}`}
                    className="p-1.5 rounded-lg hover:bg-white/80 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Column Tasks List / Drop Zone */}
                <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[75vh]">
                  {colTasks.length === 0 ? (
                    <div
                      className={`h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-colors ${
                        isColumnDropTarget
                          ? 'border-blue-400 bg-blue-100/40 text-blue-700'
                          : 'border-slate-200 bg-white/40 text-slate-400'
                      }`}
                    >
                      <ColumnIcon size={20} className="mb-1.5 opacity-50" />
                      <span className="text-xs font-semibold">
                        {isColumnDropTarget ? 'Drop task here' : 'No tasks in this column'}
                      </span>
                      <button
                        onClick={() => handleOpenCreateModal(col.id)}
                        className="mt-2 text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        + Add task
                      </button>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const taskId = task._id || task.id;
                      const projName = task.projectId?.name || 'Assigned Project';
                      const isBeingDragged = draggedTaskId === taskId;
                      const overdue = isOverdue(task);
                      const priorityBorder =
                        PRIORITY_BORDER_MAP[task.priority] || 'border-l-4 border-l-slate-300';

                      return (
                        <div
                          key={taskId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          className={`group bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-150 p-3.5 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing select-none ${priorityBorder} ${
                            isBeingDragged ? 'opacity-30 scale-95 ring-2 ring-blue-500' : ''
                          }`}
                        >
                          {/* Card Top: Drag Handle + Project Pill + Priority */}
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="text-slate-300 group-hover:text-slate-500 transition-colors"
                                title="Drag to move"
                              >
                                <GripVertical size={14} />
                              </span>
                              <span
                                title={projName}
                                className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[120px] uppercase tracking-wider"
                              >
                                {projName}
                              </span>
                            </div>
                            <Badge status={task.priority} />
                          </div>

                          {/* Card Title & Description */}
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Card Footer: Due Date, Assignee, Actions */}
                          <div className="flex items-center justify-between pt-2 mt-0.5 border-t border-slate-100 text-[11px]">
                            {/* Left: Due Date or Overdue Badge */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`flex items-center gap-1 font-semibold ${
                                  overdue ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded' : 'text-slate-400'
                                }`}
                                title={overdue ? 'Task is past due date!' : 'Due Date'}
                              >
                                <Calendar size={12} />
                                {formatDate(task.dueDate)}
                              </span>

                              {task.assignedTo && (
                                <span
                                  title={`Assigned to ${task.assignedTo?.username || 'User'}`}
                                  className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[9px] flex items-center justify-center border border-blue-200 uppercase"
                                >
                                  {getInitials(task.assignedTo?.username || 'Gov')}
                                </span>
                              )}
                            </div>

                            {/* Right: Quick Advance / Revert Buttons + Delete */}
                            <div className="flex items-center gap-0.5">
                              {/* Move Left */}
                              {col.id !== 'todo' && (
                                <button
                                  onClick={() =>
                                    handleMoveStatus(
                                      task,
                                      col.id === 'done'
                                        ? 'review'
                                        : col.id === 'blocked'
                                        ? 'in-progress'
                                        : col.id === 'review'
                                        ? 'in-progress'
                                        : 'todo'
                                    )
                                  }
                                  title="Move to previous status"
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                >
                                  <ArrowLeft size={13} />
                                </button>
                              )}

                              {/* Move Right */}
                              {col.id !== 'done' && (
                                <button
                                  onClick={() =>
                                    handleMoveStatus(
                                      task,
                                      col.id === 'todo'
                                        ? 'in-progress'
                                        : col.id === 'in-progress'
                                        ? 'review'
                                        : col.id === 'blocked'
                                        ? 'in-progress'
                                        : 'done'
                                    )
                                  }
                                  title="Advance to next status"
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                >
                                  <ArrowRight size={13} />
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteTask(taskId)}
                                title="Delete task"
                                className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Quick Card Insertion Button at Bottom of Column */}
                  <button
                    onClick={() => handleOpenCreateModal(col.id)}
                    className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-white rounded-xl text-xs font-semibold text-slate-500 hover:text-blue-600 transition-all flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add card</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE / LIST VIEW ================= */
        <div className="flex flex-col gap-3">
          {/* Desktop & Tablet Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Task Details</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No tasks match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const taskId = task._id || task.id;
                      const projName = task.projectId?.name || 'Unassigned Project';
                      const overdue = isOverdue(task);

                      return (
                        <tr key={taskId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm">{task.title}</div>
                            {task.description && (
                              <div className="text-slate-500 text-xs line-clamp-1 mt-0.5">
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                              {projName}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={task.status}
                              onChange={(e) => handleMoveStatus(task, e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 capitalize cursor-pointer"
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="blocked">Blocked</option>
                              <option value="done">Done</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <Badge status={task.priority} />
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={
                                overdue
                                  ? 'text-rose-600 font-bold flex items-center gap-1'
                                  : 'text-slate-600'
                              }
                            >
                              {formatDate(task.dueDate)}
                              {overdue && <AlertTriangle size={12} />}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {task.assignedTo?.username ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[9px] flex items-center justify-center border border-blue-200 uppercase">
                                  {getInitials(task.assignedTo.username)}
                                </span>
                                {task.assignedTo.username}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteTask(taskId)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Task Cards for List View */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
                No tasks match the selected filters.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const taskId = task._id || task.id;
                const projName = task.projectId?.name || 'Unassigned Project';
                const overdue = isOverdue(task);

                return (
                  <div
                    key={taskId}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit mb-1">
                          {projName}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug break-words">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge status={task.priority} className="shrink-0" />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <select
                        value={task.status}
                        onChange={(e) => handleMoveStatus(task, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 capitalize"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                      </select>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${
                            overdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {formatDate(task.dueDate)}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(taskId)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CREATE WORK ITEM MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Work Item"
      >
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assign to Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              required
            >
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Task Title *"
            placeholder="e.g., Conduct Environmental Clearance Inspection"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Outline specific objectives, deliverables, or dependencies..."
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Initial Status
              </label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 capitalize"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 capitalize"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Due Date
              </label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksPage;
