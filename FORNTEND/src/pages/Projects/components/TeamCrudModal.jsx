import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal/Modal';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import { teamApi } from '../../../api';
import {
  Users,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  ArrowLeft,
  AlertCircle,
  UserCheck,
  User,
} from 'lucide-react';

/**
 * Team Management Modal (CRUD) with Department and Member Assignment
 */
const TeamCrudModal = ({
  isOpen,
  onClose,
  teams = [],
  departments = [],
  users = [],
  onTeamsUpdated,
  onSelectTeam,
  initialEditTeam = null,
  initialMode = 'manage', // 'manage' | 'create' | 'edit'
}) => {
  const [mode, setMode] = useState(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [editingTeam, setEditingTeam] = useState(initialEditTeam);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    members: [], // array of user IDs
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (initialEditTeam) {
        setEditingTeam(initialEditTeam);
        const memberIds = (initialEditTeam.members || []).map((m) =>
          typeof m === 'object' ? m._id || m.id : m
        );
        setFormData({
          name: initialEditTeam.name || '',
          departmentId:
            typeof initialEditTeam.departmentId === 'object'
              ? initialEditTeam.departmentId?._id || initialEditTeam.departmentId?.id || ''
              : initialEditTeam.departmentId || '',
          members: memberIds,
        });
      } else {
        setFormData({ name: '', departmentId: '', members: [] });
      }
      setFormError('');
      setDeleteConfirmId(null);
      setMemberSearchQuery('');
    }
  }, [isOpen, initialMode, initialEditTeam]);

  const handleStartCreate = () => {
    setEditingTeam(null);
    setFormData({ name: '', departmentId: '', members: [] });
    setFormError('');
    setMemberSearchQuery('');
    setMode('create');
  };

  const handleStartEdit = (team) => {
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
    setFormError('');
    setMemberSearchQuery('');
    setMode('edit');
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

      let savedTeam = null;
      if (mode === 'edit' && editingTeam) {
        const id = editingTeam._id || editingTeam.id;
        const res = await teamApi.update(id, payload);
        savedTeam = res?.data || res || { ...payload, _id: id, id };
      } else {
        const res = await teamApi.create(payload);
        savedTeam = res?.data || res;
      }

      if (onTeamsUpdated) {
        await onTeamsUpdated(savedTeam);
      }
      if (onSelectTeam && savedTeam) {
        onSelectTeam(savedTeam._id || savedTeam.id);
      }
      onClose();
    } catch (err) {
      console.error('Team save error:', err);
      setFormError(err.message || 'Failed to save team details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await teamApi.delete(id);
      if (onTeamsUpdated) {
        await onTeamsUpdated(null, id);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Team delete error:', err);
      setFormError(err.message || 'Failed to delete team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase();
    const deptName =
      typeof t.departmentId === 'object' ? t.departmentId?.name || '' : '';
    return (
      (t.name || '').toLowerCase().includes(q) ||
      deptName.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    const q = memberSearchQuery.toLowerCase();
    return (
      (u.name || u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.designation || '').toLowerCase().includes(q)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'manage'
          ? 'Project Teams & Taskforces Directory'
          : mode === 'edit'
          ? 'Edit Project Team'
          : 'Create New Project Team'
      }
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        {/* Error Banner */}
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* MANAGE MODE: Search & Teams List */}
        {mode === 'manage' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search teams by name or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleStartCreate}
                className="shrink-0 bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer"
              >
                Add New Team
              </Button>
            </div>

            {/* List of Teams */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[360px] overflow-y-auto">
              {filteredTeams.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {searchQuery ? 'No matching teams found' : 'No teams configured yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click "Add New Team" above to create an assigned project taskforce.
                  </p>
                </div>
              ) : (
                filteredTeams.map((team) => {
                  const id = team._id || team.id;
                  const isDeleting = deleteConfirmId === id;
                  const deptName =
                    typeof team.departmentId === 'object'
                      ? team.departmentId?.name || ''
                      : '';
                  const memberCount = team.members?.length || 0;

                  return (
                    <div
                      key={id}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {team.name}
                          </span>
                          {deptName && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                              {deptName}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>

                        {memberCount > 0 && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {team.members
                              .map((m) => (typeof m === 'object' ? m.name || m.username : 'Member'))
                              .join(', ')}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDeleting ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-900">
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 px-1">
                              Delete?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteTeam(id)}
                              disabled={isSubmitting}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? '...' : 'Yes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={isSubmitting}
                              className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            {onSelectTeam && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectTeam(id);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Select this team for project"
                              >
                                <Check size={13} />
                                <span className="hidden sm:inline">Select</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(team)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Team"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete Team"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CREATE / EDIT FORM */}
        {(mode === 'create' || mode === 'edit') && (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Team / Taskforce Name *"
                icon={Users}
                placeholder="e.g. Civil Construction Taskforce Alpha"
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
                  <option value="">-- Optional: Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept._id || dept.id} value={dept._id || dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Member Multi-Select Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Assign Team Members ({formData.members.length} selected)</span>
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

              {/* Member Search filter */}
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

              {/* Scrollable Officers Checklist */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching officers available.
                  </div>
                ) : (
                  filteredUsers.map((user) => {
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

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMode('manage')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Teams Directory</span>
              </button>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer"
                >
                  {mode === 'edit' ? 'Update Team' : 'Create & Select Team'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default TeamCrudModal;
