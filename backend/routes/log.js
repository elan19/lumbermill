const express = require('express');
const Log = require('../models/Log'); // Import the Log model

const router = express.Router();

// POST route for creating a log entry
router.post('/log', async (req, res) => {
  const { level, message, context, stack } = req.body;

  if (!level || !message) {
    return res.status(400).json({ message: 'Level and message are required fields.' });
  }

  try {
    const newLog = new Log({
      level,
      message,
      context: context || '',
      stack: stack || ''
    });

    // Save the new log entry to the database
    await newLog.save();

    // Return success response
    res.status(201).json({ message: 'Log entry created successfully', log: newLog });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ message: 'Error creating log entry', error });
  }
});

// GET route for fetching logs
router.get('/logs', async (req, res) => {
    try {
      const logs = await Log.find().sort({ timestamp: -1 }); // Get logs in reverse order (latest first)
      res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ message: 'Error fetching logs', error });
    }
  });

module.exports = router;
