import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi, milestoneApi, taskApi, riskApi, commentApi } from '../../api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectIsAdmin, selectCurrentUser } from '../../features/auth/authSlice';
import { setActiveProject } from '../../features/projects/projectSlice';
import { addToast } from '../../features/ui/uiSlice';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import { SkeletonProjectDetails } from '../../components/common/Skeleton';
import {
  ArrowLeft,
  PlusCircle,
  Plus,
  Shield,
  CheckSquare,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  Clock,
  MessageSquare,
  Edit3,
} from 'lucide-react';
import {
  formatCrores,
  formatDate,
  formatCommentTimestamp,
  getInitials,
  calculateProgress,
  toCrores,
  toRawINR,
} from '../../utils/formatters';

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAdmin = useAppSelector(selectIsAdmin);
  const currentUser = useAppSelector(selectCurrentUser);

  const todayStr = new Date().toISOString().split('T')[0];

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [risks, setRisks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Submitting states for duplicate submission protection
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSubmittingRisk, setIsSubmittingRisk] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // Edit Project Modal state
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editUsedBudget, setEditUsedBudget] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editStatus, setEditStatus] = useState('planning');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // Milestone Modal
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mDueDate, setMDueDate] = useState('');

  // Execution Task States
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Risk Modal
  const [addRiskOpen, setAddRiskOpen] = useState(false);
  const [riskTitle, setRiskTitle] = useState('');
  const [riskSeverity, setRiskSeverity] = useState('medium');
  const [updatingRiskId, setUpdatingRiskId] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const projData = await projectApi.getById(id);
      setProject(projData);
      dispatch(setActiveProject(projData));

      const projId = projData._id || projData.id;
      const [mls, tsks, rsks, cmts] = await Promise.all([
        milestoneApi.getByProjectId(projId),
        taskApi.getAll({ projectId: projId }),
        riskApi.getAll({ projectId: projId }),
        commentApi.getByRef('project', projId),
      ]);

      setMilestones(Array.isArray(mls) ? mls : mls?.data || []);
      setTasks(Array.isArray(tsks) ? tsks : tsks?.data || []);
      setRisks(Array.isArray(rsks) ? rsks : rsks?.data || []);
      setComments(Array.isArray(cmts) ? cmts : cmts?.data || []);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to load project details' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      dispatch(setActiveProject(null));
    };
  }, [id]);

  const handleOpenEditProject = () => {
    if (!project) return;
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
    setEditProjectOpen(true);
  };

  const handleSaveProjectEdit = async (e) => {
    e.preventDefault();
    if (isSubmittingProject) return;
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

    const projId = project._id || project.id;
    const parsedBudget = toRawINR(editBudget);
    const parsedUsed = toRawINR(editUsedBudget);

    try {
      setIsSubmittingProject(true);
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
      setEditProjectOpen(false);
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed updating project details' }));
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (isSubmittingMilestone) return;
    if (!mTitle || !mDueDate) return;
    const projId = project._id || project.id;

    try {
      setIsSubmittingMilestone(true);
      await milestoneApi.create({
        projectId: projId,
        title: mTitle.trim(),
        description: mDesc.trim(),
        dueDate: mDueDate ? new Date(mDueDate) : null,
        status: 'pending',
      });
      dispatch(addToast({ type: 'success', message: 'Milestone added successfully' }));
      setAddMilestoneOpen(false);
      setMTitle('');
      setMDesc('');
      setMDueDate('');
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to add milestone' }));
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, nextStatus) => {
    if (updatingTaskId === taskId) return;
    try {
      setUpdatingTaskId(taskId);
      await taskApi.update(taskId, { status: nextStatus });
      dispatch(
        addToast({
          type: 'success',
          message: `Task status updated to ${nextStatus.replace('-', ' ')}`,
        })
      );
      setTasks((prev) =>
        prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: nextStatus } : t))
      );
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err.message || 'Failed to update task status',
        })
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleOpenAddTask = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskStatus('todo');
    setTaskDueDate('');
    setAddTaskOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (isSubmittingTask) return;
    if (!taskTitle.trim()) {
      dispatch(addToast({ type: 'error', message: 'Task title is required' }));
      return;
    }
    const projId = project._id || project.id;

    try {
      setIsSubmittingTask(true);
      const res = await taskApi.create({
        projectId: projId,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate ? new Date(taskDueDate) : null,
      });
      const created = res?.data || res;
      setTasks((prev) => [created, ...prev]);
      dispatch(addToast({ type: 'success', message: 'Execution task added to project' }));
      setAddTaskOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to add execution task' }));
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleCreateRisk = async (e) => {
    e.preventDefault();
    if (isSubmittingRisk) return;
    if (!riskTitle) return;
    const projId = project._id || project.id;

    try {
      setIsSubmittingRisk(true);
      await riskApi.create({
        projectId: projId,
        title: riskTitle.trim(),
        severity: riskSeverity,
        status: 'open',
      });
      dispatch(addToast({ type: 'success', message: 'Risk registered in project register' }));
      setAddRiskOpen(false);
      setRiskTitle('');
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to add risk' }));
    } finally {
      setIsSubmittingRisk(false);
    }
  };

  const handleUpdateRiskStatus = async (rId, nextStatus) => {
    if (updatingRiskId === rId) return;
    try {
      setUpdatingRiskId(rId);
      await riskApi.update(rId, { status: nextStatus });
      dispatch(addToast({ type: 'success', message: `Risk status updated to ${nextStatus}` }));
      setRisks((prev) =>
        prev.map((r) => ((r._id || r.id) === rId ? { ...r, status: nextStatus } : r))
      );
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to update risk status' }));
    } finally {
      setUpdatingRiskId(null);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (isSubmittingComment) return;
    if (!newCommentText.trim()) return;
    const projId = project._id || project.id;

    try {
      setIsSubmittingComment(true);
      await commentApi.create({
        refType: 'project',
        refId: projId,
        text: newCommentText.trim(),
      });
      setNewCommentText('');
      dispatch(addToast({ type: 'success', message: 'Comment posted' }));
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to post comment' }));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading || !project) {
    return <SkeletonProjectDetails />;
  }

  const budget = Number(project.budget || 0);
  const used = Number(project.usedbudget ?? project.utilizedBudget ?? 0);
  const progressPct = calculateProgress(budget, used);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/projects')}>
          Back to Directory
        </Button>
      </div>

      {/* Project Banner Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 border border-slate-800 shadow-md flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge status={project.status} />
              <span className="text-xs text-slate-400 font-mono">
                ID: {(project._id || project.id).slice(-8)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white break-words">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              {project.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0 w-full sm:w-auto">
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                icon={Edit3}
                onClick={handleOpenEditProject}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex-1 sm:flex-initial"
              >
                Edit Scheme
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => setAddMilestoneOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none flex-1 sm:flex-initial"
            >
              Add Milestone
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={CheckSquare}
              onClick={handleOpenAddTask}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex-1 sm:flex-initial"
            >
              Add Task
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Shield}
              onClick={() => setAddRiskOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex-1 sm:flex-initial"
            >
              Log Risk
            </Button>
          </div>
        </div>

        {/* Quick Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-slate-800/80">
          <div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Sanctioned Budget
            </span>
            <div className="text-base sm:text-lg font-bold text-white mt-0.5">
              {formatCrores(budget)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Utilized Outlay
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenEditProject}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-white/10"
                  title="Edit Outlay & Scheme Details"
                >
                  <Edit3 size={11} />
                </button>
              )}
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
              {formatCrores(used)} ({progressPct}%)
            </div>
          </div>

          <div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Project Timeline
            </span>
            <div className="text-xs sm:text-sm font-semibold text-white mt-0.5">
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </div>
          </div>

          <div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Client / Sponsor
            </span>
            <div className="text-xs sm:text-sm font-semibold text-white mt-0.5 truncate">
              {project.clientId?.name || 'Central Nodal Agency'}
            </div>
          </div>

          <div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Assigned Owner
            </span>
            <div className="text-xs sm:text-sm font-semibold text-white mt-0.5 truncate">
              {project.teamId?.name || project.ownerId?.username || 'Executive Officer'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Milestones & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Milestones Card */}
        <Card
          title={`Milestones (${milestones.length})`}
          subtitle="Project phase gates and checkpoints"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              icon={PlusCircle}
              onClick={() => setAddMilestoneOpen(true)}
            >
              Add
            </Button>
          }
        >
          {milestones.length === 0 ? (
            <p className="text-slate-400 text-xs sm:text-sm py-4 text-center">
              No milestones created yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {milestones.map((m) => (
                <div
                  key={m._id || m.id}
                  className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 break-words">
                      {m.title}
                    </h4>
                    {m.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {m.description}
                      </p>
                    )}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <Clock size={12} /> Due: {formatDate(m.dueDate)}
                    </span>
                  </div>
                  <Badge status={m.status} className="self-start sm:self-center shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tasks Card */}
        <Card
          title={`Execution Tasks (${tasks.length})`}
          subtitle="Work items assigned across departments"
          headerAction={
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={handleOpenAddTask}
              className="text-xs"
            >
              Add Task
            </Button>
          }
        >
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2.5">
              <p>No tasks assigned to this project yet.</p>
              <Button
                size="sm"
                variant="primary"
                icon={Plus}
                onClick={handleOpenAddTask}
                className="text-xs"
              >
                Add First Task
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto">
              {tasks.map((t) => {
                const tId = t._id || t.id;
                const isUpdating = updatingTaskId === tId;

                return (
                  <div
                    key={tId}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-xs sm:text-sm text-slate-900 break-words">
                        {t.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                        <span>
                          Priority: <strong className="capitalize">{t.priority}</strong>
                        </span>
                        {t.dueDate && <span>• Due: {formatDate(t.dueDate)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <select
                        value={t.status || 'todo'}
                        disabled={isUpdating}
                        onChange={(e) => handleUpdateTaskStatus(tId, e.target.value)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 capitalize cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                        title="Edit execution task status"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Under Review</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Completed</option>
                      </select>
                      <Badge status={t.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Grid: Risks & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Risks Card */}
        <Card
          title={`Project Vulnerabilities & Risks (${risks.length})`}
          subtitle="Identified bottlenecks and mitigation status"
        >
          {risks.length === 0 ? (
            <p className="text-slate-400 text-xs py-8 text-center">
              No risks flagged for this scheme.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto">
              {risks.map((r) => {
                const rId = r._id || r.id;
                const isUpdating = updatingRiskId === rId;
                const st = (r.status || 'open').toLowerCase();

                return (
                  <div
                    key={rId}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <Badge status={r.severity} />
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 break-words">
                          {r.title}
                        </span>
                      </div>
                      {r.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Badge status={r.status} />
                      {st === 'open' && (
                        <>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateRiskStatus(rId, 'mitigated')}
                            className="px-2 py-1 text-[11px] font-semibold rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Mitigate
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateRiskStatus(rId, 'closed')}
                            className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Close
                          </button>
                        </>
                      )}
                      {st === 'mitigated' && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateRiskStatus(rId, 'closed')}
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Close
                        </button>
                      )}
                      {(st === 'closed' || st === 'resolved') && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateRiskStatus(rId, 'open')}
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Discussion / Comments Card */}
        <Card
          title={`Official Log & Observations (${comments.length})`}
          subtitle="Authenticated nodal officer remarks and coordination"
        >
          <form onSubmit={handleAddComment} className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Add an official observation or field note..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              disabled={isSubmittingComment}
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmittingComment || !newCommentText.trim()}
              isLoading={isSubmittingComment}
              className="w-full sm:w-auto"
            >
              Post Observation
            </Button>
          </form>

          <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-slate-400 text-xs py-6 text-center">
                No official observations recorded yet.
              </p>
            ) : (
              comments.map((c) => {
                const author = typeof c.authorId === 'object' && c.authorId ? c.authorId : {};
                const authorName =
                  author.name ||
                  author.username ||
                  author.email ||
                  (typeof c.authorId === 'string' ? c.authorId : 'Nodal Officer');
                const authorRole = author.role
                  ? (author.role.toUpperCase() === 'USER' ? 'MANAGER' : author.role.toUpperCase())
                  : (isAdmin ? 'ADMIN' : 'MANAGER');
                const authorInitials = getInitials(authorName);
                const timestamp = formatCommentTimestamp(c.createdAt);

                return (
                  <div
                    key={c._id || c.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center border border-blue-200 uppercase shrink-0">
                          {authorInitials}
                        </div>
                        <span className="font-semibold text-xs text-slate-800 truncate">
                          {authorName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          {authorRole}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        {timestamp}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 break-words leading-relaxed pl-8">
                      {c.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* EDIT PROJECT MODAL (ADMIN) */}
      <Modal
        isOpen={editProjectOpen}
        onClose={() => !isSubmittingProject && setEditProjectOpen(false)}
        title="Edit Project Scheme Details"
      >
        <form onSubmit={handleSaveProjectEdit} className="flex flex-col gap-4">
          <Input
            label="Scheme Title *"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Official Scheme Name"
            required
            disabled={isSubmittingProject}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description & Objectives
            </label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Outline scope, beneficiaries, and milestones..."
              disabled={isSubmittingProject}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <Input
              label="Ministry / Department"
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              placeholder="e.g. Ministry of Railways"
              disabled={isSubmittingProject}
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
              disabled={isSubmittingProject}
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
              disabled={isSubmittingProject}
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
                disabled={isSubmittingProject}
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
                Operational Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                disabled={isSubmittingProject}
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
              disabled={isSubmittingProject}
            />

            <Input
              label="Target Completion Date"
              type="date"
              min={todayStr}
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
              disabled={isSubmittingProject}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setEditProjectOpen(false)}
              disabled={isSubmittingProject}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmittingProject}
              isLoading={isSubmittingProject}
            >
              Save Project Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={addMilestoneOpen}
        onClose={() => !isSubmittingMilestone && setAddMilestoneOpen(false)}
        title="Add Milestone Checkpoint"
      >
        <form onSubmit={handleCreateMilestone} className="flex flex-col gap-4">
          <Input
            label="Milestone Title"
            value={mTitle}
            onChange={(e) => setMTitle(e.target.value)}
            placeholder="e.g. Sub-structure pier cap completion"
            required
            disabled={isSubmittingMilestone}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={mDesc}
              onChange={(e) => setMDesc(e.target.value)}
              disabled={isSubmittingMilestone}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Input
            label="Target Due Date"
            type="date"
            min={todayStr}
            value={mDueDate}
            onChange={(e) => setMDueDate(e.target.value)}
            required
            disabled={isSubmittingMilestone}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setAddMilestoneOpen(false)}
              disabled={isSubmittingMilestone}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmittingMilestone}
              isLoading={isSubmittingMilestone}
            >
              Save Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={addTaskOpen}
        onClose={() => !isSubmittingTask && setAddTaskOpen(false)}
        title={`Add Execution Task to ${project.name}`}
      >
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
          <Input
            label="Task Title *"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Conduct Environmental Clearance Inspection"
            required
            disabled={isSubmittingTask}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Outline specific deliverables, milestones, or instructions..."
              disabled={isSubmittingTask}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
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
                disabled={isSubmittingTask}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 capitalize disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Under Review</option>
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
                disabled={isSubmittingTask}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 capitalize disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <Input
              label="Target Due Date"
              type="date"
              min={todayStr}
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              disabled={isSubmittingTask}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setAddTaskOpen(false)}
              disabled={isSubmittingTask}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmittingTask}
              disabled={isSubmittingTask || !taskTitle.trim()}
              className="w-full sm:w-auto"
            >
              Add Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Risk Modal */}
      <Modal
        isOpen={addRiskOpen}
        onClose={() => !isSubmittingRisk && setAddRiskOpen(false)}
        title="Log Project Risk"
      >
        <form onSubmit={handleCreateRisk} className="flex flex-col gap-4">
          <Input
            label="Risk Incident Title"
            value={riskTitle}
            onChange={(e) => setRiskTitle(e.target.value)}
            placeholder="e.g. Monsoon flooding in section 4 excavation"
            required
            disabled={isSubmittingRisk}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Severity Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'low', label: 'Low', activeClass: 'bg-slate-100 text-slate-800 border-slate-400 font-bold shadow-xs' },
                { id: 'medium', label: 'Medium', activeClass: 'bg-blue-50 text-blue-800 border-blue-400 font-bold shadow-xs' },
                { id: 'high', label: 'High', activeClass: 'bg-amber-50 text-amber-800 border-amber-400 font-bold shadow-xs' },
                { id: 'critical', label: 'Critical', activeClass: 'bg-rose-50 text-rose-800 border-rose-400 font-bold shadow-xs' },
              ].map((sev) => {
                const isSel = riskSeverity === sev.id;
                return (
                  <button
                    key={sev.id}
                    type="button"
                    disabled={isSubmittingRisk}
                    onClick={() => setRiskSeverity(sev.id)}
                    className={`px-3 py-2 text-xs rounded-lg border transition-all cursor-pointer text-center ${
                      isSel ? sev.activeClass : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {sev.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setAddRiskOpen(false)}
              disabled={isSubmittingRisk}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="submit"
              disabled={isSubmittingRisk}
              isLoading={isSubmittingRisk}
            >
              Log Risk
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetailsPage;
