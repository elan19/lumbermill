const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: Number, required: true, unique: true },
  customer: { type: String, required: true },
  delivery: { type: String },
  status: { type: String, enum: ['In Progress', 'Completed', "Delivered"], default: 'In Progress' },
  notes: [{ type: String }],
  speditor: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  prilista: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PriLista' }], // Array of PriLista references
  kantlista: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KantLista' }],
  klupplista: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KluppLista' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
