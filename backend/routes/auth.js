const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Generate Refresh Token
const generateRefreshToken = (id, role) => {
  console.log("refreshtokenadded");
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: '6d' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET); // Use your secret key
  } catch (error) {
    return null; // If token verification fails, return null
  }
};

router.get('/', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(401).json({ message: 'Token required' });
  }

  // Verify the token
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await User.findById(decoded.id); // Find the user by decoded ID from the token
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Respond with the user data (excluding password)
    const { password, ...userData } = user.toObject();
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ name });

    if (!user) return res.status(404).json({ message: 'Fel användarnamn eller lösenord!' });

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = generateToken(user._id, user.role); // Generate access token
      const refreshToken = generateRefreshToken(user._id, user.role); // Generate refresh token

      // Store the refresh token in the user's document in the database
      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        token,
        //refreshToken, // Optionally send it back to the frontend
        user: { id: user._id, name: user.name, role: user.role },
      });
    } else {
      res.status(401).json({ message: 'Fel användarnamn eller lösenord!' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// --- GET User Settings ---
// Apply authentication middleware FIRST
router.get('/settings', authMiddleware, async (req, res) => {
  try {
      // req.user should be populated by your authMiddleware, containing at least the user's ID
      if (!req.user || !req.user._id) {
           // This case means the auth middleware didn't attach the user correctly
           console.error("Authentication middleware failed to attach user ID to request.");
           return res.status(401).json({ message: 'Authentication failed or user ID missing.' });
      }

      // Find the user by the ID from the token payload
      // Select only the 'settings' field for efficiency
      const user = await User.findById(req.user._id).select('settings');

      if (!user) {
          // This should theoretically not happen if authMiddleware is correct,
          // but it's a safety check.
          return res.status(404).json({ message: 'User not found.' });
      }

      // Determine the design setting, providing a default if it doesn't exist
      const designSetting = user.settings?.design || 'new'; // Use optional chaining and default

      // Send back the specific setting(s) needed
      res.json({ design: designSetting });

  } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ message: 'Server error while fetching settings.' });
  }
});


// --- PUT/PATCH User Settings ---
// (You'll need this counterpart to save settings)
router.put('/settings', authMiddleware, async (req, res) => {
  try {
      if (!req.user || !req.user._id) {
           console.error("Authentication middleware failed to attach user ID to request.");
           return res.status(401).json({ message: 'Authentication failed or user ID missing.' });
      }

      const { design } = req.body; // Get the desired design from the request body

      // Validate the input
      if (!design || !['old', 'new'].includes(design)) {
          return res.status(400).json({ message: 'Invalid design value provided. Must be "old" or "new".' });
      }

      // Find the user
      const user = await User.findById(req.user._id);

      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      // Ensure settings object exists if it doesn't (optional, good practice)
      if (!user.settings) {
          user.settings = {};
      }

      // Update the setting
      user.settings.design = design;

      // Mark the settings field as modified if it's nested (important!)
      user.markModified('settings');

      // Save the updated user document
      await user.save();

      // Return the updated setting
      res.json({ design: user.settings.design });

  } catch (error) {
      console.error('Error updating user settings:', error);
       // Handle potential validation errors from Mongoose save if any
       if (error.name === 'ValidationError') {
          return res.status(400).json({ message: 'Validation failed', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error while updating settings.' });
  }
});




// Issue New Access Token with Refresh Token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const user = await User.findOne({ refreshToken });

    if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

    // Generate new JWT token
    const newToken = generateToken(user._id, user.role);
    res.json({ token: newToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;
