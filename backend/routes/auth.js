const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('./authMiddleware');
const authenticateToken = require('./authMiddleware');
const router = express.Router();

// Generate JWT
const generateToken = (id, role) => {
  //return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return jwt.sign({ id: id, role: role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Generate Refresh Token
const generateRefreshToken = (id, role) => {
  console.log("refreshtokenadded");
  //return jwt.sign({ id, role }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: '6d' });
  return jwt.sign({ id: id, role: role }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: '6d' });
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
router.get('/settings', authenticateToken, async (req, res) => {
  try {
      // req.user should be populated by authenticateToken
      // UNCOMMENT the check, adjust property if needed (e.g., req.user.id if that's in your token payload)
      if (!req.user || !req.user.id) { // Check for req.user.id (based on generateToken)
           console.error("Authentication middleware failed to attach user ID to request in GET /settings.");
           return res.status(401).json({ message: 'Authentication failed or user ID missing.' });
      }

      // Use the ID from the middleware
      const user = await User.findById(req.user.id).select('settings'); // Use req.user.id

      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      const designSetting = user.settings?.design || 'new';
      res.json({ design: designSetting, orderDesign: user.settings?.orderDesign || 'new' });

  } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ message: 'Server error while fetching settings.' });
  }
});


// --- PUT/PATCH User Settings ---
// (You'll need this counterpart to save settings)
router.put('/settings', authenticateToken, async (req, res) => {
  try {
       if (!req.user || !req.user.id) {
           console.error("Auth middleware failed to attach user ID in PUT /settings.");
           return res.status(401).json({ message: 'Authentication failed or user ID missing.' });
       }

      // Destructure both settings from the body <-- MODIFIED
      const { design, orderDesign } = req.body;

      // Validate both inputs <-- MODIFIED
      if (design && !['old', 'new'].includes(design)) { // Allow partial updates - check if provided
          return res.status(400).json({ message: 'Invalid website design value provided.' });
      }
      if (orderDesign && !['old', 'new'].includes(orderDesign)) { // Allow partial updates - check if provided
           return res.status(400).json({ message: 'Invalid order design value provided.' });
       }

      const user = await User.findById(req.user.id);

      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      // Ensure settings object exists
      if (!user.settings) {
          user.settings = {};
      }

      // Update ONLY the fields that were sent <-- MODIFIED (allows partial updates)
      let changed = false;
      if (design && user.settings.design !== design) {
           user.settings.design = design;
           changed = true;
      }
      if (orderDesign && user.settings.orderDesign !== orderDesign) {
            user.settings.orderDesign = orderDesign;
            changed = true;
      }


      // Only save if something actually changed
      if (changed) {
            user.markModified('settings'); // Mark modified since it's nested
            await user.save();
      } else {
           console.log("No setting changes detected for user:", req.user.id);
      }


      // Return the current state of both settings <-- MODIFIED
      res.json({
          design: user.settings.design,
          orderDesign: user.settings.orderDesign
        });

  } catch (error) {
      console.error('Error updating user settings:', error);
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
