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

// Helper to test all queries
const testQueries = [
  "What are the milestones of Ultra Mega Solar Park?",
  "What are the milestones ultra mega solar park & high-voltage bess grid link?",
  "Show me all delayed projects.",
  "Which projects have critical tasks?",
  "What is the budget of the HUDCO hospital project?",
  "Who is responsible for the 220/400 kV pooling substation?",
  "What tasks are assigned to Nakul?",
  "Which milestones are pending?",
  "How much budget has been utilized?",
  "Show projects under MNRE.",
  "What is the status of AIIMS project?",
  "Which projects are completed?",
  "Tell me about the Ultra Mega Solar Park & High-Voltage BESS Grid Link.",
  "Which projects have deadlines in February 2026?",
  "What are the active tasks for this project?",
  "How many projects are delayed?",
  "Which officer has the most assigned tasks?",
  "Give me a summary of this project.",
  "Compare two projects.",
  "What milestones are overdue?",
  "Which projects have blocked tasks?"
];

console.log('Total test queries planned:', testQueries.length);
process.exit(0);
