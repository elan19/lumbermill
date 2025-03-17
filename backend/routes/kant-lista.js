const express = require('express');
const router = express.Router();
const Kantlista = require('../models/Kantlista');
const Prilista = require('../models/Prilista');
const Order = require('../models/Order');

// Create a new Kantlista
router.post('/create', async (req, res) => {
  try {
    const newOrder = new Kantlista(req.body);
    console.log(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Misslyckades att skapa en ny kantlista', details: error.message });
  }
});

// Create a new Kantlista
router.post('/create', async (req, res) => {
  const {
    orderNumber,
    customer,
    antal,
    bredd,
    tjocklek,
    varv,
    max_langd,
    stampel,
    lagerplats,
    information,
    status,
    position,
    active,
    isLager, // Assuming you pass this from the frontend to indicate if it's a "Lager" entry
  } = req.body;

  try {
    // Validate required fields for non-"Lager" entries
    if (!isLager && (!orderNumber || !customer || !antal)) {
      return res.status(400).json({ message: 'Order number and customer are required for non-Lager entries.' });
    }

    // Create the new Kantlista
    const newKantlista = new Kantlista({
      orderNumber: isLager ? null : orderNumber, // Set orderNumber to null for "Lager"
      customer: isLager ? 'Lager' : customer, // Set customer to "Lager" for "Lager"
      antal: isLager ? null : antal,
      bredd,
      tjocklek,
      varv,
      max_langd,
      stampel,
      lagerplats,
      information,
      status: status || { kapad: false, klar: false }, // Default status if not provided
      position: position || 0, // Default position if not provided
      active: active || false, // Default active status if not provided
    });

    // Save the new Kantlista to the database
    const savedKantlista = await newKantlista.save();

    // Respond with the saved Kantlista
    res.status(201).json(savedKantlista);
  } catch (err) {
    console.error('Error creating Kantlista:', err);
    res.status(500).json({ message: 'Failed to create Kantlista. Please try again.' });
  }
});

// Fetch all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Kantlista.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Misslyckades att hämta kantlistor', details: error.message });
  }
});

// Delete a kantlista entry
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Kantlista.findByIdAndDelete(id);
    console.log("testing to delete");
    console.log(id);
    res.json({ message: 'Storage location deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete storage location.' });
  }
});

// Update a specific order
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedOrder = await Kantlista.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Misslyckades att uppdatera kantlistan', details: error.message });
  }
});


// Delete a specific order
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedOrder = await Kantlista.findByIdAndDelete(id);
    res.status(200).json({ message: 'Kantlista borttagning lyckades', deletedOrder });
  } catch (error) {
    res.status(500).json({ error: 'Misslyckades att ta bort kant-list', details: error.message });
  }
});


// Route to get all Kantlistor documents for a specific orderNumber
router.get('/order/:orderNumber', async (req, res) => {
  const { orderNumber } = req.params;
  
  try {
    const kantlista = await Kantlista.find({ orderNumber });
    res.status(200).json(kantlista);
  } catch (error) {
    console.error("Error fetching from DB:", error);
    res.status(500).json({ message: 'Internal Server Error' });
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


router.put('/reorder', async (req, res) => {
  const io = req.app.get('io');
  const { updatedOrders } = req.body;

  console.log(updatedOrders);

  const bulkOperations = updatedOrders.map(order => ({
    updateOne: {
      filter: { _id: order._id },
      update: { $set: { position: order.position } },
    },
  }));

  try {
    await Kantlista.bulkWrite(bulkOperations);

    
    // Emit the 'itemCompleted' event to notify all connected clients
    io.emit('kantListUpdate', { updatedOrders });

    res.status(200).json({ message: 'Orders reordered successfully' });
  } catch (error) {
    console.error('Error updating orders:', error);
    res.status(500).json({ error: 'Failed to update orders' });
  }
});

// Route to mark a kantlista as Kapad
router.put('/cut/:id', async (req, res) => {
  const io = req.app.get('io');
  try {
    const { id } = req.params;
    const { kantlistId, status } = req.body;

    console.log(status);
    console.log("test");

    // Update the `status.kapad` field to true for the specified item
    const item = await Kantlista.findByIdAndUpdate(
      id,
      { $set: { "status.kapad": true } },
      { new: true } // Return the updated document
    );

    if (!item) {
      return res.status(404).send({ message: 'Item not found' });
    }

    // Check if all `KantLista` items for the same `orderNumber` have `status.kapad` as true
    const allItems = await Kantlista.find({ orderNumber: item.orderNumber });
    const allKapad = allItems.every(kantListaItem => kantListaItem.status.kapad && kantListaItem.status.klar);

    if (allKapad) {
      // Update the order status to "Completed"
      await Order.findOneAndUpdate(
        { orderNumber: item.orderNumber },
        { $set: { status: 'Completed' } }
      );
    }

    if (io) {
      io.emit('kantListUpdate', { kantlistId, status });
    }

    res.status(200).json(item);
  } catch (err) {
    console.error('Error updating KantLista item:', err);
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.put('/completed/:id', async (req, res) => {
  const io = req.app.get('io');
  try {
    const { id } = req.params;
    const { kantlistId, status } = req.body;

    console.log(status);
    console.log("testCompleted");

    // Update the `status.klar` field to true for the specified item
    const item = await Kantlista.findByIdAndUpdate(
      id,
      { $set: { "status.klar": true } },
      { new: true } // Return the updated document
    );

    if (!item) {
      return res.status(404).send({ message: 'Item not found' });
    }

    // Check if all `KantLista` items for the same `orderNumber` have `status.klar` as true
    const kantListaItems = await Kantlista.find({ orderNumber: item.orderNumber });
    const allKantListaDone = kantListaItems.every(kantListaItem => kantListaItem.status.klar && kantListaItem.status.kapad);

    // Check if all `PriLista` items for the same `orderNumber` are completed
    const priListaItems = await Prilista.find({ orderNumber: item.orderNumber });
    
    let allPriListaDone = true;
    if (priListaItems.length > 0) {
      // If there are KantLista items, ensure all are marked as completed
      allPriListaDone = priListaItems.every((priListaItems) => priListaItems.completed);
    }

    // If all items in both `KantLista` and `PriLista` are done, update the order status
    if (allKantListaDone && allPriListaDone) {
      await Order.findOneAndUpdate(
        { orderNumber: item.orderNumber },
        { $set: { status: 'Completed' } }
      );
    }

    if (io) {
      io.emit('kantListUpdate', { kantlistId, status });
    }

    res.status(200).json(item);
  } catch (err) {
    console.error('Error updating KantLista item (klar):', err);
    res.status(500).send({ message: 'Internal server error' });
  }
});


router.put('/update-lagerplats', async (req, res) => {
  const io = req.app.get('io');
  try {
    const { kantlistId, lagerplats } = req.body;

    // Update the order's Lagerplats in the database
    await Kantlista.findByIdAndUpdate(kantlistId, { lagerplats });

    if (io) {
      io.emit('kantListUpdate', { kantlistId, lagerplats });
    }

    res.status(200).send({ message: 'Lagerplats updated successfully' });
  } catch (error) {
    console.error('Error updating Lagerplats:', error);
    res.status(500).send({ error: 'Failed to update Lagerplats' });
  }
});


router.put('/toggle-active/:id', async (req, res) => {
  const io = req.app.get('io');
  try {
    const { id } = req.params;
    const kantlista = await Kantlista.findById(id);
    if (!kantlista) {
      return res.status(404).send('Kantlista not found');
    }
    kantlista.active = !kantlista.active;  // Toggle the active field

    await kantlista.save();


    if (io) {
      io.emit('activeKantList', { kantlista });
    }

    res.status(200).json(kantlista);
  } catch (error) {
    console.error('Error updating active field:', error);
    res.status(500).send('Internal Server Error');
  }
});





module.exports = router;
