import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchProjects,
  selectFilteredProjects,
  selectProjectsLoading,
  selectProjectsFilters,
  setStatusFilter,
  setSearchQuery,
  resetFilters,
  updateProjectStatusThunk,
  deleteProjectThunk,
} from '../../features/projects/projectSlice';
import { selectIsAdmin } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import { projectApi } from '../../api';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import { Skeleton, SkeletonCardList } from '../../components/common/Skeleton';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  RefreshCw,
  Edit3,
  Trash2,
  Calendar,
  Building2,
  User,
  X,
  Download,
} from 'lucide-react';
import {
  formatCrores,
  formatDate,
  exportToExcelReadOnly,
  calculateProgress,
  toCrores,
  toRawINR,
} from '../../utils/formatters';

const statusOptions = ['ALL', 'planning', 'active', 'on-hold', 'completed', 'cancelled'];

const ProjectsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const projects = useAppSelector(selectFilteredProjects);
  const isLoading = useAppSelector(selectProjectsLoading);
  const filters = useAppSelector(selectProjectsFilters);
  const isAdmin = useAppSelector(selectIsAdmin);

  const todayStr = new Date().toISOString().split('T')[0];

  // Edit Project Details modal state
  const [selectedProjectToEdit, setSelectedProjectToEdit] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editUsedBudget, setEditUsedBudget] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editStatus, setEditStatus] = useState('planning');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleOpenEditModal = (project) => {
    setSelectedProjectToEdit(project);
    setEditName(project.name || '');
    setEditDesc(project.description || '');
    setEditDepartment(project.department || '');
    // Convert from raw INR to clean Crores representation (e.g. 500000000 -> 50)
    setEditBudget(toCrores(project.budget));
    setEditUsedBudget(toCrores(project.usedbudget ?? project.utilizedBudget));
    setEditPriority(project.priority || 'medium');
    setEditStatus(project.status || 'planning');
    setEditStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
    setEditEndDate(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '');
    setEditModalOpen(true);
  };

  const handleSaveProjectEdit = async (e) => {
    e?.preventDefault?.();
    if (!selectedProjectToEdit) return;
    if (!editName.trim()) {
      dispatch(addToast({ type: 'error', message: 'Project name is required' }));
      return;
    }

    const numBudget = Number(editBudget || 0);
    const numUsed = Number(editUsedBudget || 0);

    // Strict validation exception: Utilized Outlay must not be higher than Sanctioned Budget!
    if (numUsed > numBudget) {
      dispatch(
        addToast({
          type: 'error',
          message: `Validation Error: Utilized Outlay (₹${numUsed} Cr) cannot exceed Sanctioned Budget (₹${numBudget} Cr).`,
        })
      );
      return;
    }

    const projId = selectedProjectToEdit._id || selectedProjectToEdit.id;
    const parsedBudget = toRawINR(editBudget);
    const parsedUsed = toRawINR(editUsedBudget);

    try {
      setIsUpdatingProject(true);
      await projectApi.update(projId, {
        name: editName.trim(),
        description: editDesc.trim(),
        department: editDepartment.trim(),
        budget: parsedBudget,
        usedbudget: parsedUsed,
        utilizedBudget: parsedUsed,
        priority: editPriority,
        status: editStatus,
        startDate: editStartDate ? new Date(editStartDate) : null,
        endDate: editEndDate ? new Date(editEndDate) : null,
      });

      dispatch(addToast({ type: 'success', message: 'Project details updated successfully' }));
      setEditModalOpen(false);
      dispatch(fetchProjects());
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed updating project details' }));
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleDeleteProject = async (project) => {
    const projId = project._id || project.id;
    if (window.confirm(`Are you sure you want to remove project "${project.name}"?`)) {
      await dispatch(deleteProjectThunk(projId));
      dispatch(addToast({ type: 'info', message: `Project removed from registry.` }));
    }
  };

  const handleExportExcel = () => {
    if (!projects || projects.length === 0) {
      dispatch(addToast({ type: 'warning', message: 'No projects match the current filter to export.' }));
      return;
    }

    const headers = [
      { label: 'Scheme Code', key: 'code', value: (p) => p.code || p.id || 'N/A' },
      { label: 'Scheme Name', key: 'name', value: (p) => p.name || p.title || 'Untitled' },
      { label: 'Ministry / Department', key: 'department', value: (p) => p.department || p.ministry || 'N/A' },
      { label: 'Sponsoring Client', key: 'client', value: (p) => p.clientId?.name || p.clientId?.company || 'Central Ministry' },
      { label: 'Status', key: 'status', value: (p) => (p.status || 'active').toUpperCase() },
      { label: 'Priority', key: 'priority', value: (p) => p.priority || 'Medium' },
      { label: 'Sanctioned Budget (Cr)', key: 'budget', value: (p) => formatCrores(p.budget) },
      { label: 'Expenditure Incurred (Cr)', key: 'usedbudget', value: (p) => formatCrores(p.usedbudget || p.utilizedBudget) },
      { label: 'Progress (%)', key: 'progress', value: (p) => `${p.progress || 0}%` },
      { label: 'Start Date', key: 'startDate', value: (p) => formatDate(p.startDate) },
      { label: 'Target Completion Date', key: 'endDate', value: (p) => formatDate(p.endDate || p.expectedCompletionDate) },
      { label: 'Nodal Officer', key: 'officer', value: (p) => p.responsibleOfficer || p.ownerId?.name || 'N/A' },
    ];

    const filterTag = filters.status === 'ALL' ? 'all' : filters.status.toLowerCase();
    const filename = `projects_directory_${filterTag}_${new Date().toISOString().slice(0, 10)}.xls`;

    const success = exportToExcelReadOnly(projects, headers, filename, 'Projects Directory');
    if (success) {
      dispatch(
        addToast({
          type: 'success',
          message: `Exported ${projects.length} project(s) (${filters.status.toUpperCase()} filter) to Read-Only Excel`,
        })
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Government Projects Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Official registry of high-impact public infrastructure schemes and capital projects
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={() => dispatch(fetchProjects())}
            className="flex-1 sm:flex-initial"
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial"
            title={`Export ${projects.length} currently filtered projects to Read-Only Excel`}
          >
            Export Excel (Read-Only) ({projects.length})
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => navigate('/projects/new')}
              className="flex-1 sm:flex-initial"
            >
              Register Project
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-0 w-full sm:max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search schemes by title or description..."
            value={filters.search}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => dispatch(setSearchQuery(''))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter & Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter size={13} /> Filter:
          </span>

          <select
            value={filters.status}
            onChange={(e) => dispatch(setStatusFilter(e.target.value))}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                Status: {status.toUpperCase()}
              </option>
            ))}
          </select>

          {(filters.search || filters.status !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(resetFilters())}
              className="text-xs text-rose-600 hover:bg-rose-50"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* DESKTOP & TABLET: Comprehensive Data Table (hidden on mobile < md) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5">Scheme Name</th>
              <th className="px-4 py-3.5">Client / Nodal Body</th>
              <th className="px-4 py-3.5">Sanctioned Budget</th>
              <th className="px-4 py-3.5">Utilized Outlay</th>
              <th className="px-4 py-3.5">Timeline</th>
              <th className="px-4 py-3.5">Assigned Officer</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Progress</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-row-${i}`} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-28" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-2 w-20 rounded-full" /></td>
                  <td className="px-4 py-3.5 text-right"><Skeleton className="h-7 w-16 ml-auto rounded-lg" /></td>
                </tr>
              ))
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  No projects matched the selected filters.
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const projId = project._id || project.id;
                const budget = Number(project.budget || 0);
                const used = Number(project.usedbudget ?? project.utilizedBudget ?? 0);
                const progressPct = calculateProgress(budget, used);
                const clientName = project.clientId?.name || 'N/A';
                const teamOrOwner =
                  project.teamId?.name || project.ownerId?.username || 'Mission Cell';

                return (
                  <tr
                    key={projId}
                    onClick={() => navigate(`/projects/${projId}`)}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-700/40 cursor-pointer transition-colors group"
                  >
                    {/* Name */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="flex flex-col">
                        <span
                          className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors"
                          title={`View project details for ${project.name}`}
                        >
                          {project.name}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {project.description || 'Infrastructure Scheme'}
                        </span>
                      </div>
                    </td>

                    {/* Client / Agency */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[160px] truncate">
                      {clientName}
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {formatCrores(budget)}
                    </td>

                    {/* Utilized */}
                    <td className="px-4 py-3.5 font-semibold text-emerald-600">
                      {formatCrores(used)}
                    </td>

                    {/* Timeline */}
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <div>{formatDate(project.startDate)}</div>
                      <div className="text-slate-400 text-[11px]">
                        to {formatDate(project.endDate)}
                      </div>
                    </td>

                    {/* Assigned */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 truncate max-w-[140px]">
                      {teamOrOwner}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <Badge status={project.status} />
                    </td>

                    {/* Expenditure Progress */}
                    <td className="px-4 py-3.5 min-w-[100px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              project.status === 'completed'
                                ? 'bg-emerald-500'
                                : progressPct > 80
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600">
                          {progressPct}%
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${projId}`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(project);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Scheme Details"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE: High-Fidelity Responsive Project Cards (displayed on < md) */}
      <div className="md:hidden flex flex-col gap-3.5">
        {isLoading ? (
          <SkeletonCardList count={4} />
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
            No projects matched the selected filters.
          </div>
        ) : (
          projects.map((project) => {
            const projId = project._id || project.id;
            const budget = Number(project.budget || 0);
            const used = Number(project.usedbudget ?? project.utilizedBudget ?? 0);
            const progressPct = calculateProgress(budget, used);
            const clientName = project.clientId?.name || 'Central Nodal Agency';
            const teamOrOwner =
              project.teamId?.name || project.ownerId?.username || 'Executive Officer';

            return (
              <div
                key={projId}
                onClick={() => navigate(`/projects/${projId}`)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3 cursor-pointer hover:border-blue-300 transition-all group"
              >
                {/* Top Row: Name + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm leading-snug break-words text-slate-900 group-hover:text-blue-700 transition-colors">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Badge status={project.status} className="shrink-0" />
                </div>

                {/* Client & Officer Tags */}
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80 font-medium truncate max-w-[160px]">
                    <Building2 size={12} className="text-slate-400 shrink-0" />
                    {clientName}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80 font-medium truncate max-w-[140px]">
                    <User size={12} className="text-slate-400 shrink-0" />
                    {teamOrOwner}
                  </span>
                </div>

                {/* Financials & Progress Bar */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Sanctioned: <strong>{formatCrores(budget)}</strong></span>
                    <span className="text-emerald-700 font-semibold">Incurred: {formatCrores(used)}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{progressPct}%</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <span>
                    {formatDate(project.startDate)} → {formatDate(project.endDate)}
                  </span>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Eye}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${projId}`);
                    }}
                    className="flex-1 text-xs justify-center"
                  >
                    View Details
                  </Button>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(project);
                        }}
                        className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title="Edit Scheme Details"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* EDIT PROJECT SCHEME MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => !isUpdatingProject && setEditModalOpen(false)}
        title="Edit Infrastructure Scheme Details"
      >
        <form onSubmit={handleSaveProjectEdit} className="flex flex-col gap-4">
          <Input
            label="Scheme Title *"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Official Scheme Name"
            required
            disabled={isUpdatingProject}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description & Scope
            </label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Outline project objectives, deliverables, and scope..."
              disabled={isUpdatingProject}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <Input
              label="Ministry / Sponsoring Department"
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              placeholder="e.g. Ministry of Road Transport & Highways"
              disabled={isUpdatingProject}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Sanctioned Budget (₹ Cr) *"
              type="number"
              step="any"
              min="0"
              value={editBudget}
              onChange={(e) => setEditBudget(e.target.value)}
              placeholder="e.g. 50 or 500"
              required
              disabled={isUpdatingProject}
              helperText={editBudget ? `₹${editBudget} Cr` : undefined}
            />

            <Input
              label="Utilized Outlay (₹ Cr) *"
              type="number"
              step="any"
              min="0"
              value={editUsedBudget}
              onChange={(e) => setEditUsedBudget(e.target.value)}
              placeholder="e.g. 40 or 420"
              required
              disabled={isUpdatingProject}
              helperText={editUsedBudget ? `₹${editUsedBudget} Cr` : undefined}
              error={
                Number(editUsedBudget) > Number(editBudget)
                  ? `Utilized Outlay cannot exceed Sanctioned Budget (Max: ₹${editBudget || 0} Cr)`
                  : undefined
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority Tier
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                disabled={isUpdatingProject}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 uppercase"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Operational Lifecycle Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                disabled={isUpdatingProject}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 uppercase"
              >
                <option value="planning">PLANNING</option>
                <option value="active">ACTIVE</option>
                <option value="on-hold">ON-HOLD</option>
                <option value="completed">COMPLETED</option>
                <option value="cancelled">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Start Date"
              type="date"
              min={todayStr}
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
              disabled={isUpdatingProject}
            />

            <Input
              label="Target Completion Date"
              type="date"
              min={todayStr}
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
              disabled={isUpdatingProject}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2.5 pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setEditModalOpen(false)}
              disabled={isUpdatingProject}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isUpdatingProject}
              isLoading={isUpdatingProject}
            >
              Save Project Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
