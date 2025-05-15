// models/Lagerplats.js
const mongoose = require('mongoose');

const LagerplatsSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["Sågat", "Kantat", "Okantat"] },
  tree: { type: String, required: true }, // e.g., "f", "gr"
  dim: { type: Number, required: true }, // Thickness
  location: { type: String, required: true }, // Location

  // Specifikt för Sågat virke
  sawData: {
    tum: { type: Number, required: function () { return this.type === "Sågat"; } }, // Inches
    typ: { type: String, required: function () { return this.type === "Sågat"; } }, // Side/X
    nt: { type: String, required: function () { return this.type === "Sågat"; } }, // Nertork, additional info
  },

  // Specifik för Kantat virke
  kantatData: {
    bredd: { type: String, required: function () { return this.type === "Kantat"; } }, // Bredd },
    varv: { type: String, required: function () { return this.type === "Kantat"; } },
    max_langd: { type: String, required: function () { return this.type === "Kantat"; } },
    kvalite: { type: String, required: function () { return this.type === "Kantat"; } },
  },

  okantatData: {
    varv: { type: String, required: function () { return this.type === "Okantat"; } },
    kvalite: { type: String, required: function () { return this.type === "Okantat"; } },
    typ: { type: String, required: function () { return this.type === "Okantat"; } }, // Side/X
    nt: { type: String, required: function () { return this.type === "Okantat"; } },
  },
});

module.exports = mongoose.model('Lagerplats', LagerplatsSchema);
