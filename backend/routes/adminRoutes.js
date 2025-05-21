// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const authenticateToken = require('./authMiddleware'); // Your existing auth middleware
const checkPermission = require('../middleware/authorizationMiddleware'); // Your permission checking middleware

// --- Helper for listing all defined permissions (could be from a config file or dynamically generated) ---
const getAllDefinedPermissions = () => {
  return [ /* Copy your 'definedPermissions' array from the seed script here or load from a config */
    "orders:create", "orders:read", "orders:readOwn", "orders:update", "orders:delete", "orders:markDelivered",
    "prilista:create", "prilista:read", "prilista:update", "prilista:delete", "prilista:markComplete", "prilista:reorder", "prilista:addFromOrder",
    "kantlista:create", "kantlista:read", "kantlista:update", "kantlista:delete", "kantlista:markComplete", "kantlista:reorder", "kantlista:toggleActive",
    "klupplista:create", "klupplista:read", "klupplista:update", "klupplista:delete", "klupplista:reorder", "klupplista:changeStatus",
    "lagerplats:create", "lagerplats:read", "lagerplats:update", "lagerplats:delete",
    "settings:read", "settings:update",
    "admin:access", "admin:managePermissions"
  ];
};


// GET all roles and their permissions
router.get('/roles', authenticateToken, checkPermission('admin', 'managePermissions'), async (req, res) => {
  try {
    const roles = await Role.find({}); // Populate permissions if they are ObjectIds
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roles', error: error.message });
  }
});

// GET all defined system permissions
router.get('/permissions-list', authenticateToken, checkPermission('admin', 'managePermissions'), async (req, res) => {
  try {
    const permissions = getAllDefinedPermissions();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching permissions list', error: error.message });
  }
});


// GET permissions for a specific role
router.get('/roles/:roleName/permissions', authenticateToken, checkPermission('admin', 'managePermissions'), async (req, res) => {
  try {
    const role = await Role.findOne({ name: req.params.roleName });
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role.permissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching role permissions', error: error.message });
  }
});

// UPDATE permissions for a specific role
router.put('/roles/:roleName/permissions', authenticateToken, checkPermission('admin', 'managePermissions'), async (req, res) => {
  try {
    const { permissions } = req.body; // Expect an array of permission strings
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissions must be an array of strings.' });
    }

    // Optional: Validate if all sent permissions are valid defined permissions
    const definedPermissions = getAllDefinedPermissions();
    const invalidPermissions = permissions.filter(p => !definedPermissions.includes(p));
    if (invalidPermissions.length > 0) {
        return res.status(400).json({ message: `Invalid permissions provided: ${invalidPermissions.join(', ')}`});
    }


    const role = await Role.findOneAndUpdate(
      { name: req.params.roleName },
      { $set: { permissions: permissions } },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json({ message: `Permissions for role '${role.name}' updated successfully.`, role });
  } catch (error) {
    console.error("Error updating role permissions:", error);
    res.status(500).json({ message: 'Error updating role permissions', error: error.message });
  }
});

module.exports = router;