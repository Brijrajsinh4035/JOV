import { userDao } from '../dao/user.dao.js';
import { ApiError } from '../utils/apiError.util.js';
import bcrypt from 'bcryptjs';

export const userService = {
  getAllUsers: async (query = {}) => {
    return await userDao.findAll(query);
  },

  getUserById: async (id) => {
    const user = await userDao.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  },

  createUser: async (userData) => {
    if (!userData.email || !userData.password) {
      throw new ApiError(400, 'Email and password are required');
    }
    const existing = await userDao.findByEmail(userData.email);
    if (existing) {
      throw new ApiError(409, 'User already exists with this email ID');
    }

    let cleanPhone = undefined;
    if (userData.phone) {
      const digits = String(userData.phone).replace(/[^\d]/g, '');
      const last10 = digits.slice(-10);
      cleanPhone = `+91${last10}`;
      const existingPhone = await userDao.findByPhone(last10);
      if (existingPhone) {
        throw new ApiError(409, 'This mobile number is already registered with another account.');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    const created = await userDao.create({
      name: userData.name || userData.email.split('@')[0],
      email: userData.email,
      ...(cleanPhone ? { phone: cleanPhone } : {}),
      passwordHash,
      role: userData.role || 'manager',
      isAdmin: userData.role === 'admin' || !!userData.isAdmin,
      createdAt: new Date(),
    });
    return created;
  },

  updateUser: async (id, updateData) => {
    const user = await userDao.findById(id);
    if (!user) throw new ApiError(404, 'User not found');

    const toUpdate = { ...updateData };

    if (toUpdate.phone) {
      const digits = String(toUpdate.phone).replace(/[^\d]/g, '');
      const last10 = digits.slice(-10);
      toUpdate.phone = `+91${last10}`;
      const existingPhone = await userDao.findByPhone(last10);
      if (existingPhone && (existingPhone._id || existingPhone.id).toString() !== id.toString()) {
        throw new ApiError(409, 'This mobile number is already registered with another account.');
      }
    }

    if (toUpdate.password) {
      const salt = await bcrypt.genSalt(10);
      toUpdate.passwordHash = await bcrypt.hash(toUpdate.password, salt);
      delete toUpdate.password;
    }
    if (toUpdate.role) {
      toUpdate.isAdmin = toUpdate.role === 'admin';
    }

    const updated = await userDao.update(id, toUpdate);
    return updated;
  },

  deleteUser: async (id) => {
    const user = await userDao.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return await userDao.delete(id);
  },
};

export default userService;
