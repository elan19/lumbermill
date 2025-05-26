// models/Lagerplats.js
const mongoose = require('mongoose');

const LagerplatsSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["Sågat", "Kantat", "Okantat"] },
  tree: { type: String, required: true }, // e.g., "f", "gr"
  dim: { type: Number, required: true }, // Thickness
  location: { type: String }, // Location

  // Specifikt för Sågat virke
  sawData: {
    tum: { type: String }, // Inches
    typ: { type: String }, // Side/X
    nt: { type: String }, // Nertork, additional info
  },

  // Specifik för Kantat virke
  kantatData: {
    bredd: { type: String, required: function () { return this.type === "Kantat"; } }, // Bredd },
    varv: { type: String },
    max_langd: { type: String },
    kvalite: { type: String, required: function () { return this.type === "Kantat"; } },
    pktNr: { type: String },
  },

  okantatData: {
    varv: { type: String },
    kvalite: { type: String }, // Include the bad qualities
    typ: { type: String },
    nt: { type: String },
    pktNr: { type: String },
    pktNamn: { type: String }
  },
});

module.exports = mongoose.model('Lagerplats', LagerplatsSchema);
