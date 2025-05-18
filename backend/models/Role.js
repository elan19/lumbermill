// models/Role.js
const mongoose = require('mongoose');
// const PermissionSchema = require('./Permission'); // If using Permission as subdocument schema

const roleSchema = new mongoose.Schema({
  name: { // 'admin', 'employee', 'truck'
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'employee', 'truck'] // Ensure consistency with User.role
  },
  description: {
    type: String
  },
  // Array of permission objects or strings
  // Option A: Storing simple permission strings (e.g., "orders:create", "users:read")
  permissions: [{
    type: String, // e.g., "orders:create", "prilista:read"
    trim: true
  }]
  // Option B: Referencing Permission documents (if Permission is a separate collection)
  // permissions: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Permission'
  // }]
  // Option C: Embedding Permission schema (if PermissionSchema is defined for subdocuments)
  // permissions: [PermissionSchema]
});

module.exports = mongoose.model('Role', roleSchema);