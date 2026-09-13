import { userDao } from '../dao/user.dao.js';
import { ApiError } from '../utils/apiError.util.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.config.js';
import { msg91Service, formatMobileNumber } from './msg91.service.js';

export const authService = {
  login: async ({ email, password }) => {
    if (!email || !password) {
      throw new ApiError(400, 'Official email and password are required');
    }

    const user = await userDao.findByEmailWithPassword(email);
    if (!user) {
      throw new ApiError(401, 'Invalid credentials.');
    }

    // Verify password strictly with bcrypt hash
    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } else if (user.password) {
      isMatch = user.password === password;
      if (isMatch) {
        // Upgrade legacy account to secure bcrypt hash
        const salt = await bcrypt.genSalt(10);
        const upgradedHash = await bcrypt.hash(password, salt);
        await userDao.update(user._id || user.id, {
          passwordHash: upgradedHash,
          password: null,
        });
      }
    }

    if (!isMatch) {
      throw new ApiError(401, 'Invalid password. Please check your credentials.');
    }

    // Update lastLogin
    await userDao.update(user._id || user.id, { lastLogin: new Date() });

    const userId = (user._id || user.id).toString();
    const token = jwt.sign(
      { id: userId, email: user.email, role: user.role, isAdmin: user.isAdmin },
      envConfig.jwtSecret,
      { expiresIn: envConfig.jwtExpiresIn }
    );

    const { passwordHash, password: _, ...userProfile } = user;

    return {
      user: {
        ...userProfile,
        id: userId,
      },
      token,
    };
  },

  register: async ({ name, email, phone, password, role = 'user', department = '', designation = '' }) => {
    const finalName = name?.trim();
    if (!finalName || !email || !password) {
      throw new ApiError(400, 'Full name, email, and password are required');
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await userDao.findByEmail(cleanEmail);
    if (existing) {
      throw new ApiError(409, 'User already exists with this email ID');
    }

    let cleanPhone = undefined;
    if (phone) {
      const digits = String(phone).replace(/[^\d]/g, '');
      const last10 = digits.slice(-10);
      cleanPhone = `+91${last10}`;
      const existingPhone = await userDao.findByPhone(last10);
      if (existingPhone) {
        throw new ApiError(409, 'This mobile number is already registered with another account.');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const normalizedRole = 'user';
    const newUser = await userDao.create({
      name: finalName,
      email: cleanEmail,
      ...(cleanPhone ? { phone: cleanPhone } : {}),
      passwordHash,
      role: normalizedRole,
      isAdmin: false,
      department: department.trim(),
      designation: designation.trim(),
      createdAt: new Date(),
    });

    const userId = (newUser._id || newUser.id).toString();
    const token = jwt.sign(
      { id: userId, email: newUser.email, role: newUser.role, isAdmin: newUser.isAdmin },
      envConfig.jwtSecret,
      { expiresIn: envConfig.jwtExpiresIn }
    );

    return {
      user: newUser,
      token,
    };
  },

  getCurrentUser: async (userId) => {
    const user = await userDao.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User record not found');
    }
    const { passwordHash, password: _, ...userProfile } = user;
    return userProfile;
  },

  sendMobileOtp: async (mobile) => {
    if (!mobile) {
      throw new ApiError(400, 'Mobile number is required');
    }
    return await msg91Service.sendOtp({ mobile });
  },

  verifyMobileOtp: async ({ mobile, otp }) => {
    if (!mobile || !otp) {
      throw new ApiError(400, 'Both mobile number and OTP are required');
    }

    // 1. Verify OTP with MSG91
    await msg91Service.verifyOtp({ mobile, otp });

    // 2. Identify Registered Officer
    const formatted = formatMobileNumber(mobile);
    const digits = String(formatted).replace(/[^\d]/g, '');
    const last10 = digits.slice(-10);

    const user = await userDao.findByPhone(last10);

    // If user already exists in database, log them in directly
    if (user) {
      const userId = (user._id || user.id).toString();
      await userDao.update(userId, { lastLogin: new Date() });

      const token = jwt.sign(
        { id: userId, email: user.email, role: user.role, isAdmin: user.isAdmin },
        envConfig.jwtSecret,
        { expiresIn: envConfig.jwtExpiresIn }
      );

      const { passwordHash, password: _, ...userProfile } = user;

      return {
        isNewUser: false,
        user: {
          ...userProfile,
          id: userId,
        },
        token,
        message: 'Mobile OTP authentication successful',
      };
    }

    // If user does NOT exist in database, require email & profile setup
    const tempToken = jwt.sign(
      { phone: `+91${last10}`, isPhoneVerified: true },
      envConfig.jwtSecret,
      { expiresIn: '15m' }
    );

    return {
      isNewUser: true,
      phone: `+91${last10}`,
      mobile: last10,
      tempToken,
      message: 'Mobile number verified. Please enter your official email to complete registration.',
    };
  },

  resendMobileOtp: async (mobile) => {
    if (!mobile) {
      throw new ApiError(400, 'Mobile number is required');
    }
    return await msg91Service.resendOtp({ mobile });
  },

  verifyWidgetAuth: async ({ mobile, widgetData }) => {
    let cleanMobile = '';

    // 1. Try extracting verified mobile from widget response / MSG91 token
    if (typeof widgetData === 'object' && widgetData !== null) {
      const candidate =
        widgetData.mobile ||
        widgetData.phone ||
        widgetData.identifier ||
        widgetData.contact_number ||
        widgetData.number;
      if (candidate && String(candidate).replace(/[^\d]/g, '').length >= 10) {
        cleanMobile = formatMobileNumber(candidate);
      }
    }

    let tokenCandidate = null;
    if (typeof widgetData === 'string') {
      tokenCandidate = widgetData;
    } else if (typeof widgetData === 'object' && widgetData !== null) {
      tokenCandidate =
        widgetData['access-token'] ||
        widgetData.accessToken ||
        widgetData.token ||
        widgetData.message;
    }

    if (!cleanMobile && tokenCandidate && typeof tokenCandidate === 'string') {
      // Check if tokenCandidate is a JWT
      try {
        const parts = tokenCandidate.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          const jwtMobile =
            payload.mobile ||
            payload.phone ||
            payload.identifier ||
            payload.sub ||
            payload.contact_number;
          if (jwtMobile && String(jwtMobile).replace(/[^\d]/g, '').length >= 10) {
            cleanMobile = formatMobileNumber(jwtMobile);
          }
        }
      } catch (_) {}

      // Query MSG91 verifyAccessToken API if authKey is present
      const authKey = envConfig.msg91AuthKey?.trim();
      if (!cleanMobile && authKey) {
        try {
          const resp = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authkey: authKey,
            },
            body: JSON.stringify({
              'access-token': tokenCandidate,
              authkey: authKey,
            }),
          });
          const resData = await resp.json();
          console.log('[MSG91 verifyAccessToken Response]', resData);
          if (resData) {
            const rawMsg = resData.message;
            if (rawMsg && typeof rawMsg === 'string') {
              const digits = rawMsg.replace(/[^\d]/g, '');
              if (digits.length >= 10) {
                cleanMobile = formatMobileNumber(digits);
              }
            }
            if (!cleanMobile) {
              const apiMobile =
                resData.mobile ||
                resData.phone ||
                resData.number ||
                resData.identifier ||
                resData.data?.mobile ||
                resData.data?.number;
              if (apiMobile) {
                cleanMobile = formatMobileNumber(apiMobile);
              }
            }
          }
        } catch (err) {
          console.warn('[MSG91 verifyAccessToken notice]:', err.message);
        }
      }
    }

    // 2. Fall back to mobile number provided from user input on the page
    if (!cleanMobile && mobile) {
      cleanMobile = formatMobileNumber(mobile);
    }

    if (!cleanMobile || cleanMobile.length < 10) {
      throw new ApiError(400, 'Could not determine verified mobile number. Please enter your 10-digit mobile number.');
    }

    const digits = String(cleanMobile).replace(/[^\d]/g, '');
    const last10 = digits.slice(-10);

    const user = await userDao.findByPhone(last10);

    if (user) {
      const userId = (user._id || user.id).toString();
      await userDao.update(userId, { lastLogin: new Date() });

      const token = jwt.sign(
        { id: userId, email: user.email, role: user.role, isAdmin: user.isAdmin },
        envConfig.jwtSecret,
        { expiresIn: envConfig.jwtExpiresIn }
      );

      const { passwordHash, password: _, ...userProfile } = user;

      return {
        isNewUser: false,
        user: {
          ...userProfile,
          id: userId,
        },
        token,
        message: 'MSG91 Widget authentication successful',
      };
    }

    // New user via widget
    const tempToken = jwt.sign(
      { phone: `+91${last10}`, isPhoneVerified: true },
      envConfig.jwtSecret,
      { expiresIn: '15m' }
    );

    return {
      isNewUser: true,
      phone: `+91${last10}`,
      mobile: last10,
      tempToken,
      message: 'Mobile number verified via widget. Please provide official email to complete registration.',
    };
  },

  completeMobileProfile: async ({ phone, email, name, password, department, designation, tempToken }) => {
    if (!phone || !email) {
      throw new ApiError(400, 'Both verified mobile number and official email are required');
    }

    if (!password || String(password).trim().length < 6) {
      throw new ApiError(400, 'Please create a secure password of at least 6 characters.');
    }

    // Optional verification of temporary token
    if (tempToken) {
      try {
        const decoded = jwt.verify(tempToken, envConfig.jwtSecret);
        if (!decoded.isPhoneVerified) {
          throw new ApiError(401, 'Mobile verification token invalid');
        }
      } catch (err) {
        throw new ApiError(401, 'Verification session expired. Please verify OTP again.');
      }
    }

    const digits = String(phone).replace(/[^\d]/g, '');
    const last10 = digits.slice(-10);
    const cleanPhone = `+91${last10}`;
    const cleanEmail = String(email).trim().toLowerCase();

    // Check if phone or email already exist
    const existingByPhone = await userDao.findByPhone(last10);
    let user = await userDao.findByEmail(cleanEmail);

    // If this mobile number is already registered to a different account, throw 409 exception
    if (existingByPhone) {
      const phoneUserId = (existingByPhone._id || existingByPhone.id).toString();
      if (user) {
        const emailUserId = (user._id || user.id).toString();
        if (phoneUserId !== emailUserId) {
          throw new ApiError(409, 'This mobile number is already registered with another account.');
        }
      } else {
        throw new ApiError(409, 'This mobile number is already registered with another account.');
      }
    }

    // Hash password with bcrypt salt = 10
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password).trim(), salt);

    if (user) {
      const emailUserId = (user._id || user.id).toString();
      const phoneUserId = existingByPhone ? (existingByPhone._id || existingByPhone.id).toString() : null;
      if (!phoneUserId || phoneUserId !== emailUserId) {
        throw new ApiError(409, 'User already exists with this email ID');
      }
      // Same user re-verifying
      await userDao.update(user._id || user.id, {
        phone: cleanPhone,
        passwordHash: hashedPassword,
        lastLogin: new Date(),
      });
      user = await userDao.findById(user._id || user.id);
    } else {
      // Create new user in database with verified phone, provided email, and hashed password
      const displayName = name?.trim() || `Officer ${last10.slice(-4)}`;
      user = await userDao.create({
        name: displayName,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash: hashedPassword,
        role: 'user',
        isAdmin: false,
        department: department?.trim() || '',
        designation: designation?.trim() || '',
        createdAt: new Date(),
        lastLogin: new Date(),
      });
    }

    const userId = (user._id || user.id).toString();
    const token = jwt.sign(
      { id: userId, email: user.email, role: user.role, isAdmin: user.isAdmin },
      envConfig.jwtSecret,
      { expiresIn: envConfig.jwtExpiresIn }
    );

    const { passwordHash: _ph, password: _, ...userProfile } = user;

    return {
      isNewUser: false,
      user: {
        ...userProfile,
        id: userId,
      },
      token,
      message: 'Account setup complete. Welcome!',
    };
  },
};

export default authService;
