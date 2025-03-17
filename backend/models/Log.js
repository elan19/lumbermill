const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    level: { type: String, enum: ['info', 'warn', 'error', 'debug'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    context: { type: String, default: '' }, // Context about where the log is coming from
    stack: { type: String }, // Stack trace, useful for errors
});
  
module.exports = mongoose.model('Log', logSchema);