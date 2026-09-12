import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi, milestoneApi, taskApi, riskApi, commentApi } from '../../api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectIsAdmin, selectCurrentUser } from '../../features/auth/authSlice';
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
  Shield,
  CheckSquare,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { formatCrores, formatDate } from '../../utils/formatters';

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAdmin = useAppSelector(selectIsAdmin);
  const currentUser = useAppSelector(selectCurrentUser);

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [risks, setRisks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Milestone Modal
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mDueDate, setMDueDate] = useState('');

  // Task Modal
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Risk Modal
  const [addRiskOpen, setAddRiskOpen] = useState(false);
  const [riskTitle, setRiskTitle] = useState('');
  const [riskSeverity, setRiskSeverity] = useState('medium');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const projData = await projectApi.getById(id);
      setProject(projData);

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
  }, [id]);

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!mTitle || !mDueDate) return;
    const projId = project._id || project.id;

    try {
      await milestoneApi.create({
        projectId: projId,
        title: mTitle,
        description: mDesc,
        dueDate: mDueDate,
        status: 'pending',
      });
      dispatch(addToast({ type: 'success', message: 'Milestone added successfully' }));
      setAddMilestoneOpen(false);
      setMTitle('');
      setMDesc('');
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to add milestone' }));
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return;
    const projId = project._id || project.id;

    try {
      await taskApi.create({
        projectId: projId,
        title: taskTitle,
        priority: taskPriority,
        dueDate: taskDueDate ? new Date(taskDueDate) : null,
        status: 'todo',
      });
      dispatch(addToast({ type: 'success', message: 'Task added successfully' }));
      setAddTaskOpen(false);
      setTaskTitle('');
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to add task' }));
    }
  };

  const handleCreateRisk = async (e) => {
    e.preventDefault();
    if (!riskTitle) return;
    const projId = project._id || project.id;

    try {
      await riskApi.create({
        projectId: projId,
        title: riskTitle,
        severity: riskSeverity,
        status: 'open',
      });
      dispatch(addToast({ type: 'success', message: 'Risk registered in project register' }));
      setAddRiskOpen(false);
      setRiskTitle('');
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to add risk' }));
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const projId = project._id || project.id;

    try {
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
    }
  };

  if (isLoading || !project) {
    return <SkeletonProjectDetails />;
  }

  const budget = Number(project.budget || 0);
  const used = Number(project.usedbudget || 0);
  const progressPct = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;

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
              onClick={() => setAddTaskOpen(true)}
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
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Utilized Outlay
            </span>
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
          title={`Tasks (${tasks.length})`}
          subtitle="Work items assigned to this scheme"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              icon={PlusCircle}
              onClick={() => setAddTaskOpen(true)}
            >
              Add
            </Button>
          }
        >
          {tasks.length === 0 ? (
            <p className="text-slate-400 text-xs sm:text-sm py-4 text-center">
              No work tasks assigned yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {tasks.map((t) => (
                <div
                  key={t._id || t.id}
                  className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 break-words">
                      {t.title}
                    </h4>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span>Priority: <strong className="uppercase">{t.priority}</strong></span>
                      <span>•</span>
                      <span>Due: {formatDate(t.dueDate)}</span>
                    </span>
                  </div>
                  <Badge status={t.status} className="self-start sm:self-center shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Grid: Risks & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Risks Card */}
        <Card
          title={`Registered Risks (${risks.length})`}
          subtitle="Potential bottlenecks flagged for mitigation"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              icon={PlusCircle}
              onClick={() => setAddRiskOpen(true)}
            >
              Log Risk
            </Button>
          }
        >
          {risks.length === 0 ? (
            <p className="text-emerald-600 text-xs sm:text-sm py-4 text-center font-medium">
              No critical risks active on this project.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {risks.map((r) => (
                <div
                  key={r._id || r.id}
                  className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 break-words">
                      {r.title}
                    </h4>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      Severity: <strong className="uppercase">{r.severity}</strong> • Status: <span className="uppercase">{r.status}</span>
                    </span>
                  </div>
                  <Badge status={r.severity} className="self-start sm:self-center shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Discussion / Comments Card */}
        <Card
          title={`Project Discussions (${comments.length})`}
          subtitle="Official team log & coordination"
        >
          <form onSubmit={handleAddComment} className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Add an update or observation..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
            <Button variant="primary" size="sm" type="submit" className="w-full sm:w-auto">
              Post
            </Button>
          </form>

          <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">
                No comments recorded yet.
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c._id || c.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <p className="text-xs sm:text-sm text-slate-800 mb-1 break-words">
                    {c.text}
                  </p>
                  <span className="text-[10px] sm:text-[11px] text-slate-400">
                    {c.authorId?.username || 'Officer'} • {formatDate(c.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={addMilestoneOpen}
        onClose={() => setAddMilestoneOpen(false)}
        title="Add Milestone Checkpoint"
      >
        <form onSubmit={handleCreateMilestone} className="flex flex-col gap-4">
          <Input
            label="Milestone Title"
            value={mTitle}
            onChange={(e) => setMTitle(e.target.value)}
            placeholder="e.g. Sub-structure pier cap completion"
            required
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={mDesc}
              onChange={(e) => setMDesc(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Input
            label="Target Due Date"
            type="date"
            value={mDueDate}
            onChange={(e) => setMDueDate(e.target.value)}
            required
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAddMilestoneOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        title="Add Task Work Item"
      >
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
          <Input
            label="Task Title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Issue tender notification in e-Gazette"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 uppercase"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <Input
              label="Due Date"
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Risk Modal */}
      <Modal
        isOpen={addRiskOpen}
        onClose={() => setAddRiskOpen(false)}
        title="Log Project Risk"
      >
        <form onSubmit={handleCreateRisk} className="flex flex-col gap-4">
          <Input
            label="Risk Incident Title"
            value={riskTitle}
            onChange={(e) => setRiskTitle(e.target.value)}
            placeholder="e.g. Monsoon flooding in section 4 excavation"
            required
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Severity Level
            </label>
            <select
              value={riskSeverity}
              onChange={(e) => setRiskSeverity(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 uppercase"
            >
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Impediment</option>
            </select>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAddRiskOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              Log Risk
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetailsPage;
