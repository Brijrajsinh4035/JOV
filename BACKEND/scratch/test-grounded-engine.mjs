import 'dotenv/config';
import { connectDB } from '../src/config/db.config.js';
import '../src/models/user.model.js';
import '../src/models/client.model.js';
import '../src/models/project.model.js';
import '../src/models/milestone.model.js';
import '../src/models/task.model.js';
import '../src/models/risk.model.js';
import Project from '../src/models/project.model.js';
import Milestone from '../src/models/milestone.model.js';
import Task from '../src/models/task.model.js';
import Risk from '../src/models/risk.model.js';
import User from '../src/models/user.model.js';

await connectDB();
console.log('Connected to MongoDB Atlas');

const STOP_WORDS = new Set([
  'what', 'are', 'the', 'and', 'for', 'about', 'tell', 'give', 'show', 'me',
  'which', 'of', 'in', 'to', 'is', 'it', 'its', 'with', 'from', 'my', 'our',
  'this', 'that', 'all', 'any', 'some', 'a', 'an', 'please', 'can', 'you',
  'how', 'many', 'much', 'does', 'do', 'have', 'has', 'who'
]);

function extractTokens(q) {
  return String(q || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

// 1. Test Project Search
async function testProjectSearch(query) {
  const tokens = extractTokens(query);
  const allProjects = await Project.find({}).lean();
  const scored = allProjects.map(p => {
    const name = (p.name || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const code = (p.code || '').toLowerCase();
    const combined = `${name} ${title} ${code} ${(p.description || '')} ${(p.ministry || '')}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (name.includes(t)) score += 10;
      else if (title.includes(t)) score += 8;
      else if (code.includes(t)) score += 8;
      else if (combined.includes(t)) score += 3;
    }
    return { p, score };
  }).filter(item => item.score > 0).sort((a,b) => b.score - a.score);
  return scored.slice(0, 3).map(i => ({ title: i.p.title || i.p.name, code: i.p.code, score: i.score }));
}

// 2. Test Task Assignee Search (e.g. Nakul)
async function testTasksByOfficer(officerName) {
  const users = await User.find({
    $or: [
      { name: { $regex: officerName, $options: 'i' } },
      { username: { $regex: officerName, $options: 'i' } }
    ]
  }).lean();
  const userIds = users.map(u => u._id);
  const tasks = await Task.find({ assignedTo: { $in: userIds } })
    .populate('projectId', 'title name code')
    .populate('assignedTo', 'name username')
    .lean();
  return tasks.map(t => ({
    task: t.title,
    priority: t.priority,
    status: t.status,
    project: t.projectId?.title || t.projectId?.name,
    officer: t.assignedTo?.name || t.assignedTo?.username
  }));
}

// 3. Test Critical / Blocked Tasks Search
async function testTasksByFilter({ status, priority }) {
  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  const tasks = await Task.find(query)
    .populate('projectId', 'title name code')
    .populate('assignedTo', 'name username')
    .lean();
  return tasks.map(t => ({
    task: t.title,
    priority: t.priority,
    status: t.status,
    project: t.projectId?.title || t.projectId?.name,
    officer: t.assignedTo?.name || t.assignedTo?.username
  }));
}

// 4. Test Milestone Search across projects or in a project
async function testMilestoneSearch(milestoneQuery) {
  const tokens = extractTokens(milestoneQuery);
  const allProjects = await Project.find({}).lean();
  const results = [];
  for (const p of allProjects) {
    const listFromColl = await Milestone.find({ projectId: p._id }).lean();
    const embedded = Array.isArray(p.milestones) ? p.milestones : [];
    const allM = [...listFromColl, ...embedded];
    for (const m of allM) {
      const text = `${m.title} ${m.stage || ''} ${m.responsiblePerson || ''} ${m.remarks || ''}`.toLowerCase();
      let matches = 0;
      for (const t of tokens) {
        if (text.includes(t)) matches++;
      }
      if (matches >= Math.min(2, tokens.length)) {
        results.push({
          milestone: m.title,
          project: p.title || p.name,
          status: m.status,
          responsible: m.responsiblePerson || 'Unassigned',
          targetDate: m.targetDate || m.dueDate
        });
      }
    }
  }
  return results;
}

console.log('--- Test 1: Project search for "ultra mega solar park" ---');
console.log(await testProjectSearch('ultra mega solar park'));

console.log('--- Test 2: Project search for "HUDCO hospital" ---');
console.log(await testProjectSearch('HUDCO hospital'));

console.log('--- Test 3: Tasks assigned to "Nakul" ---');
console.log(await testTasksByOfficer('Nakul'));

console.log('--- Test 4: Critical tasks ---');
console.log(await testTasksByFilter({ priority: 'critical' }));

console.log('--- Test 5: Blocked tasks & their projects ---');
const blocked = await testTasksByFilter({ status: 'blocked' });
console.log(blocked);
const blockedProjects = Array.from(new Set(blocked.map(t => t.project)));
console.log('Projects with blocked tasks:', blockedProjects);

console.log('--- Test 6: Milestone in-charge search "220/400 kV pooling substation" ---');
console.log(await testMilestoneSearch('220/400 kV pooling substation'));

console.log('--- Test 7: Milestone in-charge search "BESS commissioning" ---');
console.log(await testMilestoneSearch('BESS commissioning'));

process.exit(0);
