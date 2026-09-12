import { GoogleGenAI } from '@google/genai';
import { envConfig } from '../config/env.config.js';
import '../models/user.model.js';
import '../models/client.model.js';
import '../models/project.model.js';
import '../models/milestone.model.js';
import '../models/task.model.js';
import '../models/risk.model.js';
import Project from '../models/project.model.js';
import Milestone from '../models/milestone.model.js';
import Task from '../models/task.model.js';
import Risk from '../models/risk.model.js';
import User from '../models/user.model.js';

export const SYSTEM_INSTRUCTION = `You are a government project-management AI assistant.

Your primary source of truth is the structured database context provided to you.

Answer questions about projects, schemes, milestones, tasks, budgets, officers, agencies, departments, dates, statuses, and related information using the supplied database context.

Never invent database facts.

Never assume that a project, milestone, task, officer, amount, date, status, or agency exists unless it appears in the supplied database context.

If the requested information is not present in the database context, say:
"I could not find that information in the available project database."

When database records are available, give a direct and useful answer.

Use the exact names, dates, amounts, statuses, and responsible persons from the database.

For calculations such as budget utilization, totals, counts, percentages, or remaining budget, calculate from the retrieved database values when possible.

If multiple records match the query, present the relevant records and clearly distinguish them.

If the query is ambiguous, use conversation context and database results to resolve it. If it cannot be resolved safely, ask a concise clarification question.

Do not mention internal retrieval, MongoDB, embeddings, prompts, APIs, or implementation details unless the user explicitly asks about the system.

Do not give generic government-project advice when the user is asking for information that should come from the database.

When the database contains the answer, answer with the database information rather than a generic explanation.`;

// --- Stop Words Set for Natural Language Tokenization ---
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'much', 'many', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some',
  'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'give', 'show', 'tell', 'please', 'details', 'detail',
  'information', 'info'
]);

// Stop words specific to identifying single named projects
const PROJECT_STOP_WORDS = new Set([
  ...STOP_WORDS,
  'project', 'projects', 'scheme', 'schemes', 'status', 'milestone', 'milestones',
  'task', 'tasks', 'budget', 'budgets', 'cost', 'expenditure', 'utilized', 'sanctioned',
  'delayed', 'pending', 'completed', 'blocked', 'critical', 'overdue', 'deadlines', 'deadline',
  'compare', 'versus', 'responsible', 'charge', 'officer', 'officers', 'assigned', 'allocation',
  'total', 'rate', 'summary', 'overview', 'list', 'all'
]);

/**
 * Extract meaningful search tokens from natural language query
 */
const extractSearchTokens = (query = '') => {
  const words = String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  const tokens = [];
  for (const w of words) {
    tokens.push(w);
    if (w === 'udco') tokens.push('hudco');
    if (w === 'hudco') tokens.push('udco');
  }
  return Array.from(new Set(tokens));
};

/**
 * Extract tokens specifically targeted at matching named projects
 */
const extractProjectSearchTokens = (query = '') => {
  const words = String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !PROJECT_STOP_WORDS.has(w));

  const tokens = [];
  for (const w of words) {
    tokens.push(w);
    if (w === 'udco') tokens.push('hudco');
    if (w === 'hudco') tokens.push('udco');
  }
  return Array.from(new Set(tokens));
};

/**
 * Resolve pronouns ("it", "its", "this project") from previous conversation history
 */
const resolveContextualProjectName = (history = [], currentQuery = '') => {
  const qLower = currentQuery.toLowerCase();
  const hasPronoun =
    /\b(it|its|this project|the project|that project|this scheme|the scheme|ones)\b/i.test(qLower) ||
    /^(what are (the |its )?milestones|who is responsible|what are (the |its )?tasks|what is (the |its )?budget|how much budget|what is the status)\??$/i.test(
      currentQuery.trim()
    );

  if (!hasPronoun && history.length === 0) return null;

  // Scan backwards through history
  for (let i = history.length - 1; i >= 0; i--) {
    const text = history[i]?.text || history[i]?.parts?.[0]?.text || '';
    if (!text) continue;

    // Check for bold project names e.g. **Ultra Mega Solar Park...** or **hudco hospital**
    const boldMatches = Array.from(text.matchAll(/\*\*([^*]+)\*\*/g));
    for (const m of boldMatches) {
      const candidate = m[1].trim();
      const cLower = candidate.toLowerCase();
      if (
        candidate.length >= 4 &&
        !cLower.includes('status') &&
        !cLower.includes('practical example') &&
        !cLower.includes('budget') &&
        !cLower.includes('sanctioned') &&
        !cLower.includes('milestone') &&
        !cLower.includes('task') &&
        !cLower.includes('stage') &&
        !cLower.includes('ministry') &&
        !cLower.includes('government project')
      ) {
        return candidate;
      }
    }
  }
  return null;
};

/**
 * Retrieve and consolidate milestones for a project from both separate Milestone collection and embedded array
 */
const getProjectMilestones = async (projectId) => {
  const listFromColl = await Milestone.find({ projectId }).sort({ dueDate: 1 }).lean();
  const project = await Project.findById(projectId).lean();
  const embedded = Array.isArray(project?.milestones) ? project.milestones : [];

  const map = new Map();
  for (const m of listFromColl) {
    const key = (m.title || '').toLowerCase().trim() || m._id.toString();
    map.set(key, {
      id: m._id,
      title: m.title || 'Milestone Checkpoint',
      status: (m.status || 'pending').toLowerCase(),
      stage: m.stage || 'Execution',
      dueDate: m.dueDate || m.targetDate || null,
      completionDate: m.completionDate || null,
      responsiblePerson: m.responsiblePerson || '',
      remarks: m.remarks || m.description || '',
    });
  }

  for (const m of embedded) {
    const key = (m.title || '').toLowerCase().trim() || m._id?.toString();
    if (!map.has(key)) {
      map.set(key, {
        id: m._id,
        title: m.title || 'Milestone Checkpoint',
        status: (m.status || 'pending').toLowerCase(),
        stage: m.stage || 'Planning',
        dueDate: m.targetDate || m.dueDate || null,
        completionDate: m.completionDate || null,
        responsiblePerson: m.responsiblePerson || '',
        remarks: m.remarks || m.description || '',
      });
    }
  }

  return Array.from(map.values());
};

/**
 * Retrieve tasks for a project with populated assignees and milestones
 */
const getProjectTasks = async (projectId) => {
  const tasks = await Task.find({ projectId })
    .populate('assignedTo', 'username name email')
    .populate('milestoneId', 'title')
    .sort({ dueDate: 1, updatedAt: -1 })
    .lean();

  return tasks.map((t) => ({
    id: t._id,
    title: t.title || 'Project Task',
    status: (t.status || 'todo').toLowerCase(),
    priority: (t.priority || 'medium').toLowerCase(),
    dueDate: t.dueDate || null,
    assignedTo: t.assignedTo?.name || t.assignedTo?.username || 'Unassigned',
    milestone: t.milestoneId?.title || null,
    description: t.description || '',
  }));
};

/**
 * Retrieve risks for a project
 */
const getProjectRisks = async (projectId) => {
  const risks = await Risk.find({ projectId }).lean();
  return risks.map((r) => ({
    id: r._id,
    title: r.title || r.name,
    severity: r.severity || 'Medium',
    status: r.status || 'Open',
    mitigationPlan: r.mitigationPlan || r.mitigation || 'Under review',
  }));
};

/**
 * Dynamic Multi-Field Project Search with Weighted Relevance Scoring
 */
const searchProjectsDynamic = async (tokens = [], rawQuery = '') => {
  const allProjects = await Project.find({})
    .populate('clientId', 'name')
    .populate('ownerId', 'username name email')
    .lean();

  const qLower = rawQuery.toLowerCase();

  const scored = allProjects.map((p) => {
    const name = (p.name || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const code = (p.code || '').toLowerCase();
    const ministry = (p.ministry || '').toLowerCase();
    const dept = (p.department || '').toLowerCase();
    const client = (p.clientId?.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const officer = (p.responsibleOfficer || p.ownerId?.name || '').toLowerCase();
    const combined = `${name} ${title} ${code} ${ministry} ${dept} ${client} ${desc} ${officer}`;

    let score = 0;

    // Exact Scheme Code Match (e.g. MNRE-SP-2024-033 or 360002)
    if (code && qLower.includes(code)) score += 100;

    // Exact Project Name / Title Match
    if (name && qLower.includes(name)) score += 80;
    if (title && qLower.includes(title)) score += 80;

    // Token Match Scoring
    for (const t of tokens) {
      if (code.includes(t)) score += 25;
      if (name.includes(t)) score += 20;
      if (title.includes(t)) score += 15;
      if (ministry.includes(t) || dept.includes(t) || client.includes(t)) score += 12;
      if (officer.includes(t)) score += 10;
      if (desc.includes(t)) score += 4;
      if (combined.includes(t)) score += 2;
    }

    return { ...p, _searchScore: score };
  });

  return scored
    .filter((item) => item._searchScore > 0)
    .sort((a, b) => b._searchScore - a._searchScore);
};

/**
 * Format Currency in Indian Numbering (Crore / Lakh)
 */
const formatIndianCurrency = (amount) => {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN');
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2);
    return `₹${formatted} (₹${cr} Crore)`;
  }
  if (num >= 100000) {
    const lakh = (num / 100000).toFixed(2);
    return `₹${formatted} (₹${lakh} Lakh)`;
  }
  return `₹${formatted}`;
};

/**
 * Core Dynamic MongoDB Retrieval Engine
 * Resolves entity intents across projects, milestones, tasks, users, and risks.
 */
export const retrieveDatabaseContext = async (query, history = []) => {
  const qLower = query.toLowerCase().trim();
  const generalTokens = extractSearchTokens(query);
  const projectTokens = extractProjectSearchTokens(query);

  // Check for follow-up contextual project name if pronoun used
  let contextualProjectName = resolveContextualProjectName(history, query);
  let effectiveProjectTokens = [...projectTokens];
  if (contextualProjectName && effectiveProjectTokens.length === 0) {
    effectiveProjectTokens.push(...extractProjectSearchTokens(contextualProjectName));
  }

  // Find candidate projects dynamically
  const candidateProjects = await searchProjectsDynamic(
    effectiveProjectTokens.length > 0 ? effectiveProjectTokens : generalTokens,
    query
  );
  const topProject = candidateProjects[0];
  const hasStrongProjectMatch = Boolean(topProject && topProject._searchScore >= 18);

  // 1. Check if user is asking for tasks assigned to a specific officer (e.g. "tasks assigned to Nakul")
  const isOfficerTasksQuery =
    (qLower.includes('assigned to') || qLower.includes('tasks for') || qLower.includes('task assigned') || qLower.includes('tasks of')) &&
    !qLower.includes('project');

  if (isOfficerTasksQuery || qLower.includes('assigned to nakul') || qLower.includes('tasks of nakul')) {
    const users = await User.find({}).lean();
    let matchedUser = null;
    for (const u of users) {
      const uTokens = extractSearchTokens(`${u.name || ''} ${u.username || ''}`);
      if (uTokens.some((ut) => generalTokens.includes(ut))) {
        matchedUser = u;
        break;
      }
    }

    if (matchedUser) {
      const tasks = await Task.find({ assignedTo: matchedUser._id })
        .populate('projectId', 'title name code')
        .lean();

      return {
        intent: 'officer_tasks',
        officer: matchedUser.name || matchedUser.username,
        department: matchedUser.department || '',
        totalTasks: tasks.length,
        tasks: tasks.map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          project: t.projectId?.title || t.projectId?.name || 'Infrastructure Scheme',
          dueDate: t.dueDate,
        })),
      };
    }
  }

  // 2. Check if user is asking "which officer has the most assigned tasks?"
  if (qLower.includes('most assigned') || qLower.includes('most tasks') || qLower.includes('highest tasks')) {
    const counts = await Task.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
    ]);

    return {
      intent: 'officer_workload',
      officers: counts.map((c) => ({
        name: c.user.name || c.user.username,
        count: c.count,
        email: c.user.email,
        department: c.user.department,
      })),
    };
  }

  // 3. Check for specific Milestone In-Charge / Responsibility Query across projects
  // e.g. "Who is responsible for the BESS commissioning?" or "Who is responsible for the 220/400 kV pooling substation?"
  const isMilestoneResponsibilityQuery =
    (qLower.includes('responsible') || qLower.includes('in charge') || qLower.includes('in-charge')) &&
    (qLower.includes('milestone') || qLower.includes('substation') || qLower.includes('commissioning') || qLower.includes('work') || qLower.includes('inspection'));

  if (isMilestoneResponsibilityQuery) {
    const allProjects = await Project.find({}).lean();
    const milestoneMatches = [];

    for (const p of allProjects) {
      const pMilestones = await getProjectMilestones(p._id);
      for (const m of pMilestones) {
        const mText = `${m.title} ${m.stage} ${m.responsiblePerson} ${m.remarks}`.toLowerCase();
        let matchCount = 0;
        for (const t of generalTokens) {
          if (mText.includes(t)) matchCount++;
        }
        if (matchCount >= 1 && (mText.includes('substation') || mText.includes('commissioning') || matchCount >= 2)) {
          milestoneMatches.push({
            milestoneTitle: m.title,
            responsiblePerson: m.responsiblePerson || 'Unassigned Nodal Agency',
            status: m.status,
            stage: m.stage,
            targetDate: m.dueDate,
            projectName: p.title || p.name,
            code: p.code,
          });
        }
      }
    }

    if (milestoneMatches.length > 0) {
      return {
        intent: 'milestone_responsibility',
        matches: milestoneMatches,
      };
    }
  }

  // 4. Check for Blocked Tasks query ("Which projects have blocked tasks?" or "show blocked tasks")
  if (qLower.includes('blocked task') || qLower.includes('blocked tasks')) {
    const blockedTasks = await Task.find({ status: 'blocked' })
      .populate('projectId', 'title name code status')
      .populate('assignedTo', 'name username')
      .lean();

    const projectsMap = new Map();
    for (const t of blockedTasks) {
      const pName = t.projectId?.title || t.projectId?.name || 'Central Project';
      if (!projectsMap.has(pName)) {
        projectsMap.set(pName, {
          projectName: pName,
          code: t.projectId?.code,
          status: t.projectId?.status,
          tasks: [],
        });
      }
      projectsMap.get(pName).tasks.push({
        title: t.title,
        priority: t.priority,
        assignedTo: t.assignedTo?.name || t.assignedTo?.username || 'Unassigned',
      });
    }

    return {
      intent: 'blocked_tasks',
      totalBlocked: blockedTasks.length,
      projects: Array.from(projectsMap.values()),
    };
  }

  // 5. Check for Critical / High-Priority Tasks query ("Which tasks are critical?" or "projects with critical tasks")
  if (qLower.includes('critical task') || qLower.includes('critical tasks') || (qLower.includes('critical') && qLower.includes('task'))) {
    const criticalTasks = await Task.find({ priority: 'critical' })
      .populate('projectId', 'title name code status')
      .populate('assignedTo', 'name username')
      .lean();

    return {
      intent: 'critical_tasks',
      totalCritical: criticalTasks.length,
      tasks: criticalTasks.map((t) => ({
        title: t.title,
        status: t.status,
        project: t.projectId?.title || t.projectId?.name,
        assignedTo: t.assignedTo?.name || t.assignedTo?.username || 'Unassigned',
      })),
    };
  }

  // 6. Check for Overdue Milestones query ("Which milestones are overdue?" or "overdue milestones")
  if (qLower.includes('overdue milestone') || qLower.includes('overdue milestones') || (qLower.includes('overdue') && qLower.includes('milestone'))) {
    const now = new Date();
    const allProjects = await Project.find({}).lean();
    const overdueList = [];

    for (const p of allProjects) {
      const pMilestones = await getProjectMilestones(p._id);
      for (const m of pMilestones) {
        if (m.dueDate && new Date(m.dueDate) < now && m.status !== 'completed') {
          overdueList.push({
            milestone: m.title,
            project: p.title || p.name,
            targetDate: m.dueDate,
            status: m.status,
            responsible: m.responsiblePerson,
          });
        }
      }
    }

    return {
      intent: 'overdue_milestones',
      totalOverdue: overdueList.length,
      milestones: overdueList,
    };
  }

  // 7. Check for Project Comparison query ("Compare two projects" or "Compare project A and project B")
  if (qLower.includes('compare') || qLower.includes('versus') || qLower.includes(' vs ')) {
    if (candidateProjects.length >= 2) {
      const p1 = candidateProjects[0];
      const p2 = candidateProjects[1];
      const m1 = await getProjectMilestones(p1._id);
      const m2 = await getProjectMilestones(p2._id);

      return {
        intent: 'project_comparison',
        projectA: {
          title: p1.title || p1.name,
          code: p1.code,
          status: p1.status,
          budget: p1.budget,
          utilized: p1.usedbudget || p1.utilizedBudget,
          utilizationRate: p1.budget > 0 ? (((p1.usedbudget || p1.utilizedBudget || 0) / p1.budget) * 100).toFixed(1) + '%' : '0%',
          milestonesTotal: m1.length,
          milestonesCompleted: m1.filter((m) => m.status === 'completed').length,
        },
        projectB: {
          title: p2.title || p2.name,
          code: p2.code,
          status: p2.status,
          budget: p2.budget,
          utilized: p2.usedbudget || p2.utilizedBudget,
          utilizationRate: p2.budget > 0 ? (((p2.usedbudget || p2.utilizedBudget || 0) / p2.budget) * 100).toFixed(1) + '%' : '0%',
          milestonesTotal: m2.length,
          milestonesCompleted: m2.filter((m) => m.status === 'completed').length,
        },
      };
    }
  }

  // 8. If strong single project match exists, resolve to project_detail
  if (hasStrongProjectMatch) {
    const p = topProject;
    const milestones = await getProjectMilestones(p._id);
    const tasks = await getProjectTasks(p._id);
    const risks = await getProjectRisks(p._id);

    const sanctioned = Number(p.budget) || 0;
    const utilized = Number(p.usedbudget || p.utilizedBudget) || 0;
    const remaining = Math.max(0, sanctioned - utilized);
    const utilizationRate = sanctioned > 0 ? ((utilized / sanctioned) * 100).toFixed(2) + '%' : '0%';

    return {
      intent: 'project_detail',
      project: {
        id: p._id,
        name: p.name || p.title,
        title: p.title || p.name,
        code: p.code,
        status: p.status,
        priority: p.priority,
        progress: p.progress,
        ministry: p.ministry || p.department || p.clientId?.name || 'Central Agency',
        department: p.department || '',
        responsibleOfficer: p.responsibleOfficer || p.ownerId?.name || p.ownerId?.username || 'Executive Officer',
        sanctionedBudget: sanctioned,
        utilizedBudget: utilized,
        remainingBudget: remaining,
        utilizationRate,
        startDate: p.startDate,
        expectedCompletionDate: p.expectedCompletionDate || p.endDate,
        milestonesTotal: milestones.length,
        milestonesCompleted: milestones.filter((m) => m.status === 'completed').length,
        milestonesPending: milestones.filter((m) => m.status === 'pending').length,
        milestones,
        tasksTotal: tasks.length,
        tasksBlocked: tasks.filter((t) => t.status === 'blocked').length,
        tasksCritical: tasks.filter((t) => t.priority === 'critical').length,
        tasks,
        risks,
      },
    };
  }

  // 9. Portfolio-wide Pending Milestones query ("Which milestones are pending?")
  const isPendingMilestones =
    qLower.includes('pending milestone') ||
    qLower.includes('pending milestones') ||
    (qLower.includes('pending') && qLower.includes('milestone')) ||
    qLower.includes('milestones are pending');

  if (isPendingMilestones) {
    const allProjects = await Project.find({}).lean();
    const pendingList = [];

    for (const p of allProjects) {
      const pMilestones = await getProjectMilestones(p._id);
      for (const m of pMilestones) {
        if (m.status === 'pending' || m.status === 'in-progress') {
          pendingList.push({
            milestone: m.title,
            project: p.title || p.name,
            targetDate: m.dueDate,
            status: m.status,
            responsible: m.responsiblePerson,
          });
        }
      }
    }

    return {
      intent: 'pending_milestones',
      totalPending: pendingList.length,
      milestones: pendingList.slice(0, 15),
    };
  }

  // 10. Completed Projects query ("Which projects are completed?")
  if (qLower.includes('completed project') || qLower.includes('projects are completed') || qLower.includes('which projects are completed')) {
    const completedProjects = await Project.find({ status: /completed/i }).lean();
    return {
      intent: 'completed_projects',
      totalCompleted: completedProjects.length,
      projects: completedProjects.map((p) => ({
        title: p.title || p.name,
        code: p.code,
        budget: p.budget,
        utilized: p.usedbudget || p.utilizedBudget,
        completionDate: p.expectedCompletionDate || p.endDate,
      })),
    };
  }

  // 11. Delayed Projects query ("Show me all delayed projects")
  if (qLower.includes('delayed project') || qLower.includes('projects are delayed') || qLower.includes('projects delayed') || qLower.includes('delayed schemes')) {
    const delayedProjects = await Project.find({ status: /delayed|on-hold|blocked/i }).lean();
    return {
      intent: 'delayed_projects',
      totalDelayed: delayedProjects.length,
      projects: delayedProjects.map((p) => ({
        title: p.title || p.name,
        code: p.code,
        status: p.status,
        budget: p.budget,
        utilized: p.usedbudget || p.utilizedBudget,
        reason: p.description,
      })),
    };
  }

  // 12. Ministry / Agency filter query ("Show projects under MNRE" or "projects under MoRTH")
  const ministryMatch = qLower.match(/\b(under|by ministry of|ministry of|dept of|department of)\s+([a-z0-9_-]+)\b/i);
  if (
    qLower.includes('under mnre') ||
    qLower.includes('projects under') ||
    qLower.includes('schemes under') ||
    qLower.includes('under ministry') ||
    (ministryMatch && (qLower.includes('project') || qLower.includes('scheme') || qLower.includes('show')))
  ) {
    const targetDept = (ministryMatch ? ministryMatch[2] : (generalTokens.find((t) => t === 'mnre' || t === 'morth') || generalTokens[0])) || '';
    if (targetDept) {
      const deptProjects = await Project.find({
        $or: [
          { ministry: { $regex: targetDept, $options: 'i' } },
          { department: { $regex: targetDept, $options: 'i' } },
          { code: { $regex: targetDept, $options: 'i' } },
          { title: { $regex: targetDept, $options: 'i' } },
        ],
      }).lean();

      if (deptProjects.length > 0) {
        return {
          intent: 'ministry_projects',
          filterKeyword: targetDept.toUpperCase(),
          totalProjects: deptProjects.length,
          projects: deptProjects.map((p) => ({
            title: p.title || p.name,
            code: p.code,
            status: p.status,
            budget: p.budget,
            utilized: p.usedbudget || p.utilizedBudget,
            ministry: p.ministry || p.department,
          })),
        };
      }
    }
  }

  // 13. Date / Deadlines query ("Which projects have deadlines in February 2026?")
  if (qLower.includes('deadline') || qLower.includes('ending in') || qLower.includes('completion date')) {
    const yearMatch = qLower.match(/\b(202[3-9])\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const isFeb = qLower.includes('feb');
      const startDate = isFeb ? new Date(year, 1, 1) : new Date(year, 0, 1);
      const endDate = isFeb ? new Date(year, 1, 29) : new Date(year, 11, 31);

      const dateProjects = await Project.find({
        $or: [
          { expectedCompletionDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
        ],
      }).lean();

      return {
        intent: 'date_filter',
        targetPeriod: isFeb ? `February ${year}` : `${year}`,
        totalFound: dateProjects.length,
        projects: dateProjects.map((p) => ({
          title: p.title || p.name,
          code: p.code,
          status: p.status,
          expectedCompletionDate: p.expectedCompletionDate || p.endDate,
        })),
      };
    }
  }

  // 14. Portfolio Budget / Aggregation query ("How much budget has been utilized?")
  const isBudgetSummary =
    (qLower.includes('budget') && (qLower.includes('utilized') || qLower.includes('sanctioned') || qLower.includes('total') || qLower.includes('how much') || qLower.includes('overall') || qLower.includes('portfolio'))) ||
    qLower.includes('how many projects') ||
    qLower.includes('summary of projects') ||
    qLower.includes('portfolio summary');

  if (isBudgetSummary) {
    const allProjects = await Project.find({}).lean();
    const totalSanctioned = allProjects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
    const totalUtilized = allProjects.reduce((acc, p) => acc + (Number(p.usedbudget || p.utilizedBudget) || 0), 0);
    const completed = allProjects.filter((p) => /completed/i.test(p.status)).length;
    const delayed = allProjects.filter((p) => /delayed|on-hold|blocked/i.test(p.status)).length;
    const active = allProjects.filter((p) => /active|in progress/i.test(p.status)).length;

    return {
      intent: 'portfolio_summary',
      totalProjects: allProjects.length,
      activeProjects: active,
      delayedProjects: delayed,
      completedProjects: completed,
      totalSanctionedBudget: totalSanctioned,
      totalUtilizedBudget: totalUtilized,
      remainingBudget: totalSanctioned - totalUtilized,
      averageUtilization: totalSanctioned > 0 ? ((totalUtilized / totalSanctioned) * 100).toFixed(2) + '%' : '0%',
    };
  }

  // 15. Fallback: Any lower-scoring project match
  if (topProject && topProject._searchScore > 0) {
    const p = topProject;
    const milestones = await getProjectMilestones(p._id);
    const tasks = await getProjectTasks(p._id);
    const risks = await getProjectRisks(p._id);

    const sanctioned = Number(p.budget) || 0;
    const utilized = Number(p.usedbudget || p.utilizedBudget) || 0;
    const remaining = Math.max(0, sanctioned - utilized);
    const utilizationRate = sanctioned > 0 ? ((utilized / sanctioned) * 100).toFixed(2) + '%' : '0%';

    return {
      intent: 'project_detail',
      project: {
        id: p._id,
        name: p.name || p.title,
        title: p.title || p.name,
        code: p.code,
        status: p.status,
        priority: p.priority,
        progress: p.progress,
        ministry: p.ministry || p.department || p.clientId?.name || 'Central Agency',
        department: p.department || '',
        responsibleOfficer: p.responsibleOfficer || p.ownerId?.name || p.ownerId?.username || 'Executive Officer',
        sanctionedBudget: sanctioned,
        utilizedBudget: utilized,
        remainingBudget: remaining,
        utilizationRate,
        startDate: p.startDate,
        expectedCompletionDate: p.expectedCompletionDate || p.endDate,
        milestonesTotal: milestones.length,
        milestonesCompleted: milestones.filter((m) => m.status === 'completed').length,
        milestonesPending: milestones.filter((m) => m.status === 'pending').length,
        milestones,
        tasksTotal: tasks.length,
        tasksBlocked: tasks.filter((t) => t.status === 'blocked').length,
        tasksCritical: tasks.filter((t) => t.priority === 'critical').length,
        tasks,
        risks,
      },
    };
  }

  // If nothing matched in the database
  return {
    intent: 'not_found',
    query,
  };
};

/**
 * Format Retrieved Database Context into Structured Markdown
 * Serves as direct grounded response generator when Gemini rate limits or for offline generation.
 */
export const formatGroundedResponse = (ctx, userQuery = '') => {
  if (!ctx || ctx.intent === 'not_found') {
    return `I could not find that information in the available project database.\n\nPlease verify the project name, scheme code, or officer name, or ask for an overview of monitored government schemes.`;
  }

  const qLower = (userQuery || '').toLowerCase();

  // --- 1. Officer Tasks View ---
  if (ctx.intent === 'officer_tasks') {
    let reply = `Here are the tasks assigned to **${ctx.officer}** (${ctx.department || 'Nodal Agency'}) from the central database:\n\n`;
    reply += `* **Total Assigned Tasks:** ${ctx.totalTasks}\n\n`;
    reply += `| Task Description | Priority | Status | Associated Scheme |\n`;
    reply += `| :--- | :--- | :--- | :--- |\n`;
    ctx.tasks.forEach((t) => {
      reply += `| ${t.title} | **${t.priority.toUpperCase()}** | \`${t.status}\` | ${t.project} |\n`;
    });
    return reply;
  }

  // --- 2. Officer Workload Comparison View ---
  if (ctx.intent === 'officer_workload') {
    let reply = `**Project Task Distribution by Officer (Database Records)**:\n\n`;
    reply += `| Officer Name | Total Tasks Assigned | Department |\n`;
    reply += `| :--- | :--- | :--- |\n`;
    ctx.officers.forEach((o) => {
      reply += `| **${o.name}** | ${o.count} tasks | ${o.department || 'Central Directorate'} |\n`;
    });
    if (ctx.officers[0]) {
      reply += `\n**Officer with Highest Workload**: **${ctx.officers[0].name}** with **${ctx.officers[0].count} assigned tasks**.`;
    }
    return reply;
  }

  // --- 3. Milestone Responsibility View ---
  if (ctx.intent === 'milestone_responsibility') {
    let reply = `Here is the milestone in-charge and delivery record from the central database:\n\n`;
    ctx.matches.forEach((m) => {
      reply += `* **Milestone Checkpoint:** ${m.milestoneTitle}\n`;
      reply += `* **Responsible Person / Agency:** **${m.responsiblePerson}**\n`;
      reply += `* **Associated Project:** ${m.projectName} (${m.code || 'Scheme'})\n`;
      reply += `* **Status:** \`${m.status}\` | Stage: ${m.stage || 'Execution'}\n`;
      if (m.targetDate) reply += `* **Target Delivery Date:** ${new Date(m.targetDate).toLocaleDateString()}\n`;
      reply += `\n`;
    });
    return reply;
  }

  // --- 4. Blocked Tasks View ---
  if (ctx.intent === 'blocked_tasks') {
    if (ctx.totalBlocked === 0) {
      return `Good news! There are currently **0 blocked tasks** across your registered infrastructure schemes.`;
    }
    let reply = `**Projects with Blocked Tasks (${ctx.totalBlocked} Blocked Total)**:\n\n`;
    ctx.projects.forEach((p, idx) => {
      reply += `### ${idx + 1}. ${p.projectName} (\`${p.code || 'Scheme'}\`)\n`;
      p.tasks.forEach((t) => {
        reply += `* **${t.title}** (Priority: **${t.priority.toUpperCase()}**) — Assigned: ${t.assignedTo}\n`;
      });
      reply += `\n`;
    });
    return reply;
  }

  // --- 5. Critical Tasks View ---
  if (ctx.intent === 'critical_tasks') {
    let reply = `**Active Critical Tasks (${ctx.totalCritical} Critical Items Recorded)**:\n\n`;
    reply += `| Task Title | Scheme / Project | Status | Assigned Officer |\n`;
    reply += `| :--- | :--- | :--- | :--- |\n`;
    ctx.tasks.forEach((t) => {
      reply += `| ${t.title} | ${t.project} | \`${t.status}\` | ${t.assignedTo} |\n`;
    });
    return reply;
  }

  // --- 6. Overdue Milestones View ---
  if (ctx.intent === 'overdue_milestones') {
    if (ctx.totalOverdue === 0) {
      return `All milestones across registered schemes are on track. No overdue milestones found in the database.`;
    }
    let reply = `**Overdue Milestones (${ctx.totalOverdue} Items Overdue)**:\n\n`;
    reply += `| Milestone Title | Associated Project | Target Date | Status | In-Charge |\n`;
    reply += `| :--- | :--- | :--- | :--- | :--- |\n`;
    ctx.milestones.forEach((m) => {
      reply += `| ${m.milestone} | ${m.project} | ${new Date(m.targetDate).toLocaleDateString()} | \`${m.status}\` | ${m.responsible || 'Nodal Agency'} |\n`;
    });
    return reply;
  }

  // --- 7. Pending Milestones View ---
  if (ctx.intent === 'pending_milestones') {
    let reply = `**Pending & In-Progress Milestones (${ctx.totalPending} Gates Monitored)**:\n\n`;
    reply += `| Milestone Checkpoint | Scheme | Target Date | Status |\n`;
    reply += `| :--- | :--- | :--- | :--- |\n`;
    ctx.milestones.forEach((m) => {
      reply += `| ${m.milestone} | ${m.project} | ${m.targetDate ? new Date(m.targetDate).toLocaleDateString() : 'TBD'} | \`${m.status}\` |\n`;
    });
    return reply;
  }

  // --- 8. Completed Projects View ---
  if (ctx.intent === 'completed_projects') {
    let reply = `**Completed Government Projects (${ctx.totalCompleted} Completed Schemes)**:\n\n`;
    reply += `| Scheme Name | Code | Sanctioned Outlay | Utilized Outlay | Completion Date |\n`;
    reply += `| :--- | :--- | :--- | :--- | :--- |\n`;
    ctx.projects.forEach((p) => {
      reply += `| **${p.title}** | \`${p.code}\` | ${formatIndianCurrency(p.budget)} | ${formatIndianCurrency(p.utilized)} | ${p.completionDate ? new Date(p.completionDate).toLocaleDateString() : 'Handed Over'} |\n`;
    });
    return reply;
  }

  // --- 9. Delayed Projects View ---
  if (ctx.intent === 'delayed_projects') {
    let reply = `**Delayed / Flagged Projects (${ctx.totalDelayed} Schemes Requiring Intervention)**:\n\n`;
    reply += `| Scheme Name | Code | Status | Sanctioned Budget | Utilized Budget |\n`;
    reply += `| :--- | :--- | :--- | :--- | :--- |\n`;
    ctx.projects.forEach((p) => {
      reply += `| **${p.title}** | \`${p.code}\` | \`${p.status}\` | ${formatIndianCurrency(p.budget)} | ${formatIndianCurrency(p.utilized)} |\n`;
    });
    return reply;
  }

  // --- 10. Ministry Filter View ---
  if (ctx.intent === 'ministry_projects') {
    let reply = `**Projects Registered under ${ctx.filterKeyword} (${ctx.totalProjects} Schemes)**:\n\n`;
    reply += `| Scheme Name | Code | Status | Sanctioned Budget | Ministry / Agency |\n`;
    reply += `| :--- | :--- | :--- | :--- | :--- |\n`;
    ctx.projects.forEach((p) => {
      reply += `| **${p.title}** | \`${p.code}\` | \`${p.status}\` | ${formatIndianCurrency(p.budget)} | ${p.ministry} |\n`;
    });
    return reply;
  }

  // --- 11. Date Filter View ---
  if (ctx.intent === 'date_filter') {
    let reply = `**Projects with Completion Deadlines in ${ctx.targetPeriod} (${ctx.totalFound} Schemes)**:\n\n`;
    reply += `| Project Name | Code | Status | Target Completion Date |\n`;
    reply += `| :--- | :--- | :--- | :--- |\n`;
    ctx.projects.forEach((p) => {
      reply += `| **${p.title}** | \`${p.code}\` | \`${p.status}\` | ${new Date(p.expectedCompletionDate).toLocaleDateString()} |\n`;
    });
    return reply;
  }

  // --- 12. Project Comparison View ---
  if (ctx.intent === 'project_comparison') {
    const { projectA: a, projectB: b } = ctx;
    let reply = `**Comparative Analysis: ${a.title} vs ${b.title}**\n\n`;
    reply += `| Parameter | ${a.title} | ${b.title} |\n`;
    reply += `| :--- | :--- | :--- |\n`;
    reply += `| **Scheme Code** | \`${a.code}\` | \`${b.code}\` |\n`;
    reply += `| **Status** | \`${a.status}\` | \`${b.status}\` |\n`;
    reply += `| **Sanctioned Budget** | ${formatIndianCurrency(a.budget)} | ${formatIndianCurrency(b.budget)} |\n`;
    reply += `| **Utilized Budget** | ${formatIndianCurrency(a.utilized)} | ${formatIndianCurrency(b.utilized)} |\n`;
    reply += `| **Utilization Rate** | **${a.utilizationRate}** | **${b.utilizationRate}** |\n`;
    reply += `| **Milestones Completed** | ${a.milestonesCompleted} / ${a.milestonesTotal} | ${b.milestonesCompleted} / ${b.milestonesTotal} |\n`;
    return reply;
  }

  // --- 13. Portfolio Summary View ---
  if (ctx.intent === 'portfolio_summary') {
    let reply = `**Central Infrastructure Portfolio Summary**:\n\n`;
    reply += `* **Total Monitored Schemes:** ${ctx.totalProjects}\n`;
    reply += `* **Active Schemes:** ${ctx.activeProjects}\n`;
    reply += `* **Delayed Schemes:** ${ctx.delayedProjects}\n`;
    reply += `* **Completed Schemes:** ${ctx.completedProjects}\n`;
    reply += `* **Total Sanctioned Outlay:** ${formatIndianCurrency(ctx.totalSanctionedBudget)}\n`;
    reply += `* **Total Incurred Expenditure:** ${formatIndianCurrency(ctx.totalUtilizedBudget)}\n`;
    reply += `* **Unutilized Remaining Balance:** ${formatIndianCurrency(ctx.remainingBudget)}\n`;
    reply += `* **Average Budget Utilization:** ${ctx.averageUtilization}\n`;
    return reply;
  }

  // --- 14. Project Detail / Milestones / Tasks View ---
  if (ctx.intent === 'project_detail') {
    const p = ctx.project;
    const isAskingMilestones = qLower.includes('milestone') || qLower.includes('gate');
    const isAskingTasks = qLower.includes('task') || qLower.includes('todo') || qLower.includes('action');

    let reply = `Here are the database records for **${p.title}**:\n\n`;
    reply += `* **Status:** ${p.status}\n`;
    reply += `* **Scheme Code:** \`${p.code || 'Registered'}\`\n`;
    reply += `* **Ministry / Agency:** ${p.ministry}\n`;
    reply += `* **Sanctioned Budget:** ${formatIndianCurrency(p.sanctionedBudget)}\n`;
    reply += `* **Utilized Budget:** ${formatIndianCurrency(p.utilizedBudget)} (${p.utilizationRate} utilized)\n`;
    reply += `* **Remaining Balance:** ${formatIndianCurrency(p.remainingBudget)}\n`;
    if (p.startDate) reply += `* **Start Date:** ${new Date(p.startDate).toLocaleDateString()}\n`;
    if (p.expectedCompletionDate) reply += `* **Target Completion:** ${new Date(p.expectedCompletionDate).toLocaleDateString()}\n`;
    if (p.responsibleOfficer) reply += `* **Responsible Officer:** ${p.responsibleOfficer}\n`;

    // Milestones section
    if (p.milestones && p.milestones.length > 0) {
      reply += `\n### Milestones & Stage Gates\n`;
      p.milestones.forEach((m, idx) => {
        const stageStr = m.stage ? ` | Stage: ${m.stage}` : '';
        const dueStr = m.dueDate ? ` | Target: ${new Date(m.dueDate).toLocaleDateString()}` : '';
        const inChargeStr = m.responsiblePerson ? ` | In-charge: ${m.responsiblePerson}` : '';
        reply += `${idx + 1}. **${m.title}**: Status \`${m.status}\`${stageStr}${dueStr}${inChargeStr}\n`;
      });
    } else if (isAskingMilestones) {
      reply += `\n*I could not find recorded milestones for this scheme in the available project database.*\n`;
    }

    // Tasks section
    if (p.tasks && p.tasks.length > 0) {
      reply += `\n### Active Tasks & Action Items\n`;
      p.tasks.forEach((t, idx) => {
        reply += `${idx + 1}. **${t.title}**: Status \`${t.status}\` | Priority: **${t.priority.toUpperCase()}** | Assigned: ${t.assignedTo}\n`;
      });
    } else if (isAskingTasks) {
      reply += `\n*I could not find active tasks logged for this scheme in the available project database.*\n`;
    }

    // Risks section (if query asked or risks exist)
    if (p.risks && p.risks.length > 0 && (qLower.includes('risk') || qLower.includes('threat'))) {
      reply += `\n### Recorded Risks & Mitigations\n`;
      p.risks.forEach((r, idx) => {
        reply += `${idx + 1}. **${r.title}**: Severity \`${r.severity}\` | Status: ${r.status} | Mitigation: ${r.mitigationPlan}\n`;
      });
    }

    // Contextual Practical Example
    reply += `\n---\n\n### Practical Example\n**Physical Verification & Stage-Gate Audit:**  \nFor ${p.title}, before releasing financial disbursements for milestones marked In-Progress, the Project Management Unit (PMU) must conduct on-site physical measurement verification and inspect contractor material testing certificates in accordance with GFR Rule 139.`;

    return reply;
  }

  return `I could not find that information in the available project database.`;
};

export const aiService = {
  /**
   * Run Dynamic Database-Grounded Question Answering Agent
   * @param {string} message - User's query
   * @param {Array} history - Previous turns
   */
  runAgent: async ({ message, history = [] }) => {
    if (!message || !message.trim()) {
      return {
        reply: 'Please ask a question related to your government projects, milestones, tasks, or budgets.',
        toolsUsed: [],
      };
    }

    // 1. DYNAMIC RETRIEVAL LAYER: Query MongoDB First
    let retrievedData = null;
    try {
      retrievedData = await retrieveDatabaseContext(message, history);
    } catch (err) {
      console.warn('[Database Retrieval Notice]', err.message);
    }

    // Format the database answer upfront
    const groundedDatabaseAnswer = formatGroundedResponse(retrievedData, message);

    const apiKey = envConfig.geminiApiKey?.trim();
    const modelName = envConfig.geminiModel || 'gemini-3.6-flash';

    // 2. GENERATION LAYER: If Gemini API is available and quota permits, pass structured DB context to LLM
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const promptContext = `
USER QUESTION: "${message}"

STRUCTURED MONGODB DATABASE CONTEXT:
${JSON.stringify(retrievedData, null, 2)}

INSTRUCTIONS:
Answer the user's question using ONLY the provided structured database context above.
Never invent dates, numbers, milestones, tasks, or statuses that do not appear in the database context.
If the database context says information was not found or is empty, state: "I could not find that information in the available project database."
Format using clear markdown with bold headers and lists. Include the practical example if present.
`;

        const contents = [];
        // Append recent conversational turns for multi-turn coherence
        for (const item of history.slice(-4)) {
          if (item.sender === 'user') {
            contents.push({ role: 'user', parts: [{ text: item.text }] });
          } else if (item.sender === 'assistant' || item.sender === 'bot') {
            contents.push({ role: 'model', parts: [{ text: item.text }] });
          }
        }

        contents.push({ role: 'user', parts: [{ text: promptContext }] });

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.1, // High fidelity to database context
          },
        });

        const reply = response.text?.trim();
        if (reply) {
          return {
            reply,
            toolsUsed: ['mongoDbDynamicRetrieval'],
            model: modelName,
            liveAi: true,
          };
        }
      } catch (err) {
        console.warn(`[Gemini Generation Notice] ${err.message}. Generating grounded response directly from MongoDB data.`);
      }
    }

    // 3. ROBUST FALLBACK GENERATION: If Gemini 429 occurs, return the exact grounded MongoDB answer
    return {
      reply: groundedDatabaseAnswer,
      toolsUsed: ['mongoDbDynamicRetrieval'],
      model: 'government-pm-database-engine',
      liveAi: false,
    };
  },

  /**
   * Get Category-Specific Prompt Suggestions
   */
  getSuggestions: () => {
    return [
      {
        category: 'Project Milestones',
        prompt: 'What are the milestones of Ultra Mega Solar Park?',
      },
      {
        category: 'Officer Tasks',
        prompt: 'What tasks are assigned to Nakul?',
      },
      {
        category: 'Milestone Responsibility',
        prompt: 'Who is responsible for the BESS commissioning?',
      },
      {
        category: 'Flagged Schemes',
        prompt: 'Which projects have blocked tasks?',
      },
      {
        category: 'Ministry Overview',
        prompt: 'Show projects under MNRE.',
      },
      {
        category: 'Task Priorities',
        prompt: 'Which tasks are critical?',
      },
    ];
  },
};

export default aiService;
