const mongoose = require('mongoose');

const kluppListaSchema = new mongoose.Schema({
  orderNumber: { type: Number },
  kund: { type: String },
  antal: { type: Number, default: 1 },
  sagverk: { type: String },
  dimension: { type: String, required: true },
  max_langd: { type: String, required: true },
  pktNumber: { type: String },
  sort: { type: String },
  stad: { type: String },
  magasin: { type: String },
  lagerplats: { type: String },
  leveransDatum: { type: String },
  information: { type: String },
  position: { type: Number },
  status: {
    klar: { type: Boolean, default: false },
    ej_Klar: { type: Number, default: null, enum: [1, 2, 3], } // 1: Not found, 2: No time, 3: Other
  },
  delivered: { type: Boolean, default: false }, // New field for completion status
});

module.exports = mongoose.model('Klupplista', kluppListaSchema);