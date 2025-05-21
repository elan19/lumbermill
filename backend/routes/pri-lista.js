const express = require('express');
const router = express.Router();
const PriLista = require('../models/Prilista');
const KantLista = require('../models/Kantlista');
const Order = require('../models/Order'); // Import the Order model
const Log = require('../models/Log'); // Import the Order model

const authenticateToken = require('./authMiddleware');
const checkPermission = require('../middleware/authorizationMiddleware');

router.post('/create', authenticateToken, checkPermission('prilista', 'create'), async (req, res) => {
  // Destructure klupplager from the body
  const { orderNumber, customer, quantity, size, type, dimension, location, description, measureLocation, pktNr, isLager, active } = req.body;

  if (!isLager && (!orderNumber || !customer )) {
      return res.status(400).json({ message: 'Ordernummer och kund är obligatoriska för vanliga ordrar.' });
    }

  try {
    // Find the highest position in the collection
    const latestPrilista = await PriLista.findOne().sort({ position: -1 });
    const newPosition = (latestPrilista && typeof latestPrilista.position === 'number') ? latestPrilista.position + 1 : 1;

    // Create the new PriLista instance
    const newPriLista = new PriLista({
      orderNumber: isLager ? null : orderNumber,
      customer: isLager ? 'Lager' : customer,
      quantity,
      size,
      type,
      dimension,
      location,
      description,
      measureLocation,
      position: newPosition,
      pktNr,
      active,
    });

    // Save the new document to the database
    const savedPriLista = await newPriLista.save();

    res.status(201).json({
      message: 'New PriLista object created successfully!',
      prilistaId: savedPriLista._id // Send back ID if useful for frontend
     });

  } catch (error) {
    console.error("Error saving PriLista to DB:", error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
});

// Delete a lagerplats entry
router.delete('/:id', authenticateToken, checkPermission('prilista', 'delete'), async (req, res) => {
  const { id } = req.params;

  try {
    const deletedItem = await PriLista.findByIdAndDelete(id); // Use findByIdAndDelete
    if (!deletedItem) {
      return res.status(404).json({ message: 'Prilista item not found.' });
    }
    // Optionally, you can emit a socket event here if other clients need to know about the deletion
    // req.io.emit('prilistaItemDeleted', { id }); // Assuming io is attached to req
    res.status(200).json({ message: 'Prilista item deleted successfully.' }); // Send 200 OK or 204 No Content
  } catch (err) {
    console.error("Error deleting Prilista item:", err);
    res.status(500).json({ error: 'Failed to delete Prilista item.' });
  }
});



// Route to get all PriLista documents for a specific orderNumber
router.get('/order/:orderNumber', authenticateToken, checkPermission('prilista', 'read'), async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const prilistas = await PriLista.find({ orderNumber });
    res.status(200).json(prilistas);
  } catch (error) {
    console.error("Error fetching from DB:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route to get all PriLista documents (existing route, could be removed or adjusted)
router.get('/', authenticateToken, checkPermission('prilista', 'read'), async (req, res) => {
  try {
    const prilistas = await PriLista.find();
    res.status(200).json(prilistas);
  } catch (error) {
    console.error("Error fetching from DB:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/active', authenticateToken, checkPermission('prilista', 'addFromOrder'), async (req, res) => {
  try {
    let query = {}; // Start with an empty query object

    // Check for an 'active' query parameter to filter
    // e.g., GET /api/prilista?active=true  or GET /api/prilista (to get all if no filter)
    // For your specific request to *only* get active ones, we'll hardcode it for this route
    // but a more flexible approach is shown below.

    // --- OPTION 1: This route *always* returns only active items ---
    query.active = true;
    // You could also add other default filters here, e.g., !completed
    // query.completed = { $ne: true };

    // --- OPTION 2: Flexible filtering via query parameters (more common) ---
    /*
    if (req.query.active === 'true') {
      query.active = true;
    } else if (req.query.active === 'false') { // If you ever need to get inactive ones
      query.active = false;
    }
    // If req.query.active is not provided, query.active remains undefined,
    // and find(query) would fetch all items (both active and inactive).

    // Example for completed status
    if (req.query.completed === 'true') {
        query.completed = true;
    } else if (req.query.completed === 'false') {
        query.completed = { $ne: true }; // or query.completed = false;
    }
    */

    // Add sorting, e.g., by position or creation date
    const prilistas = await PriLista.find(query).sort({ position: 1 }); // Example: sort by position

    res.status(200).json(prilistas);
  } catch (error) {
    console.error("Error fetching PriLista items from DB:", error);
    res.status(500).json({ message: 'Internal Server Error while fetching PriLista items' });
  }
});

// Route to mark a prilista as completed
router.put('/complete/:id', authenticateToken, checkPermission('prilista', 'markComplete'), async (req, res) => {
  try {
    const io = req.app.get('io');
    const { id } = req.params;

    // Mark the specified PriLista item as completed
    const item = await PriLista.findByIdAndUpdate(id, { completed: true }, { new: true });

    if (!item) {
      return res.status(404).send({ message: 'Item not found' });
    }

    // Check if all PriLista items for the same orderNumber are completed
    const priListaItems = await PriLista.find({ orderNumber: item.orderNumber });
    const allPriListaDone = priListaItems.every((prilistaItem) => prilistaItem.completed);

    // Check if there are any KantLista items for the same orderNumber
    const kantListaItems = await KantLista.find({ orderNumber: item.orderNumber });

    let allKantListaDone = true;
    if (kantListaItems.length > 0) {
      // If there are KantLista items, ensure all are marked as completed
      allKantListaDone = kantListaItems.every((kantListaItem) => kantListaItem.status.kapad && kantListaItem.status.klar);
    }

    // Update the order status to "Completed" only if both conditions are met
    if (allPriListaDone && allKantListaDone) {
      await Order.findOneAndUpdate(
        { orderNumber: item.orderNumber },
        { $set: { status: 'Completed' } }
      );
    }

    // Emit the 'itemCompleted' event to notify all connected clients
    io.emit('itemCompleted', { id, completed: true });

    res.status(200).json(item);
  } catch (err) {
    console.error('Error updating PriLista item (complete):', err);
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.put('/reorder', authenticateToken, checkPermission('prilista', 'reorder'), async (req, res) => {
  const io = req.app.get('io');
  const { updatedOrders } = req.body;

  const bulkOperations = updatedOrders.map(order => ({
    updateOne: {
      filter: { _id: order._id },
      update: { $set: { position: order.position } },
    },
  }));

  try {
    await PriLista.bulkWrite(bulkOperations);

    
    // Emit the 'itemCompleted' event to notify all connected clients
    io.emit('orderUpdated', { updatedOrders });

    res.status(200).json({ message: 'Orders reordered successfully' });
  } catch (error) {
    console.error('Error updating orders:', error);
    res.status(500).json({ error: 'Failed to update orders' });
  }
});

router.put('/reorder/up', authenticateToken, checkPermission('prilista', 'reorder'), async (req, res) => {
  const io = req.app.get('io');
  const { updates } = req.body; // Match the payload from the frontend

  // Map updates to bulk operations for MongoDB
  const bulkOperations = updates.map(update => ({
    updateOne: {
      filter: { _id: update.id }, // Match by `id` as sent from the frontend
      update: { $set: { position: update.position } }, // Update the position
    },
  }));

  try {
    // Perform bulk updates in the database
    await PriLista.bulkWrite(bulkOperations);

    // Emit the 'orderUpdated' event with the updated order details
    io.emit('orderUpdated', updates);

    res.status(200).json({ message: 'Orders reordered successfully' });
  } catch (error) {
    console.error('Error updating orders:', error);
    res.status(500).json({ error: 'Failed to update orders' });
  }
});


// Route to update a prilista item by its ID
router.put('/edit/:id', authenticateToken, checkPermission('prilista', 'update'), async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    // Find the existing PriLista item by ID
    const existingPriLista = await PriLista.findById(id);
    if (!existingPriLista) {
      return res.status(404).json({ message: 'PriLista item not found' });
    }

    // Update the PriLista item
    const updatedItem = await PriLista.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure data validation is applied
    });

    if (!updatedItem) {
      return res.status(404).json({ message: 'Failed to update PriLista item' });
    }
    // Find the associated Order using the PriLista's orderNumber
    const order = await Order.findOne({ orderNumber: existingPriLista.orderNumber });

    if (!order) {
      console.log('Associated Order not found. Proceeding with PriLista update only.');
      return res.status(200).json(updatedItem);
    }
    // Check if the status was reverted to incomplete
    if (updatedData.completed === 'false' && existingPriLista.completed === true) {
      console.log('Status reverted: Order should be marked as "In Progress".');

      if (order.status !== 'In Progress') {
        // Update the Order status to "In Progress"
        order.status = 'In Progress';
        await order.save();
        console.log(`Order ${order.orderNumber} status updated to "In Progress".`);
      }
    }

    // Check if all PriLista items for the Order are complete
    if (updatedData.completed === true) {
      const allPriListorComplete = await PriLista.find({
        orderNumber: order.orderNumber,
        completed: false, // Check for incomplete PriLista items
      });

      // Only proceed to check Kantlista items if all PriLista items are complete
      if (allPriListorComplete.length === 0) {
        const allKantlistorComplete = await KantLista.find({
          orderNumber: order.orderNumber,
          $or: [
            { 'status.klar': false },
            { 'status.kapad': false },
          ],
        });

        // If no incomplete Kantlista items exist, mark the Order as "Completed"
        if (allKantlistorComplete.length === 0 && order.status !== 'Completed') {
          order.status = 'Completed';
          await order.save();
          console.log(`Order ${order.orderNumber} status updated to "Completed".`);
        }
      }
    }

    res.status(200).json(updatedItem);
  } catch (err) {
    console.error('Error updating PriLista item:', err);
    res.status(500).json({ message: 'Failed to update PriLista item', error: err.message });
  }
});

router.put('/update-lagerplats', authenticateToken, checkPermission('lagerplats', 'update'), async (req, res) => {
  const io = req.app.get('io');

  try {
    const { prilistaId, location } = req.body;

    // Update the order's Lagerplats in the database
    await PriLista.findByIdAndUpdate(prilistaId, { location });

    // Emit the 'orderUpdated' event to notify all connected clients
    if (io) {
      io.emit('orderUpdated', { prilistaId, location });
    }

    res.status(200).send({ message: 'Lagerplats updated successfully' });
  } catch (error) {
    console.error('Error updating Lagerplats:', error);
    res.status(500).send({ error: 'Failed to update Lagerplats' });
  }
});


// In your prilista routes
router.put('/:itemId/activate', authenticateToken, checkPermission('prilista', 'addFromOrder'), async (req, res) => {
    try {
        const updatedItem = await PriLista.findByIdAndUpdate(
            req.params.itemId,
            { $set: { active: true }},
            { new: true } // Returns the updated document
        );
        if (!updatedItem) {
            return res.status(404).json({ message: 'Artikeln hittades inte.' });
        }
        res.json(updatedItem);
    } catch (error) {
        // ... error handling ...
    }
});












module.exports = router;
