import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.util.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { envConfig } from '../config/env.config.js';
import { userDao } from '../dao/user.dao.js';

/**
 * Validates JWT Bearer authorization header
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    throw new ApiError(401, 'Unauthorized request: Bearer token is missing');
  }

  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    const user = await userDao.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'Unauthorized: User account not found in database');
    }
    req.user = {
      ...user,
      id: (user._id || user.id).toString(),
      _id: (user._id || user.id).toString(),
      role: user.role || (user.isAdmin ? 'admin' : 'user'),
    };
    return next();
  } catch (err) {
    throw new ApiError(401, err.message || 'Invalid or expired authentication token');
  }
});

/**
 * Role-Based Access Control Guard
 */
export const requireRole = (allowedRoles = []) => {
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User is not authenticated'));
    }

    const userRole = (req.user.role || '').toLowerCase();
    const isAdmin = req.user.isAdmin || userRole === 'admin';

    if (isAdmin || normalizedAllowed.includes(userRole)) {
      return next();
    }

    return next(
      new ApiError(
        403,
        `Forbidden: Role '${req.user.role}' does not have permission to execute this administrative action.`
      )
    );
  };
};

export const authorizeAdmin = requireRole(['admin', 'ADMIN']);

export default {
  verifyJWT,
  requireRole,
  authorizeAdmin,
};
