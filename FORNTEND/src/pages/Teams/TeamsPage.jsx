import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamApi, userApi, masterApi, projectApi } from '../../api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectIsAdmin } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Modal from '../../components/common/Modal/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal/ConfirmationModal';
import Pagination from '../../components/common/Pagination/Pagination';
import { Skeleton } from '../../components/common/Skeleton';
import {
  Users,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  FolderKanban,
  UserCheck,
  User,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { getInitials } from '../../utils/formatters';

const TeamsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAdmin = useAppSelector(selectIsAdmin);

  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    members: [],
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tRes, dRes, uRes, pRes] = await Promise.allSettled([
        teamApi.getAll(),
        masterApi.getDepartments(),
        userApi.getAll(),
        projectApi.getAll(),
      ]);

      if (tRes.status === 'fulfilled') {
        const tData = tRes.value;
        setTeams(Array.isArray(tData) ? tData : tData?.data || []);
      }
      if (dRes.status === 'fulfilled') {
        const dData = dRes.value;
        setDepartments(Array.isArray(dData) ? dData : dData?.data || []);
      }
      if (uRes.status === 'fulfilled') {
        const uData = uRes.value;
        setUsers(Array.isArray(uData) ? uData : uData?.data || []);
      }
      if (pRes.status === 'fulfilled') {
        const pData = pRes.value;
        const list = pData?.data?.data || (Array.isArray(pData?.data) ? pData.data : Array.isArray(pData) ? pData : []);
        setProjects(list);
      }
    } catch (err) {
      console.error('Failed to load teams data', err);
      dispatch(addToast({ type: 'error', message: 'Failed to load teams directory' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setFormData({ name: '', departmentId: '', members: [] });
    setMemberSearchQuery('');
    setFormError('');
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    const memberIds = (team.members || []).map((m) =>
      typeof m === 'object' ? m._id || m.id : m
    );
    setFormData({
      name: team.name || '',
      departmentId:
        typeof team.departmentId === 'object'
          ? team.departmentId?._id || team.departmentId?.id || ''
          : team.departmentId || '',
      members: memberIds,
    });
    setMemberSearchQuery('');
    setFormError('');
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleToggleMember = (userId) => {
    setFormData((prev) => {
      const exists = prev.members.includes(userId);
      return {
        ...prev,
        members: exists
          ? prev.members.filter((id) => id !== userId)
          : [...prev.members, userId],
      };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Team name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        departmentId: formData.departmentId || null,
        members: formData.members,
      };

      if (modalMode === 'edit' && editingTeam) {
        const id = editingTeam._id || editingTeam.id;
        await teamApi.update(id, payload);
        dispatch(addToast({ type: 'success', message: 'Project team updated successfully!' }));
      } else {
        await teamApi.create(payload);
        dispatch(addToast({ type: 'success', message: 'New project team created!' }));
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save team details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = (id, teamName) => {
    setTeamToDelete({ id, name: teamName });
  };

  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete || deletingTeamId) return;
    try {
      setDeletingTeamId(teamToDelete.id);
      await teamApi.delete(teamToDelete.id);
      dispatch(addToast({ type: 'info', message: `Team "${teamToDelete.name}" deleted.` }));
      setTeamToDelete(null);
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to delete team' }));
    } finally {
      setDeletingTeamId(null);
    }
  };

  // Filtered teams
  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase();
    const deptName =
      typeof t.departmentId === 'object' ? t.departmentId?.name || '' : '';
    const deptId =
      typeof t.departmentId === 'object' ? t.departmentId?._id || t.departmentId?.id : t.departmentId;

    const matchesSearch =
      (t.name || '').toLowerCase().includes(q) ||
      deptName.toLowerCase().includes(q) ||
      (t.members || []).some((m) =>
        typeof m === 'object'
          ? (m.name || m.username || '').toLowerCase().includes(q)
          : false
      );

    const matchesDept =
      departmentFilter === 'ALL' || deptId === departmentFilter;

    return matchesSearch && matchesDept;
  });

  // Reset page when search or department changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter]);

  // Paginated teams
  const paginatedTeams = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTeams.slice(startIndex, startIndex + pageSize);
  }, [filteredTeams, currentPage, pageSize]);

  // Filtered officers for assignment modal
  const filteredOfficers = users.filter((u) => {
    const q = memberSearchQuery.toLowerCase();
    return (
      (u.name || u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.designation || '').toLowerCase().includes(q)
    );
  });

  // Calculate unique assigned officers
  const allAssignedOfficerIds = new Set();
  teams.forEach((t) => {
    (t.members || []).forEach((m) => {
      const mId = typeof m === 'object' ? m._id || m.id : m;
      if (mId) allAssignedOfficerIds.add(mId);
    });
  });

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto w-full">
      {/* Top Header Card with Tricolor Border */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 absolute top-0 left-0" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Resource Allocation & Surveillance
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Project Teams & Taskforces Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Manage Central Engineering Wings, Monitoring Taskforces, Field Units, and Officer Member Assignments.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={loadData}
              disabled={isLoading}
              title="Refresh Directory"
            >
              Refresh
            </Button>

            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenCreate}
                className="bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer"
              >
                Create Project Team
              </Button>
            )}
          </div>
        </div>

        {/* Statistical Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Active Project Teams
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {isLoading ? '...' : teams.length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Assigned Nodal Officers
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
              {isLoading ? '...' : allAssignedOfficerIds.size}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Participating Ministries & Wings
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 mt-1 block">
              {isLoading ? '...' : departments.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Department Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams by name, ministry, or assigned officer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs shrink-0"
        >
          <option value="ALL">All Ministries & Departments</option>
          {departments.map((d) => (
            <option key={d._id || d.id} value={d._id || d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Teams Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Users size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {searchQuery || departmentFilter !== 'ALL' ? 'No matching teams found' : 'No project teams configured yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || departmentFilter !== 'ALL'
              ? 'Try changing your search query or department filter.'
              : 'Create your first project taskforce using the button above.'}
          </p>
          {isAdmin && !searchQuery && departmentFilter === 'ALL' && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenCreate}
              className="mt-4 bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer"
            >
              Create Project Team
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTeams.map((team) => {
            const id = team._id || team.id;
            const deptName =
              typeof team.departmentId === 'object' ? team.departmentId?.name || '' : '';
            const members = team.members || [];
            const linkedProjects = projects.filter((p) => {
              const pTeamId = typeof p.teamId === 'object' ? p.teamId?._id || p.teamId?.id : p.teamId;
              return pTeamId === id;
            });

            return (
              <div
                key={id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between gap-3.5 group relative"
              >
                <div>
                  {/* Top Team Header */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                      <Users size={20} />
                    </div>

                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(team)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Team"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeam(id, team.name)}
                            disabled={deletingTeamId === id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Delete Team"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Team Title & Department */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {team.name}
                  </h3>
                  {deptName && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200/80 dark:border-emerald-900/50">
                      {deptName}
                    </span>
                  )}

                  {/* Assigned Members Section */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Assigned Officers ({members.length})
                    </span>

                    {members.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No officers assigned yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {members.map((m, idx) => {
                          const mName = typeof m === 'object' ? m.name || m.username || 'Officer' : 'Officer';
                          const mEmail = typeof m === 'object' ? m.email || '' : '';
                          const mRole = typeof m === 'object' ? m.role || 'manager' : 'manager';

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {getInitials(mName)}
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                                  {mName}
                                </span>
                              </div>

                              <span
                                className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase shrink-0 ${
                                  mRole === 'admin'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                }`}
                              >
                                {mRole.toUpperCase() === 'USER' ? 'MANAGER' : mRole.toUpperCase()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Linked Schemes */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <FolderKanban size={13} className="text-slate-400" />
                    <span>{linkedProjects.length} Projects Assigned</span>
                  </span>

                  {linkedProjects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate(`/projects?team=${id}`)}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View Projects</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredTeams.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTeams.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[6, 9, 12, 24]}
        />
      )}

      {/* Create / Edit Team Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'edit' ? 'Edit Project Team / Taskforce' : 'Create Project Team / Taskforce'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Team / Taskforce Name *"
            icon={Users}
            placeholder="e.g. Western Corridor Execution Wing"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ministry / Department
            </label>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">-- Optional: Select Ministry / Department --</option>
              {departments.map((dept) => (
                <option key={dept._id || dept.id} value={dept._id || dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Member Assignment Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Assign Officers ({formData.members.length} selected)</span>
              </label>
              {formData.members.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, members: [] })}
                  className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter officers by name, email, or designation..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30">
              {filteredOfficers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching officers available.
                </div>
              ) : (
                filteredOfficers.map((user) => {
                  const uId = user._id || user.id;
                  const isChecked = formData.members.includes(uId);

                  return (
                    <label
                      key={uId}
                      className={`p-2.5 flex items-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors ${
                        isChecked ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMember(uId)}
                        disabled={isSubmitting}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                            {user.name || user.username}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {user.email} {user.designation ? `• ${user.designation}` : ''}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                            user.isAdmin || user.role === 'admin'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                          }`}
                        >
                          {user.role ? (user.role.toUpperCase() === 'USER' ? 'MANAGER' : user.role.toUpperCase()) : 'MANAGER'}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              className="bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer"
            >
              {modalMode === 'edit' ? 'Update Team' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Team Deletion */}
      <ConfirmationModal
        isOpen={!!teamToDelete}
        onClose={() => !deletingTeamId && setTeamToDelete(null)}
        onConfirm={handleConfirmDeleteTeam}
        title="Delete Project Team"
        message="Are you sure you want to delete this project team? All member assignments will be unlinked from active schemes."
        itemName={teamToDelete?.name}
        confirmText="Delete Team"
        cancelText="Cancel"
        confirmVariant="danger"
        icon={Trash2}
        isLoading={!!deletingTeamId}
      />
    </div>
  );
};

export default TeamsPage;
