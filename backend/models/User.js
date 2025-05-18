const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true, maxlength: 255 },
  role: {
    type: String,
    enum: ['employee', 'admin', 'truck'], // Keep existing role enum
    required: true,
    default: 'employee'
  },
  settings: {
    design: {
      type: String,
      enum: ['old', 'new'], // Specify allowed values for design
      default: 'new'       // Keep 'new' as the default
    },
    orderDesign: {
      type: String,
      enum: ['old', 'new'], // Specify allowed values for orderStyle
      default: 'new'        // Keep 'new' as the default
    },
    fontSize: {
      type: Number,
      default: 16, // Default font size
    }
    // You could add other settings fields here later if needed
  },
  refreshToken: { type: String }
});

// --- Middleware MUST be defined BEFORE compiling the model ---

/*userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});*/

// Hash the password before saving
/*userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10); // Generate salt (recommended)
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass error to Mongoose error handling
  }
});*/

// --- Compile the model AFTER defining middleware ---
module.exports = mongoose.model('User', userSchema);



/*// Hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});*/