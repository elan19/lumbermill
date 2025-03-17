const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true, maxlength: 255 },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  refreshToken: { type: String }
});



module.exports = mongoose.model('User', userSchema);




// Hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});