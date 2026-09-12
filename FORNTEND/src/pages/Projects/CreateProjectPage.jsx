import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createProjectThunk } from '../../features/projects/projectSlice';
import { selectIsAdmin } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import { clientApi, teamApi } from '../../api';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import { Skeleton } from '../../components/common/Skeleton';
import { ArrowLeft, Save, ShieldAlert } from 'lucide-react';

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
  const [isLoadingRelations, setIsLoadingRelations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadRelations = async () => {
      try {
        setIsLoadingRelations(true);
        const [cRes, tRes] = await Promise.all([clientApi.getAll(), teamApi.getAll()]);
        setClients(Array.isArray(cRes) ? cRes : cRes?.data || []);
        setTeams(Array.isArray(tRes) ? tRes : tRes?.data || []);
      } catch (err) {
        console.error('Failed loading clients/teams', err);
      } finally {
        setIsLoadingRelations(false);
      }
    };
    loadRelations();
  }, []);

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
    if (!name.trim()) {
      dispatch(addToast({ type: 'error', message: 'Project name is required' }));
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: Number(budget) || 0,
        usedbudget: Number(usedbudget) || 0,
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
        subtitle="MongoDB Atlas Project Management • New Project Onboarding"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          {/* Project Name */}
          <Input
            label="Project Name *"
            placeholder="e.g. Western Dedicated Freight Corridor Phase 3"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
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
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 uppercase"
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
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Budget & Expenditure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Total Sanctioned Budget (INR)"
              type="number"
              placeholder="Total budget amount"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />

            <Input
              label="Initial Used Budget (INR)"
              type="number"
              placeholder="Initial expenditure"
              value={usedbudget}
              onChange={(e) => setUsedbudget(e.target.value)}
            />
          </div>

          {/* Client & Assigned Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Client / Sponsoring Agency
              </label>
              {isLoadingRelations ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : (
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- No Client Selected --</option>
                  {clients.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assigned Team
              </label>
              {isLoadingRelations ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : (
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- No Team Assigned --</option>
                  {teams.map((t) => (
                    <option key={t._id || t.id} value={t._id || t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => navigate('/projects')}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={Save}
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
            >
              Create Project
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateProjectPage;
