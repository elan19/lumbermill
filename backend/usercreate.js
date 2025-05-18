require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust the path

// MongoDB Connection URI
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Function to create a user
const createUser = async (name, password, role) => {
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const user = new User({
      name,
      password: hashedPassword,
      role,
    });

    // Save to the database
    await user.save();
    console.log(`User ${name} created successfully.`);
  } catch (err) {
    console.error('Error creating user:', err);
  } finally {
    mongoose.connection.close(); // Close the connection
  }
};

// Example: Create a user
createUser('test', 'test', 'employee');