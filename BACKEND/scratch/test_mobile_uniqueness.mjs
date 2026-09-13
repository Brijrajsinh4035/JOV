import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { authService } from '../src/services/auth.service.js';
import { userService } from '../src/services/user.service.js';
import { errorHandler } from '../src/middlewares/error.middleware.js';

await mongoose.connect(process.env.MONGODB_URI);
const usersCol = mongoose.connection.db.collection('users');

console.log('--- Testing Mobile Number Uniqueness & Exceptions ---');

const TEST_PHONE = '+919988776655';
const TEST_EMAIL_1 = 'officer1.unique@gov.in';
const TEST_EMAIL_2 = 'officer2.unique@gov.in';

// Clean any previous test data
await usersCol.deleteMany({ email: { $in: [TEST_EMAIL_1, TEST_EMAIL_2] } });
await usersCol.deleteMany({ phone: TEST_PHONE });

try {
  // 1. Create first user with TEST_PHONE
  console.log('\n[TEST 1] Registering first user with phone', TEST_PHONE);
  const user1 = await authService.register({
    name: 'Officer One',
    email: TEST_EMAIL_1,
    phone: TEST_PHONE,
    password: 'password123',
    role: 'user',
  });
  console.log('✅ User 1 registered successfully. ID:', user1.user.id, 'Phone:', user1.user.phone);

  // 2. Attempt completeMobileProfile with duplicate phone for a different email
  console.log('\n[TEST 2] Attempting completeMobileProfile with duplicate phone for second email...');
  try {
    await authService.completeMobileProfile({
      phone: TEST_PHONE,
      email: TEST_EMAIL_2,
      name: 'Officer Two',
      tempToken: null,
    });
    console.error('❌ FAILED: Should have thrown 409 duplicate phone exception!');
    process.exit(1);
  } catch (err) {
    console.log('✅ Caught expected exception from completeMobileProfile:');
    console.log('   Status:', err.statusCode);
    console.log('   Message:', err.message);
    if (err.statusCode !== 409 || !err.message.includes('already registered')) {
      console.error('❌ Exception format unexpected');
      process.exit(1);
    }
  }

  // 3. Attempt register with duplicate phone
  console.log('\n[TEST 3] Attempting register with duplicate phone...');
  try {
    await authService.register({
      name: 'Officer Two',
      email: TEST_EMAIL_2,
      phone: TEST_PHONE,
      password: 'password456',
    });
    console.error('❌ FAILED: Should have thrown 409 duplicate phone exception!');
    process.exit(1);
  } catch (err) {
    console.log('✅ Caught expected exception from register:');
    console.log('   Status:', err.statusCode);
    console.log('   Message:', err.message);
    if (err.statusCode !== 409 || !err.message.includes('already registered')) {
      console.error('❌ Exception format unexpected');
      process.exit(1);
    }
  }

  // 4. Create User 2 with no phone, then attempt updateUser to duplicate phone
  console.log('\n[TEST 4] Attempting updateUser with duplicate phone...');
  const user2 = await authService.register({
    name: 'Officer Two',
    email: TEST_EMAIL_2,
    password: 'password456',
  });
  try {
    await userService.updateUser(user2.user.id, { phone: TEST_PHONE });
    console.error('❌ FAILED: Should have thrown 409 duplicate phone exception on update!');
    process.exit(1);
  } catch (err) {
    console.log('✅ Caught expected exception from updateUser:');
    console.log('   Status:', err.statusCode);
    console.log('   Message:', err.message);
    if (err.statusCode !== 409 || !err.message.includes('already registered')) {
      console.error('❌ Exception format unexpected');
      process.exit(1);
    }
  }

  // 5. Test direct MongoDB duplicate key index enforcement
  console.log('\n[TEST 5] Testing MongoDB unique sparse index on phone at database layer...');
  try {
    await usersCol.insertOne({
      name: 'Direct Mongo User',
      email: 'direct.mongo@gov.in',
      phone: TEST_PHONE,
    });
    console.error('❌ FAILED: MongoDB should have rejected duplicate phone via unique index!');
    process.exit(1);
  } catch (mongoErr) {
    console.log('✅ MongoDB unique index rejected insertion with code:', mongoErr.code);
    let handledResponse = null;
    const fakeRes = {
      status(code) {
        this.code = code;
        return this;
      },
      json(body) {
        handledResponse = { status: this.code, body };
        return this;
      },
    };
    errorHandler(mongoErr, {}, fakeRes, () => {});
    console.log('✅ Error middleware formatted response:');
    console.log('   Status:', handledResponse.status);
    console.log('   Message:', handledResponse.body.message);
    if (handledResponse.status !== 409 || !handledResponse.body.message.includes('already registered')) {
      console.error('❌ Middleware did not format code 11000 correctly!');
      process.exit(1);
    }
  }

  console.log('\n🎉 ALL MOBILE UNIQUENESS & EXCEPTION TESTS PASSED PERFECTLY!');
} finally {
  // Clean up test users
  await usersCol.deleteMany({ email: { $in: [TEST_EMAIL_1, TEST_EMAIL_2, 'direct.mongo@gov.in'] } });
  await usersCol.deleteMany({ phone: TEST_PHONE });
  await mongoose.disconnect();
}
