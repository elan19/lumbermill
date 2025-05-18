// Example: middleware/authorizationMiddleware.js
const Role = require('../models/Role'); // Adjust path

const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const permissionString = `${resource}:${action}`; // e.g., "orders:create"

    // Admins have all permissions (or this can be more granular if needed)
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const userRoleDoc = await Role.findOne({ name: req.user.role });
      if (!userRoleDoc) {
        return res.status(403).json({ message: 'User role not found or configured.' });
      }

      // Check if the permissionString is in the role's permissions array
      if (userRoleDoc.permissions && userRoleDoc.permissions.includes(permissionString)) {
        next();
      } else {
        return res.status(403).json({ message: `Role '${req.user.role}' does not have permission for '${permissionString}'.` });
      }
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ message: 'Server error during permission check.' });
    }
  };
};
module.exports = checkPermission;