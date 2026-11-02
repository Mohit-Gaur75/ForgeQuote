// server/src/middleware/requireRole.js
import { AuthorizationError, AuthenticationError } from '../utils/errors.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError(`Requires one of: ${allowedRoles.join(', ')}`));
    }
    next();
  };
}
