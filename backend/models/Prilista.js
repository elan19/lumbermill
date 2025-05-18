const mongoose = require('mongoose');

const priListaSchema = new mongoose.Schema({
  orderNumber: { type: Number },
  customer: { type: String, required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  type: { type: String, required: true},
  dimension: { type: String, required: true },
  location: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false }, // New field for completion status
  position: { type: Number },
  measureLocation: { type: String },
  pktNr: { type: Number },
});

// No unique constraint on `orderNumber` to allow multiple PriLista with the same `orderNumber`
module.exports = mongoose.model('PriLista', priListaSchema);


