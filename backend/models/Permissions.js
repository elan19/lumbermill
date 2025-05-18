// models/Permission.js
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  resource: { // e.g., 'orders', 'prilista', 'users', 'settings'
    type: String,
    required: true,
    trim: true
  },
  action: { // e.g., 'create', 'read', 'update', 'delete', 'markComplete', 'reorder'
    type: String,
    required: true,
    trim: true
  },
  description: { // Optional: User-friendly description
    type: String,
    trim: true
  }
}, { _id: false }); // Permissions can be subdocuments or have their own IDs if managed separately

// It's common to make resource + action unique if these are top-level documents
// permissionSchema.index({ resource: 1, action: 1 }, { unique: true });

// This schema will likely be EMBEDDED within the Role schema, or referenced.
// If you want to manage permissions independently and assign them:
// module.exports = mongoose.model('Permission', permissionSchema);
// For embedding, you might not export it as a top-level model.
// For simplicity of the Role model, we'll assume we manage a list of permission strings
// or defined objects. Let's refine Permission for clarity for embedding.

module.exports = permissionSchema; // Export schema to be used as a subdocument