import mongoose from 'mongoose';
import { envConfig } from '../src/config/env.config.js';
import { authService } from '../src/services/auth.service.js';
import { userDao } from '../src/dao/user.dao.js';
import User from '../src/models/user.model.js';

async function runTest() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(envConfig.mongoUri);
  console.log('✅ Connected to MongoDB.\n');

  const testPhone = '9825999999';
  const testEmail = 'officer.test99@gov.in';

  try {
    // Clean up any leftovers from previous runs
    await User.deleteOne({ phone: `+91${testPhone}` });
    await User.deleteOne({ email: testEmail });

    // TEST 1: Existing registered user (7203045055)
    console.log('[TEST 1] Verifying OTP for existing registered user (7203045055)...');
    const existingRes = await authService.verifyMobileOtp({ mobile: '7203045055', otp: '123456' });
    console.log('isNewUser:', existingRes.isNewUser);
    console.log('Has Token:', !!existingRes.token);
    console.log('User email:', existingRes.user?.email);
    if (existingRes.isNewUser === false && existingRes.token) {
      console.log('✅ TEST 1 PASSED: Existing user logged in directly.\n');
    } else {
      throw new Error('TEST 1 FAILED');
    }

    // TEST 2: Brand new mobile number (9825999999)
    console.log('[TEST 2] Verifying OTP for new un-registered user (9825999999)...');
    const newRes = await authService.verifyMobileOtp({ mobile: testPhone, otp: '123456' });
    console.log('isNewUser:', newRes.isNewUser);
    console.log('Has tempToken:', !!newRes.tempToken);
    console.log('Message:', newRes.message);
    const dbCheckBefore = await userDao.findByPhone(testPhone);
    console.log('DB User exists before completing profile:', !!dbCheckBefore);

    if (newRes.isNewUser === true && newRes.tempToken && !dbCheckBefore) {
      console.log('✅ TEST 2 PASSED: New user flagged for profile completion without fake auto-provisioning.\n');
    } else {
      throw new Error('TEST 2 FAILED');
    }

    // TEST 3: Complete profile with official email
    console.log('[TEST 3] Calling completeMobileProfile with official email...');
    const completedRes = await authService.completeMobileProfile({
      phone: `+91${testPhone}`,
      email: testEmail,
      name: 'Er. Test Officer',
      department: 'Ministry of Railways',
      tempToken: newRes.tempToken,
    });
    console.log('Completed isNewUser:', completedRes.isNewUser);
    console.log('User created email:', completedRes.user?.email);
    console.log('User created phone:', completedRes.user?.phone);
    console.log('Has permanent token:', !!completedRes.token);

    const dbCheckAfter = await userDao.findByPhone(testPhone);
    console.log('DB User exists after completeMobileProfile:', !!dbCheckAfter);
    if (completedRes.user?.email === testEmail && dbCheckAfter && completedRes.token) {
      console.log('✅ TEST 3 PASSED: User profile and phone successfully stored in MongoDB.\n');
    } else {
      throw new Error('TEST 3 FAILED');
    }

    // TEST 4: Next time login with same phone number -> directly logs in!
    console.log('[TEST 4] Next time login with same phone (9825999999)...');
    const nextTimeRes = await authService.verifyMobileOtp({ mobile: testPhone, otp: '123456' });
    console.log('Next time isNewUser:', nextTimeRes.isNewUser);
    console.log('Next time user email:', nextTimeRes.user?.email);
    console.log('Next time has token:', !!nextTimeRes.token);

    if (nextTimeRes.isNewUser === false && nextTimeRes.user?.email === testEmail && nextTimeRes.token) {
      console.log('✅ TEST 4 PASSED: User directly authenticated without re-asking for email!\n');
    } else {
      throw new Error('TEST 4 FAILED');
    }

    console.log('🎉 ALL 4 BACKEND TESTS PASSED SUCCESSFULLY!');
  } finally {
    // Cleanup
    await User.deleteOne({ phone: `+91${testPhone}` });
    await User.deleteOne({ email: testEmail });
    await mongoose.disconnect();
  }
}

runTest();
