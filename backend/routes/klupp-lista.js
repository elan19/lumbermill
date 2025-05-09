const express = require('express');
const router = express.Router();
const Klupplista = require('../models/Klupplista');
const Order = require('../models/Order'); // Adjust path to your Klupplista model
// const authMiddleware = require('../middleware/authMiddleware'); // UNCOMMENT if authentication is needed

// --- CREATE a new Klupplista Entry ---
// Consider adding authMiddleware here: router.post('/create', authMiddleware, async (req, res) => {
router.post('/create', async (req, res) => {
  try {
    // Destructure all expected fields from the request body
    const {
      orderNumber,
      kund,
      sagverk,
      dimension, // Required by schema
      max_langd, // Required by schema
      pktNumber,
      sort,
      stad,
      special,
      magasin,
      lagerplats,
      leveransDatum,
      position,
      information,
      status // Receive status object if provided
    } = req.body;

    // --- Basic Validation ---
    // Check for fields required by the schema
    if (!dimension || !max_langd) {
      return res.status(400).json({ message: 'Dimension and Max Längd are required fields.' });
    }
    // Add any other specific business logic validation here if needed

    // Create a new Klupplista document instance
    const newKlupplista = new Klupplista({
      orderNumber,
      kund,
      sagverk,
      dimension,
      max_langd,
      pktNumber,
      sort,
      stad,
      special,
      magasin,
      lagerplats,
      leveransDatum,
      position: position,
      information,
      // Use provided status or default from schema if not provided
      status: status || { klar: false, ej_Klar: false }
      // Note: The schema handles the default values for klar/ej_Klar if status object itself is missing
    });

    // Save the new document to the database
    const savedKlupplista = await newKlupplista.save();

    // Send back a success response with the created document
    res.status(201).json({ message: 'Klupplista created successfully!', klupplista: savedKlupplista });

  } catch (error) {
    console.error('Error creating Klupplista:', error);
    // Handle potential Mongoose validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    // Generic server error
    res.status(500).json({ message: 'Failed to create Klupplista', error: error.message });
  }
});

router.put('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    // Find the existing Kantlista item by ID
    const existingKantlista = await Kantlista.findById(id);
    if (!existingKantlista) {
      return res.status(404).json({ message: 'Kantlista item not found' });
    }

    // Update the Kantlista item
    const updatedItem = await Kantlista.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure data validation is applied
    });

    if (!updatedItem) {
      return res.status(404).json({ message: 'Failed to update Kantlista item' });
    }

    // Find the associated Order using the Kantlista's orderNumber
    const order = await Order.findOne({ orderNumber: existingKantlista.orderNumber });

    if (!order) {
      console.log('Associated Order not found. Proceeding with Kantlista update only.');
      return res.status(200).json(updatedItem);
    }

    // Check if the status was reverted to incomplete
    if (
      (updatedData.status?.klar === false || updatedData.status?.kapad === false) &&
      existingKantlista.status.klar &&
      existingKantlista.status.kapad
    ) {
      console.log('Status reverted: Order should be marked as "In Progress".');

      if (order.status !== 'In Progress') {
        // Update the Order status to "In Progress"
        order.status = 'In Progress';
        await order.save();
        console.log(`Order ${order.orderNumber} status updated to "In Progress".`);
      }
    }

    // Check if all Kantlista items for the Order are complete
    if (updatedData.status?.klar === true && updatedData.status?.kapad === true) {
      const allKantlistorComplete = await Kantlista.find({
        orderNumber: order.orderNumber,
        $or: [
          { 'status.klar': false },
          { 'status.kapad': false },
        ],
      });

      // Only proceed to check PriLista items if all Kantlista items are complete
      if (allKantlistorComplete.length === 0) {
        const allPriListorComplete = await Prilista.find({
          orderNumber: order.orderNumber,
          completed: false, // Check for incomplete PriLista items
        });

        // If no incomplete PriLista items exist, mark the Order as "Completed"
        if (allPriListorComplete.length === 0 && order.status !== 'Completed') {
          order.status = 'Completed';
          await order.save();
          console.log(`Order ${order.orderNumber} status updated to "Completed".`);
        }
      }
    }

    res.status(200).json(updatedItem);
  } catch (err) {
    console.error('Error updating Kantlista item:', err);
    res.status(500).json({ message: 'Failed to update Kantlista item', error: err.message });
  }
});

// --- GET all Klupplistor ---
// Consider adding authMiddleware
router.get('/', async (req, res) => {
  try {
      // Add sort by position by default
      const klupplistor = await Klupplista.find().sort({ position: 1 }); // Sort by position ascending
      res.status(200).json(klupplistor);
  } catch(error) {
      console.error('Error fetching Klupplistor:', error);
      res.status(500).json({ message: 'Failed to fetch Klupplistor', error: error.message });
  }
});

// --- GET a specific Klupplista by ID ---
// Consider adding authMiddleware
router.get('/:id', async (req, res) => {
  try {
      const klupplista = await Klupplista.findById(req.params.id);
      if (!klupplista) {
          return res.status(404).json({ message: 'Klupplista not found' });
      }
      res.status(200).json(klupplista);
  } catch(error) {
      console.error('Error fetching Klupplista:', error);
       if (error.name === 'CastError') { return res.status(400).json({ message: 'Invalid ID format provided.' }); }
      res.status(500).json({ message: 'Failed to fetch Klupplista', error: error.message });
  }
});

// --- GET Klupplistor by orderNumber ---
// Consider adding authMiddleware
router.get('/order/:orderNumber', async (req, res) => {
  const { orderNumber } = req.params;
  try {
    // Add sort by position
    const klupplista = await Klupplista.find({ orderNumber }).sort({ position: 1 });
    res.status(200).json(klupplista);
  } catch (error) {
    console.error("Error fetching klupplista by order number:", error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.put('/reorder', async (req, res) => {
  // const io = req.app.get('io');
  const { updatedItems } = req.body; // Expect { updatedItems: [...] }

  if (!updatedItems || !Array.isArray(updatedItems)) {
     return res.status(400).json({ message: 'Invalid payload: Expected updatedItems array.' });
  }

  const bulkOperations = []; // Initialize array for operations

  try {
    // Prepare bulk operations inside try block
    updatedItems.forEach(item => { // Use forEach for safer error handling within loop
       if (!item._id || typeof item.position !== 'number' || item.position < 1) {
           // Throw error to be caught by outer catch
           throw new Error(`Invalid item format in updatedItems array: ${JSON.stringify(item)}`);
       }
       bulkOperations.push({
         updateOne: {
           filter: { _id: item._id },
           update: { $set: { position: item.position } },
         },
       });
    });

     // Execute updates only if there are valid operations
     if (bulkOperations.length > 0) {
         await Klupplista.bulkWrite(bulkOperations);
     } else {
         console.log("No valid items provided to reorder for Klupplista.");
     }

    // if (io) { io.emit('kluppListReordered', { updatedItems }); }
    res.status(200).json({ message: 'Klupplistor reordered successfully' });

  } catch (error) {
    console.error('Error reordering klupplistor:', error);
     if (error.message.includes("Invalid item format")) {
        return res.status(400).json({ message: error.message });
    }
     if (error.name === 'ValidationError') { // Handle potential bulkWrite validation errors
        return res.status(400).json({ message: 'Validation failed during reorder', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to reorder klupplistor', error: error.message });
  }
});

// Example: PUT a specific Klupplista by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body; // Contains all fields sent from frontend
  
    try {
      // Find and update the document in one step
      // { new: true } returns the modified document
      // { runValidators: true } applies schema validation on update
      const updatedKlupplista = await Klupplista.findByIdAndUpdate(
        id,
        updatedData,
        { new: true, runValidators: true }
      );
  
      if (!updatedKlupplista) {
        return res.status(404).json({ message: 'Klupplista item not found with that ID.' });
      }
  
      // Send back the updated document
      res.status(200).json(updatedKlupplista);
  
    } catch (error) {
      console.error('Error updating Klupplista item:', error);
      // Handle potential Mongoose validation errors
      if (error.name === 'ValidationError') {
          return res.status(400).json({ message: 'Validation failed', errors: error.errors });
      }
      // Handle CastError if ID format is wrong
       if (error.name === 'CastError') {
          return res.status(400).json({ message: 'Invalid ID format provided.' });
       }
      // Generic server error
      res.status(500).json({ message: 'Failed to update Klupplista item', error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedItem = await Klupplista.findByIdAndDelete(id);
        if (!deletedItem) {
            return res.status(404).json({ message: 'Klupplista item not found.' });
        }
        // Also remove the reference from the associated Order document
        await Order.findOneAndUpdate(
             { klupplista: id }, // Find order containing this klupplista ID
             { $pull: { klupplista: id } }, // Remove the ID from the array
             { new: true } // Optional: return updated order
        );

        res.status(200).json({ message: 'Klupplista item deleted successfully.' });
    } catch (err) {
        console.error('Error deleting Klupplista item:', err);
         if (err.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid ID format provided.' });
         }
        res.status(500).json({ message: 'Failed to delete Klupplista item.', error: err.message });
    }
});

router.get('/order/:orderNumber', async (req, res) => {
  const { orderNumber } = req.params;
  
  try {
    const klupplista = await Klupplista.find({ orderNumber });
    res.status(200).json(klupplista);
  } catch (error) {
    console.error("Error fetching from DB:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// --- Export the router ---
module.exports = router;