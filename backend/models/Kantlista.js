const mongoose = require('mongoose');

const kantListaSchema = new mongoose.Schema({
  orderNumber: { type: Number},
  customer: { type: String },
  antal: { type: Number },
  bredd: { type: String, required: true },
  tjocklek: { type: String, required: true },
  varv: { type: String, required: true },
  max_langd: { type: String, required: true },
  typ: { type: String, required: true }, //Furu eller Gran
  stampel: { type: String },
  lagerplats: { type: String },
  information: { type: String },
  datum_skapad: { type: Date, default: Date.now },
  status: {             // Checkboxes for Kapad, Klar
    kapad: { type: Boolean, default: false },
    klar: { type: Boolean, default: false }
  }, // New field for completion status
  position: { type: Number},
  active: { type: Boolean, default: false },
  pktNr: { type: String }
});

module.exports = mongoose.model('Kantlista', kantListaSchema);