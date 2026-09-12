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
    if (!userData.username || !userData.email || !userData.password) {
      throw new ApiError(400, 'Username, email, and password are required');
    }
    const existing = await userDao.findByEmail(userData.email);
    if (existing) {
      throw new ApiError(409, 'User with this email already exists');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    const created = await userDao.create({
      username: userData.username,
      email: userData.email,
      passwordHash,
      role: userData.role || 'user',
      isAdmin: userData.role === 'admin' || !!userData.isAdmin,
      createdAt: new Date(),
    });
    return created;
  },

  updateUser: async (id, updateData) => {
    const user = await userDao.findById(id);
    if (!user) throw new ApiError(404, 'User not found');

    const toUpdate = { ...updateData };
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
