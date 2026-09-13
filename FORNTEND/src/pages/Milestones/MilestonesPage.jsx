import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { milestoneApi, projectApi } from '../../api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/ui/uiSlice';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import { SkeletonMilestones } from '../../components/common/Skeleton';
import { Calendar, ExternalLink, Clock, FolderGit2, Plus, RefreshCw } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const MilestonesPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const todayStr = new Date().toISOString().split('T')[0];

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Milestone Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalProjectId, setModalProjectId] = useState('');
  const [mTitle, setMTitle] = useState('');
  const [mDescription, setMDescription] = useState('');
  const [mDueDate, setMDueDate] = useState('');
  const [mStatus, setMStatus] = useState('planning');
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState(null);

  const loadMilestones = async (projId) => {
    if (!projId) return;
    try {
      setIsLoading(true);
      const res = await milestoneApi.getByProjectId(projId);
      setMilestones(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error('Failed loading milestones', err);
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to load milestones' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const res = await projectApi.getAll();
        const projs = Array.isArray(res) ? res : res?.data || [];
        setProjects(projs);
        if (projs.length > 0) {
          const firstId = projs[0]._id || projs[0].id;
          setSelectedProjectId(firstId);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadMilestones(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleOpenAddModal = () => {
    setModalProjectId(selectedProjectId || (projects[0]?._id || projects[0]?.id || ''));
    setMTitle('');
    setMDescription('');
    setMDueDate('');
    setMStatus('planning');
    setIsAddModalOpen(true);
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!mTitle.trim() || !mDueDate || !modalProjectId) {
      dispatch(
        addToast({
          type: 'error',
          message: 'Scheme, title, and target due date are required',
        })
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await milestoneApi.create({
        projectId: modalProjectId,
        title: mTitle.trim(),
        description: mDescription.trim(),
        dueDate: new Date(mDueDate),
        status: mStatus,
      });

      dispatch(
        addToast({
          type: 'success',
          message: 'Milestone checkpoint registered successfully',
        })
      );
      setIsAddModalOpen(false);
      setMTitle('');
      setMDescription('');
      setMDueDate('');

      if (modalProjectId === selectedProjectId) {
        await loadMilestones(modalProjectId);
      } else {
        setSelectedProjectId(modalProjectId);
      }
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err.message || 'Failed to register milestone',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMilestoneStatus = async (mid, nextStatus) => {
    if (updatingMilestoneId === mid) return;
    try {
      setUpdatingMilestoneId(mid);
      await milestoneApi.update(mid, { status: nextStatus });
      dispatch(
        addToast({
          type: 'success',
          message: `Milestone status updated to ${nextStatus.replace('-', ' ')}`,
        })
      );
      setMilestones((prev) =>
        prev.map((m) => ((m._id || m.id) === mid ? { ...m, status: nextStatus } : m))
      );
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err.message || 'Failed to update milestone status',
        })
      );
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  const selectedProject = projects.find((p) => (p._id || p.id) === selectedProjectId);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Milestone Surveillance & Execution Checkpoints
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track critical engineering, land clearance, procurement, and handover stages.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            onClick={() => loadMilestones(selectedProjectId)}
            isLoading={isLoading}
            className="text-xs"
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={handleOpenAddModal}
            className="text-xs"
          >
            Add Milestone
          </Button>
        </div>
      </div>

      {/* Project Selector Bar */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap flex items-center gap-1 shrink-0">
            <FolderGit2 size={14} className="text-slate-400" />
            Scheme:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 truncate"
          >
            {projects.map((p) => {
              const pid = p._id || p.id;
              return (
                <option key={pid} value={pid}>
                  {p.name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto text-xs justify-center shrink-0"
          >
            Add Milestone
          </Button>
          {selectedProject && (
            <Button
              size="sm"
              variant="secondary"
              icon={ExternalLink}
              onClick={() => navigate(`/projects/${selectedProject._id || selectedProject.id}`)}
              className="w-full sm:w-auto text-xs justify-center shrink-0"
            >
              Detailed Scheme View
            </Button>
          )}
        </div>
      </div>

      {/* Milestones Timeline Gate Content */}
      <Card
        title={
          selectedProject ? (
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>Checkpoints:</span>
              <Link
                to={`/projects/${selectedProject._id || selectedProject.id}`}
                className="text-blue-700 hover:text-blue-900 font-semibold transition-colors"
                title={`View scheme details for ${selectedProject.name}`}
              >
                {selectedProject.name}
              </Link>
            </span>
          ) : (
            'Milestones'
          )
        }
        subtitle="Ordered sequential deliverables and audit targets"
      >
        {isLoading ? (
          <SkeletonMilestones count={5} />
        ) : milestones.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm flex flex-col items-center gap-3">
            <p>No milestones registered for this project yet.</p>
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={handleOpenAddModal}
              className="text-xs"
            >
              Add First Milestone
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {milestones.map((m, idx) => {
              const mid = m._id || m.id;
              const isUpdating = updatingMilestoneId === mid;

              return (
                <div
                  key={mid}
                  onClick={() =>
                    selectedProject &&
                    navigate(`/projects/${selectedProject._id || selectedProject.id}`)
                  }
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-0.5 sm:mt-0">
                      {idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 break-words leading-snug group-hover:text-blue-700 transition-colors">
                        {m.title}
                      </h4>
                      {m.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-10 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Due: {formatDate(m.dueDate)}</span>
                    </div>

                    <select
                      value={m.status || 'planning'}
                      disabled={isUpdating}
                      onChange={(e) => handleUpdateMilestoneStatus(mid, e.target.value)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 capitalize cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                      title="Update milestone status"
                    >
                      <option value="planning">Planning</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delayed">Delayed</option>
                    </select>

                    <Badge status={m.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Register Project Milestone Checkpoint"
      >
        <form onSubmit={handleCreateMilestone} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Project Scheme *
            </label>
            <select
              value={modalProjectId}
              onChange={(e) => setModalProjectId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
              required
            >
              <option value="" disabled>
                -- Select Assigned Infrastructure Scheme --
              </option>
              {projects.map((p) => {
                const pid = p._id || p.id;
                return (
                  <option key={pid} value={pid}>
                    {p.name}
                  </option>
                );
              })}
            </select>
          </div>

          <Input
            label="Checkpoint / Milestone Title *"
            value={mTitle}
            onChange={(e) => setMTitle(e.target.value)}
            placeholder="e.g. Land Acquisition & Environmental Clearance Phase 1"
            required
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description & Scope Criteria
            </label>
            <textarea
              rows={3}
              value={mDescription}
              onChange={(e) => setMDescription(e.target.value)}
              placeholder="Outline specific deliverable criteria, technical specifications, or verification milestones..."
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Initial Status
              </label>
              <select
                value={mStatus}
                onChange={(e) => setMStatus(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 capitalize disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>

            <Input
              label="Target Due Date *"
              type="date"
              min={todayStr}
              value={mDueDate}
              onChange={(e) => setMDueDate(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting || !mTitle.trim() || !mDueDate || !modalProjectId}
              className="w-full sm:w-auto"
            >
              Add Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MilestonesPage;
