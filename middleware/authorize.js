import { permissions } from '../config/permissions.js';

export function authorize(permission) {
  return (req, res, next) => {
    // Assume req.user is set by verifyToken middleware
    const userRole = req.user?.role || 'guest';
    if (!permissions[permission] || !permissions[permission].includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
} 