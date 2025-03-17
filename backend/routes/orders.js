const express = require('express');
const Order = require('../models/Order');
const PriLista = require('../models/Prilista');
const KantLista = require('../models/Kantlista');
const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('updatedBy', 'name') // Populate user details
      .populate('prilista')

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
});

router.get('/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params; // Extract orderNumber from the URL

    // Find the order by orderNumber and populate the necessary fields
    const order = await Order.findOne({ orderNumber })
      .populate('updatedBy', 'name') // Populate user details
      .populate('prilista')

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const kantlista = await KantLista.find({ orderNumber: order.orderNumber });

    res.json({ ...order.toObject(), kantlista });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
});


// Add a new order
router.post('/create', async (req, res) => {
  const { orderNumber, customer, delivery, notes, prilistas, kantlistas } = req.body;

  if (!orderNumber || !customer) {
    return res.status(400).json({ message: 'Title, orderNumber, and customer are required.' });
  }

  try {
    const createdPrilistas = prilistas && prilistas.length > 0
      ? await Promise.all(
          prilistas.map(async (prilistaData) => {
            const latestPrilista = await PriLista.findOne().sort({ position: -1 });
            const newPosition = (latestPrilista && latestPrilista.position) ? latestPrilista.position + 1 : 1;

            const newPriLista = new PriLista({
              ...prilistaData,
              orderNumber,
              customer,
              position: newPosition,
            });

            await newPriLista.save();
            return newPriLista._id;
          })
        )
      : []; // Empty array if no PriLista provided

    const createdKantlistas = kantlistas && kantlistas.length > 0
      ? await Promise.all(
          kantlistas.map(async (kantlistaData) => {
            const latestKantlista = await KantLista.findOne().sort({ position: -1 });
            const newPosition = (latestKantlista && latestKantlista.position) ? latestKantlista.position + 1 : 1;

            const newKantLista = new KantLista({
              ...kantlistaData,
              orderNumber,
              customer,
              position: newPosition,
            });

            await newKantLista.save();
            return newKantLista._id;
          })
        )
      : []; // Empty array if no KantLista provided

    const order = await Order.create({
      orderNumber,
      customer,
      delivery,
      notes,
      prilista: createdPrilistas,
      kantlista: createdKantlistas,
    });

    res.status(201).json({ message: 'Order created successfully!', order });
  } catch (error) {
    console.error('Error during order creation:', error);
    res.status(500).json({ message: 'Failed to create order', error });
  }
});



router.put('/:orderNumber/complete', async (req, res) => {
  const { orderNumber } = req.params;

  try {
    // Find the order by orderNumber and populate both prilista and kantlista details
    const order = await Order.findOne({ orderNumber })
      .populate('prilista')
      .populate('kantlista'); // Ensure kantlista is included in the schema and correctly populated

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if all prilista items associated with the order are completed
    const allPrilistaCompleted = order.prilista.every((item) => item.completed);

    // Check if all kantlista items associated with the order are completed (status.klar)
    const allKantlistaCompleted = order.kantlista.every((item) => item.status && item.status.klar);

    if (!allPrilistaCompleted || !allKantlistaCompleted) {
      return res.status(400).json({ 
        message: 'Not all prilista or kantlista items are completed yet.' 
      });
    }

    // Update the order status to "Avklarad"
    order.status = 'Avklarad';
    await order.save();

    res.json({ message: 'Order marked as completed successfully!', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});


router.put('/:orderNumber/delivered', async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { orderNumber },
      { status: 'Delivered' },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send('Order not found');
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Endpoint to add a new PRILISTA to an order
router.put('/:orderNumber/add-prilista', async (req, res) => {
  const { orderNumber } = req.params;
  const { prilistaId } = req.body;

  try {
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.prilista.push(prilistaId);
    await order.save();

    res.status(200).json({ message: 'PRILISTA added to order successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


// Update an order
router.put('/:orderNumber', async (req, res) => {
  const { orderNumber } = req.params;
  const updatedOrderData = req.body;

  try {
    // Find the order by orderNumber and update with the new data
    const updatedOrder = await Order.findOneAndUpdate(
      { orderNumber: orderNumber },
      updatedOrderData,
      {
        new: true, // Return the updated order
        runValidators: true, // Apply schema validation
      }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update each prilista item in the order
    if (updatedOrder.prilista && updatedOrder.prilista.length > 0) {
      const updatePromises = updatedOrder.prilista.map(async (prilistaId) => {
        return await PriLista.findByIdAndUpdate(prilistaId, { /* updated data */ }, {
          new: true,
          runValidators: true,
        });
      });

      await Promise.all(updatePromises);
    }

    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Failed to update order', error: err.message });
  }
});

module.exports = router;
