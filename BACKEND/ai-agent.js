import dotenv from 'dotenv';
dotenv.config();

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import mongoose from 'mongoose';
import { aiService } from './src/services/ai.service.js';

const History = [];
const apiKey = process.env.GEMINI_API_KEY;

console.log('\n================================================================');
console.log(' 🇮🇳 Government Project Management Assistant AI');
console.log(' Domain: Infrastructure, Budgets, Tenders, GFR, Milestones & Risks');
console.log('================================================================\n');

if (!apiKey) {
  console.log('ℹ️  Note: GEMINI_API_KEY not found in .env — using intelligent domain fallback mode.');
  console.log('   (Add GEMINI_API_KEY=your_key in BACKEND/.env for live Gemini generation)\n');
}

async function runCliAgent(userProblem) {
  History.push({
    role: 'user',
    parts: [{ text: userProblem }],
  });

  // Call the centralized Government AI Assistant service
  const response = await aiService.runAgent({
    message: userProblem,
    history: History.slice(0, -1),
  });

  History.push({
    role: 'model',
    parts: [{ text: response.reply }],
  });

  console.log('\n----------------------------------------------------------------');
  console.log('🤖 AI Assistant:');
  console.log(response.reply);
  if (response.toolsUsed && response.toolsUsed.length > 0) {
    console.log(`\n[Tools Invoked: ${response.toolsUsed.join(', ')}]`);
  }
  console.log('----------------------------------------------------------------\n');
}

async function startRepl() {
  const rl = readline.createInterface({ input, output });

  while (true) {
    try {
      const userProblem = await rl.question('Ask Project Management AI (or type "exit") ---> ');
      if (!userProblem || userProblem.trim().toLowerCase() === 'exit') {
        console.log('\nExiting Government AI Assistant. Jai Hind!\n');
        rl.close();
        process.exit(0);
      }

      await runCliAgent(userProblem.trim());
    } catch (err) {
      break;
    }
  }
}

// Connect to MongoDB Atlas for live database tool calling if available
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas for Live Scheme Data\n');
      startRepl();
    })
    .catch((err) => {
      console.warn('⚠️ MongoDB connection note:', err.message);
      startRepl();
    });
} else {
  startRepl();
}
