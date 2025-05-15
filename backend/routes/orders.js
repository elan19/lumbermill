const express = require('express');
const Order = require('../models/Order');
const PriLista = require('../models/Prilista');
const KantLista = require('../models/Kantlista');
const KluppLista = require('../models/Klupplista');
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

    const klupplista = await KluppLista.find({ orderNumber: order.orderNumber });

    res.json({ ...order.toObject(), kantlista, klupplista });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
});


// Add a new order
router.post('/create', async (req, res) => {
  // Destructure all expected fields, including klupplager from the list items
  const { orderNumber, customer, delivery, notes, speditor, prilistas, kantlistas, klupplistas } = req.body;

  console.log(req.body); // Log the request body for debugging

  // Basic validation
  if (!orderNumber || !customer) {
    return res.status(400).json({ message: 'Ordernummer och kund är obligatoriska.' });
  }

  try {
    // --- Create Prilista items with klupplager logic ---
    const createdPrilistas = prilistas && prilistas.length > 0
      ? await Promise.all(
          prilistas.map(async (prilistaData) => {
            const latestPrilista = await PriLista.findOne().sort({ position: -1 });
            const newPosition = (latestPrilista && typeof latestPrilista.position === 'number') ? latestPrilista.position + 1 : 1;

            // Determine completion status based on klupplager
            // Create the new PriLista instance
            const newPriLista = new PriLista({
              ...prilistaData, // Spread the rest of the data (quantity, size, etc.)
              orderNumber,
              customer,      // Set completed status based on the flag
              position: newPosition,
            });

            await newPriLista.save();
            return newPriLista._id; // Return the ID to link to the Order
          })
        )
      : []; // Empty array if no PriLista provided

    // --- Create Kantlista items with klupplager logic ---
    const createdKantlistas = kantlistas && kantlistas.length > 0
      ? await Promise.all(
          kantlistas.map(async (kantlistaData) => {
            const latestKantlista = await KantLista.findOne().sort({ position: -1 });
            const newPosition = (latestKantlista && typeof latestKantlista.position === 'number') ? latestKantlista.position + 1 : 1;

            // Create the new KantLista instance
            const newKantLista = new KantLista({
              ...kantlistaData, // Spread the rest of the data (antal, bredd, etc.)
              orderNumber,
              customer,         // Set status based on the flag/default
              position: newPosition,
            });

            await newKantLista.save();
            return newKantLista._id; // Return the ID to link to the Order
          })
        )
      : []; // Empty array if no KantLista provided

    
    const createdKlupplistas = klupplistas && klupplistas.length > 0
      ? await Promise.all(
          klupplistas.map(async (klupplistaData) => {
            const latestKlupplista = await KluppLista.findOne().sort({ position: -1 });
            const newPosition = (latestKlupplista && typeof latestKlupplista.position === 'number') ? latestKlupplista.position + 1 : 1;
            // Create the new Klupplista instance
            // Add orderNumber and kund for context, even if not strictly required by klupp schema
            let finalStatus = { klar: false, ej_Klar: null };
            if (klupplistaData.status) { // If status object is provided from frontend
                finalStatus.klar = klupplistaData.status.klar === true; // Ensure boolean

                // Ensure ej_Klar is valid or null
                if (klupplistaData.status.ej_Klar && [1, 2, 3].includes(parseInt(klupplistaData.status.ej_Klar, 10))) {
                    finalStatus.ej_Klar = parseInt(klupplistaData.status.ej_Klar, 10);
                } else {
                    finalStatus.ej_Klar = null; // Default to null if invalid or not provided
                }

                // If 'klar' is true, 'ej_Klar' must be null
                if (finalStatus.klar) {
                    finalStatus.ej_Klar = null;
                }
            }
            const newKlupp = new KluppLista({
              ...klupplistaData, // Spread the data from the request (dimension, max_langd, etc.)
              orderNumber: orderNumber, // Associate with the order
              kund: customer,
              position: newPosition,
              // status: kluppData.status || { klar: false, ej_Klar: false } // Default status if needed
            });
            await newKlupp.save();
            return newKlupp._id; // Return the ID to link to the Order
          })
        ) : [];
    // --- Create the Order document ---
    const order = await Order.create({
      orderNumber,
      customer,
      delivery,
      notes,
      speditor,
      prilista: createdPrilistas,   // Link the IDs of the created Prilista items
      kantlista: createdKantlistas,
      klupplista: createdKlupplistas, // Link the IDs of the created Kantlista items
      // updatedBy: req.user ? req.user.id : null // Uncomment if using auth middleware
    });

    res.status(201).json({ message: 'Order created successfully!', order });
  } catch (error) {
    console.error('Error during order creation:', error);
    // Handle potential duplicate order number error specifically
    if (error.code === 11000 && error.keyPattern && error.keyPattern.orderNumber) {
         return res.status(409).json({ message: `Ordernummer ${orderNumber} finns redan.` });
     }
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});



router.put('/:orderNumber/complete', async (req, res) => {
  const { orderNumber } = req.params;

  try {
    // Find the order by orderNumber and populate both prilista and kantlista details
    const order = await Order.findOne({ orderNumber })
      .populate('prilista')
      .populate('kantlista')
      .populate('klupplista'); // Ensure kantlista is included in the schema and correctly populated

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

  // Validate if orderNumber is provided and perhaps is a number
  if (!orderNumber) {
    return res.status(400).json({ message: 'Order number is required.' });
  }
  const orderNumAsInt = parseInt(orderNumber, 10);
  if (isNaN(orderNumAsInt)) {
      return res.status(400).json({ message: 'Invalid order number format.' });
  }

  try {
    // 1. Update the Order status to 'Delivered'
    const updatedOrder = await Order.findOneAndUpdate(
      { orderNumber: orderNumAsInt },
      { status: 'Delivered' },
      { new: true } // Return the updated order document
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: `Order ${orderNumAsInt} not found.` });
    }

    // 2. If the order was successfully marked as delivered,
    //    update all associated Klupplista items' status.klar to true.
    if (updatedOrder.status === 'Delivered') {
      const updateResult = await KluppLista.updateMany(
        { orderNumber: updatedOrder.orderNumber }, // Find Klupplistor matching the orderNumber
        { $set: { 'delivered': true} } // Set 'klar' to true and clear 'ej_Klar' reason
      );
      console.log(`Updated ${updateResult.modifiedCount} KluppLista items to klar:true for delivered order ${updatedOrder.orderNumber}`);
    }

    // Optionally, if you want to return the order with populated (and now updated) klupplistor:
    // const finalOrderWithPopulatedKlupplistor = await Order.findById(updatedOrder._id).populate('klupplista');
    // res.json(finalOrderWithPopulatedKlupplistor);
    // For now, just return the updatedOrder object.
    // The frontend would typically refetch details if it needs to see the updated klupplista statuses immediately.

    res.json(updatedOrder);

  } catch (err) {
    console.error(`Error marking order ${orderNumber} as delivered or updating klupplistor:`, err);
    res.status(500).json({ message: 'Server error', details: err.message });
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


router.delete('/:orderNumber', async (req, res) => {
  const { orderNumber } = req.params;

  // Validate if orderNumber is provided and perhaps is a number
  if (!orderNumber) {
    return res.status(400).json({ message: 'Order number is required.' });
  }
  const orderNum = parseInt(orderNumber, 10); // Ensure it's treated as a number for queries
  if (isNaN(orderNum)) {
      return res.status(400).json({ message: 'Invalid order number format.' });
  }


  try {
    // 1. Find the order to ensure it exists before deleting associated items
    const orderToDelete = await Order.findOne({ orderNumber: orderNum });

    if (!orderToDelete) {
      return res.status(404).json({ message: `Order with number ${orderNum} not found.` });
    }

    // 2. Delete all associated PriLista items
    const priDeleteResult = await PriLista.deleteMany({ orderNumber: orderNum });
    console.log(`Deleted ${priDeleteResult.deletedCount} PriLista items for order ${orderNum}`);

    // 3. Delete all associated KantLista items
    const kantDeleteResult = await KantLista.deleteMany({ orderNumber: orderNum });
    console.log(`Deleted ${kantDeleteResult.deletedCount} KantLista items for order ${orderNum}`);

    // 4. Delete all associated KluppLista items
    const kluppDeleteResult = await KluppLista.deleteMany({ orderNumber: orderNum });
    console.log(`Deleted ${kluppDeleteResult.deletedCount} KluppLista items for order ${orderNum}`);

    // 5. Delete the Order document itself
    await Order.deleteOne({ _id: orderToDelete._id }); // Delete by ID for certainty
    console.log(`Deleted Order ${orderNum}`);

    res.status(200).json({
      message: `Order ${orderNum} and all associated list items deleted successfully.`,
      deletedCounts: {
          prilista: priDeleteResult.deletedCount,
          kantlista: kantDeleteResult.deletedCount,
          klupplista: kluppDeleteResult.deletedCount,
          order: 1 // Since we deleted one order
      }
    });

  } catch (error) {
    console.error(`Error deleting order ${orderNumber} and associated items:`, error);
    res.status(500).json({ message: 'Failed to delete order and associated items', error: error.message });
  }
});


module.exports = router;
