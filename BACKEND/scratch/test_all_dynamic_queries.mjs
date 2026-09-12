import mongoose from 'mongoose';
import { envConfig } from '../src/config/env.config.js';
import { aiService, retrieveDatabaseContext } from '../src/services/ai.service.js';

const TEST_QUERIES = [
  'What are the milestones of Ultra Mega Solar Park?',
  'What are the milestones ultra mega solar park & high-voltage bess grid link?',
  'Show me all delayed projects.',
  'Which projects have critical tasks?',
  'Which tasks are critical?',
  'What is the budget of the HUDCO hospital project?',
  'Who is responsible for the 220/400 kV pooling substation?',
  'Who is responsible for the BESS commissioning?',
  'What tasks are assigned to Nakul?',
  'Which milestones are pending?',
  'How much budget has been utilized?',
  'Show projects under MNRE.',
  'What is the status of AIIMS project?',
  'Which projects are completed?',
  'Which officer has the most assigned tasks?',
  'Which projects have deadlines in February 2026?',
  'Which projects have blocked tasks?',
  'Compare Ultra Mega Solar Park and Delhi-Mumbai Expressway',
  'Tell me about Chennai Integrated Flood Mitigation Canal',
  'What is the budget of NonExistentProjectXYZ?'
];

async function runTests() {
  try {
    console.log('Connecting to MongoDB at:', envConfig.mongoUri ? envConfig.mongoUri.replace(/:([^:@]+)@/, ':***@') : 'MISSING_URI');
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Connected to MongoDB successfully.\n');

    let passed = 0;
    for (let i = 0; i < TEST_QUERIES.length; i++) {
      const q = TEST_QUERIES[i];
      console.log(`======================================================================`);
      console.log(`[TEST ${i + 1}/${TEST_QUERIES.length}] Query: "${q}"`);
      console.log(`======================================================================`);

      const ctx = await retrieveDatabaseContext(q);
      console.log(`[RETRIEVED INTENT]: ${ctx?.intent || 'none'}`);

      const res = await aiService.runAgent({ message: q });
      console.log(`[AGENT MODEL]: ${res.model} | LiveAi: ${res.liveAi}`);
      console.log(`[RESPONSE PREVIEW]:\n${res.reply.slice(0, 300)}...`);
      console.log(`----------------------------------------------------------------------\n`);

      if (res.reply && !res.reply.includes('generic') && res.reply.length > 20) {
        passed++;
      }
    }

    console.log(`\n🎉 Verification Summary: ${passed}/${TEST_QUERIES.length} tests executed successfully.`);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
