const express = require('express');
const Lagerplats = require('../models/Lagerplats');
const router = express.Router();

// Get all lagerplats entries
router.get('/', async (req, res) => {
  try {
    const lagerplatser = await Lagerplats.find();
    res.json(lagerplatser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch storage locations.' });
  }
});

// Add a new lagerplats entry
router.post("/", async (req, res) => {
  const { type, tree, dim, location, sawData, kantatData, okantatData } = req.body;

  try {
    let newLagerplats;

    if (type === "Sågat") {
      if (!sawData || !sawData.tum || !sawData.typ) {
        return res.status(400).json({ error: "Missing required Sågat fields" });
      }

      newLagerplats = new Lagerplats({
        type,
        tree,
        dim,
        location,
        sawData: {
          tum: sawData.tum,
          typ: sawData.typ,
          nt: sawData.nt,
        },
      });
    } else if (type === "Kantat") {
      if (!kantatData || !kantatData.bredd || !kantatData.varv || !kantatData.max_langd || !kantatData.kvalite) {
        return res.status(400).json({ error: "Missing required Kantat fields" });
      }

      newLagerplats = new Lagerplats({
        type,
        tree,
        dim,
        location,
        kantatData: {
          bredd: kantatData.bredd,
          varv: kantatData.varv,
          max_langd: kantatData.max_langd,
          kvalite: kantatData.kvalite,
        },
      });
    } else if (type === "Okantat") {
      if (!okantatData || !okantatData.varv || !okantatData.kvalite || !okantatData.typ || !okantatData.nt) {
        return res.status(400).json({ error: "Missing required Kantat fields" });
      }
      // Default handling for "Okantat" or unknown types
      newLagerplats = new Lagerplats({
        type,
        tree,
        dim,
        location,
        okantatData: {
          varv: okantatData.varv,
          kvalite: okantatData.kvalite,
          typ: okantatData?.typ,
          nt: okantatData?.nt,
        }
      });
    }

    const savedLagerplats = await newLagerplats.save();
    console.log(savedLagerplats);
    res.status(201).json(savedLagerplats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create storage location." });
  }
});

// Update a lagerplats entry
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // This contains only the updated field

  try {
    const updatedLagerplats = await Lagerplats.findByIdAndUpdate(
      id,
      { $set: updateData }, // Dynamically update only the sent field
      { new: true, runValidators: true } // Ensure updated document is returned
    );

    if (!updatedLagerplats) {
      return res.status(404).json({ error: 'Storage location not found.' });
    }

    res.json(updatedLagerplats);
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ error: 'Failed to update storage location.' });
  }
});


// Delete a lagerplats entry
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Lagerplats.findByIdAndDelete(id);
    res.json({ message: 'Storage location deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete storage location.' });
  }
});

router.get('/filter', async (req, res) => {
  try {
    const { dim, tum } = req.query;
    const filter = { dim };
    if (tum) filter.tum = tum;

    const lagerplatser = await Lagerplats.find(filter);
    res.json(lagerplatser);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching Lagerplatser.' });
  }
});

module.exports = router;
