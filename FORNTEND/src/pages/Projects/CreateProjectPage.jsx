import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createProjectThunk } from '../../features/projects/projectSlice';
import { selectIsAdmin } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import { clientApi, teamApi, userApi, masterApi } from '../../api';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import ConfirmationModal from '../../components/common/ConfirmationModal/ConfirmationModal';
import { Skeleton } from '../../components/common/Skeleton';
import {
  ArrowLeft,
  Save,
  ShieldAlert,
  Plus,
  Settings2,
  Edit2,
  Trash2,
  Building2,
  Users,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { formatCrores, parseBudgetToINR, toRawINR } from '../../utils/formatters';
import ClientCrudModal from './components/ClientCrudModal';
import TeamCrudModal from './components/TeamCrudModal';

const safeToRawINR = (val) => {
  const num = Number(val || 0);
  if (isNaN(num) || num <= 0) return 0;
  if (num < 10000000) {
    return Math.round(num * 10000000);
  }
  return Math.round(num);
};

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAdmin = useAppSelector(selectIsAdmin);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [usedbudget, setUsedbudget] = useState('0');
  const [clientId, setClientId] = useState('');
  const [teamId, setTeamId] = useState('');

  const [clients, setClients] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoadingRelations, setIsLoadingRelations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client CRUD Modal States
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientModalMode, setClientModalMode] = useState('manage'); // 'manage' | 'create' | 'edit'
  const [clientToEdit, setClientToEdit] = useState(null);

  // Team CRUD Modal States
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamModalMode, setTeamModalMode] = useState('manage'); // 'manage' | 'create' | 'edit'
  const [teamToEdit, setTeamToEdit] = useState(null);

  // Quick Delete States
  const [quickDeleteClientTarget, setQuickDeleteClientTarget] = useState(null);
  const [isDeletingQuickClient, setIsDeletingQuickClient] = useState(false);
  const [quickDeleteTeamTarget, setQuickDeleteTeamTarget] = useState(null);
  const [isDeletingQuickTeam, setIsDeletingQuickTeam] = useState(false);

  const loadRelations = async () => {
    try {
      setIsLoadingRelations(true);
      const [cRes, tRes, dRes, uRes] = await Promise.allSettled([
        clientApi.getAll(),
        teamApi.getAll(),
        masterApi.getDepartments(),
        userApi.getAll(),
      ]);

      if (cRes.status === 'fulfilled') {
        const cData = cRes.value;
        setClients(Array.isArray(cData) ? cData : cData?.data || []);
      }
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
    } catch (err) {
      console.error('Failed loading relations', err);
    } finally {
      setIsLoadingRelations(false);
    }
  };

  useEffect(() => {
    loadRelations();
  }, []);

  // Client CRUD Callbacks
  const handleClientsUpdated = async (savedClient, deletedId) => {
    if (deletedId) {
      setClients((prev) => prev.filter((c) => (c._id || c.id) !== deletedId));
      if (clientId === deletedId) {
        setClientId('');
      }
      dispatch(addToast({ type: 'info', message: 'Sponsoring agency deleted.' }));
    } else if (savedClient) {
      const sId = savedClient._id || savedClient.id;
      setClients((prev) => {
        const idx = prev.findIndex((c) => (c._id || c.id) === sId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = savedClient;
          return copy;
        }
        return [savedClient, ...prev];
      });
      setClientId(sId);
      dispatch(addToast({ type: 'success', message: 'Client agency saved and selected!' }));
    }
  };

  const handleOpenCreateClient = () => {
    setClientToEdit(null);
    setClientModalMode('create');
    setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (client) => {
    setClientToEdit(client);
    setClientModalMode('edit');
    setIsClientModalOpen(true);
  };

  const handleOpenManageClients = () => {
    setClientToEdit(null);
    setClientModalMode('manage');
    setIsClientModalOpen(true);
  };

  const handleQuickDeleteClient = (id, clientName) => {
    setQuickDeleteClientTarget({ id, name: clientName });
  };

  const handleConfirmQuickDeleteClient = async () => {
    if (!quickDeleteClientTarget || isDeletingQuickClient) return;
    try {
      setIsDeletingQuickClient(true);
      await clientApi.delete(quickDeleteClientTarget.id);
      handleClientsUpdated(null, quickDeleteClientTarget.id);
      setQuickDeleteClientTarget(null);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to delete client agency' }));
    } finally {
      setIsDeletingQuickClient(false);
    }
  };

  // Team CRUD Callbacks
  const handleTeamsUpdated = async (savedTeam, deletedId) => {
    if (deletedId) {
      setTeams((prev) => prev.filter((t) => (t._id || t.id) !== deletedId));
      if (teamId === deletedId) {
        setTeamId('');
      }
      dispatch(addToast({ type: 'info', message: 'Project team deleted.' }));
    } else if (savedTeam) {
      const sId = savedTeam._id || savedTeam.id;
      setTeams((prev) => {
        const idx = prev.findIndex((t) => (t._id || t.id) === sId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = savedTeam;
          return copy;
        }
        return [savedTeam, ...prev];
      });
      setTeamId(sId);
      dispatch(addToast({ type: 'success', message: 'Project team saved and assigned!' }));
    }
  };

  const handleOpenCreateTeam = () => {
    setTeamToEdit(null);
    setTeamModalMode('create');
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (team) => {
    setTeamToEdit(team);
    setTeamModalMode('edit');
    setIsTeamModalOpen(true);
  };

  const handleOpenManageTeams = () => {
    setTeamToEdit(null);
    setTeamModalMode('manage');
    setIsTeamModalOpen(true);
  };

  const handleQuickDeleteTeam = (id, teamName) => {
    setQuickDeleteTeamTarget({ id, name: teamName });
  };

  const handleConfirmQuickDeleteTeam = async () => {
    if (!quickDeleteTeamTarget || isDeletingQuickTeam) return;
    try {
      setIsDeletingQuickTeam(true);
      await teamApi.delete(quickDeleteTeamTarget.id);
      handleTeamsUpdated(null, quickDeleteTeamTarget.id);
      setQuickDeleteTeamTarget(null);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to delete project team' }));
    } finally {
      setIsDeletingQuickTeam(false);
    }
  };

  const selectedClient = clients.find((c) => (c._id || c.id) === clientId);
  const selectedTeam = teams.find((t) => (t._id || t.id) === teamId);

  // Role Security Check
  if (!isAdmin) {
    return (
      <div className="p-6 sm:p-10 text-center bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm max-w-lg mx-auto mt-6 sm:mt-10">
        <ShieldAlert size={48} className="text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg sm:text-xl font-bold text-rose-700 dark:text-rose-400">Administrative Authorization Required</h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
          Your current session does not have admin privileges. Only designated <strong className="text-slate-800 dark:text-white">admin</strong> accounts can register new projects.
        </p>
        <Button variant="secondary" onClick={() => navigate('/projects')}>
          Return to Projects Directory
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim()) {
      dispatch(addToast({ type: 'error', message: 'Project name is required' }));
      return;
    }

    try {
      setIsSubmitting(true);
      const numBudget = Number(budget || 0);
      const numUsed = Number(usedbudget || 0);

      if (numUsed > numBudget) {
        dispatch(
          addToast({
            type: 'error',
            message: `Validation Error: Utilized Outlay (₹${numUsed} Cr) cannot exceed Sanctioned Budget (₹${numBudget} Cr).`,
          })
        );
        setIsSubmitting(false);
        return;
      }

      const parsedBudget = typeof toRawINR === 'function' ? toRawINR(budget) : safeToRawINR(budget);
      const parsedUsed = typeof toRawINR === 'function' ? toRawINR(usedbudget) : safeToRawINR(usedbudget);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        status,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        budget: parsedBudget,
        usedbudget: parsedUsed,
        utilizedBudget: parsedUsed,
        clientId: clientId || null,
        teamId: teamId || null,
      };

      const result = await dispatch(createProjectThunk(payload));

      if (createProjectThunk.fulfilled.match(result)) {
        dispatch(addToast({ type: 'success', message: 'Project successfully created!' }));
        navigate('/projects');
      } else {
        dispatch(addToast({ type: 'error', message: result.payload || 'Failed to create project' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-3xl mx-auto w-full">
      <div>
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/projects')}>
          Cancel & Return
        </Button>
      </div>

      <Card
        title="Register New Project"
        subtitle="National Infrastructure Pipeline • Integrated Project Onboarding"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          {/* Project Name */}
          <Input
            label="Project Name *"
            placeholder="e.g. Western Dedicated Freight Corridor Phase 3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
          />

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Detailed description of project objectives, scope and deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Status & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 uppercase disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="planning">PLANNING</option>
                <option value="active">ACTIVE</option>
                <option value="on-hold">ON-HOLD</option>
                <option value="completed">COMPLETED</option>
                <option value="cancelled">CANCELLED</option>
              </select>
            </div>

            <Input
              label="Start Date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting}
            />

            <Input
              label="End Date"
              type="date"
              min={startDate || new Date().toISOString().split('T')[0]}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Budget & Expenditure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Total Sanctioned Budget (₹ Cr) *"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 50 or 500"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={isSubmitting}
              helperText={budget ? `₹${budget} Cr` : undefined}
            />

            <Input
              label="Initial Utilized Outlay (₹ Cr)"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 0 or 40"
              value={usedbudget}
              onChange={(e) => setUsedbudget(e.target.value)}
              disabled={isSubmitting}
              helperText={usedbudget ? `₹${usedbudget} Cr` : undefined}
              error={
                Number(usedbudget) > Number(budget)
                  ? `Utilized Outlay cannot exceed Sanctioned Budget (Max: ₹${budget || 0} Cr)`
                  : undefined
              }
            />
          </div>

          {/* Client & Assigned Team with Full Admin CRUD Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Client / Sponsoring Agency Section */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Client / Sponsoring Agency
                </label>
              </div>

              {isLoadingRelations ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : (
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">-- No Client Selected --</option>
                  {clients.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              )}

              {/* Selected Client Preview Card with Quick Edit / Delete */}
              {selectedClient && (
                <div className="mt-2 p-2.5 sm:p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-xl flex items-center justify-between gap-2.5 transition-all">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {selectedClient.name}
                      </span>
                      {selectedClient.company && (
                        <span className="px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-semibold text-[10px] truncate max-w-[140px]">
                          {selectedClient.company}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 truncate flex items-center gap-2">
                      <span className="truncate">{selectedClient.email}</span>
                      {selectedClient.phone && <span className="shrink-0">• {selectedClient.phone}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditClient(selectedClient)}
                      className="p-1 rounded-md text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                      title="Edit this client agency"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingQuickClient}
                      onClick={() => handleQuickDeleteClient(selectedClient._id || selectedClient.id, selectedClient.name)}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Delete this client agency"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Assigned Team Section */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Team
                </label>
              </div>

              {isLoadingRelations ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : (
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">-- No Team Assigned --</option>
                  {teams.map((t) => (
                    <option key={t._id || t.id} value={t._id || t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Selected Team Preview Card with Quick Edit / Delete */}
              {selectedTeam && (
                <div className="mt-2 p-2.5 sm:p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl flex items-center justify-between gap-2.5 transition-all">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {selectedTeam.name}
                      </span>
                      {selectedTeam.departmentId?.name && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px] truncate max-w-[140px]">
                          {selectedTeam.departmentId.name}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 truncate">
                      {selectedTeam.members?.length || 0} Members
                      {selectedTeam.members?.length > 0 &&
                        ` (${selectedTeam.members
                          .map((m) => (typeof m === 'object' ? m.name || m.username : 'Member'))
                          .join(', ')})`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditTeam(selectedTeam)}
                      className="p-1 rounded-md text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                      title="Edit this project team"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingQuickTeam}
                      onClick={() => handleQuickDeleteTeam(selectedTeam._id || selectedTeam.id, selectedTeam.name)}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Delete this project team"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => navigate('/projects')}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={Save}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full sm:w-auto bg-blue-900 hover:bg-blue-950 text-white cursor-pointer"
            >
              Create Project
            </Button>
          </div>
        </form>
      </Card>

      {/* Admin Client CRUD Modal */}
      <ClientCrudModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clients={clients}
        onClientsUpdated={handleClientsUpdated}
        onSelectClient={(id) => setClientId(id)}
        initialEditClient={clientToEdit}
        initialMode={clientModalMode}
      />

      {/* Admin Team CRUD Modal */}
      <TeamCrudModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teams={teams}
        departments={departments}
        users={users}
        onTeamsUpdated={handleTeamsUpdated}
        onSelectTeam={(id) => setTeamId(id)}
        initialEditTeam={teamToEdit}
        initialMode={teamModalMode}
      />

      {/* Confirmation Modal for Quick Client Deletion */}
      <ConfirmationModal
        isOpen={!!quickDeleteClientTarget}
        onClose={() => !isDeletingQuickClient && setQuickDeleteClientTarget(null)}
        onConfirm={handleConfirmQuickDeleteClient}
        title="Delete Sponsoring Agency"
        message="Are you sure you want to remove this sponsoring agency from the registry?"
        itemName={quickDeleteClientTarget?.name}
        confirmText="Delete Agency"
        cancelText="Cancel"
        confirmVariant="danger"
        icon={Trash2}
        isLoading={isDeletingQuickClient}
      />

      {/* Confirmation Modal for Quick Team Deletion */}
      <ConfirmationModal
        isOpen={!!quickDeleteTeamTarget}
        onClose={() => !isDeletingQuickTeam && setQuickDeleteTeamTarget(null)}
        onConfirm={handleConfirmQuickDeleteTeam}
        title="Delete Project Team"
        message="Are you sure you want to delete this project team? All member assignments will be unlinked."
        itemName={quickDeleteTeamTarget?.name}
        confirmText="Delete Team"
        cancelText="Cancel"
        confirmVariant="danger"
        icon={Trash2}
        isLoading={isDeletingQuickTeam}
      />
    </div>
  );
};

export default CreateProjectPage;
