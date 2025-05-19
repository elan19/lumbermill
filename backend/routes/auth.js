const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const router = express.Router();

const authenticateToken = require('./authMiddleware');
const checkPermission = require('../middleware/authorizationMiddleware');

// Generate JWT
const generateToken = (id, role) => {
  //return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return jwt.sign({
    id: id, role: role }, process.env.JWT_SECRET, { expiresIn: '1h' 
  });
};

// Generate Refresh Token
const generateRefreshToken = (id, role) => {
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

router.get('/me', async (req, res) => { // Apply the authentication middleware
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication failed or user ID missing.' });
        }

        const user = await User.findById(req.user.id).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // --- Fetch the role from the database ---
        const roleDoc = await Role.findOne({ name: user.role });

        // --- If the role is not found ---
        if (!roleDoc) {
            console.error("Role not found for user:", user.role);
            return res.status(500).json({ message: "Server error: User role not found." });
        }

        const permissions = roleDoc.permissions; // <-- Get the permissions!

        res.json({
            ...user.toObject(), // Spread the user data
            permissions: permissions, // Include the permissions
        });
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).json({ message: 'Server error while fetching user information.' });
    }
});

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
// auth.js
// auth.js - Inside router.post('/login', ...) - Make sure you send the role
router.post('/login', async (req, res) => {
    const { name, password } = req.body;

    try {
        const user = await User.findOne({ name });

        if (!user) {
            return res.status(404).json({ message: 'Fel användarnamn eller lösenord!' });
        }

        // This line is correct and should remain:
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = generateToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id, user.role);

            user.refreshToken = refreshToken;
            await user.save();

            const userRoleDoc = await Role.findOne({ name: user.role }); // Corrected Logic
            // --- Fetch the roles and their permissions to include with the response ---
            if (!userRoleDoc) {
                console.error("Role not found for user:", user.role);
                return res.status(500).json({ message: "Server error: User role not found." });
            }

            // --- Send the permissions back for the roles ---
            const permissions = userRoleDoc.permissions;

            console.log(`Login success for ${user.name}, Role: ${user.role}, Permissions: ${permissions}`);
            res.json({
                token,
                user: { id: user._id, name: user.name, role: user.role, permissions: permissions },
            });
        } else {
            console.log("Password mismatch for user:", user.name);
            res.status(401).json({ message: 'Fel användarnamn eller lösenord!' });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(400).json({ message: error.message });
    }
});


// --- GET User Settings ---
// Apply authentication middleware FIRST
router.get('/settings', authenticateToken, checkPermission('settings', 'read'), async (req, res) => {
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
      res.json({ 
        design: designSetting, 
        orderDesign: user.settings?.orderDesign || 'new',
        fontSize: user.settings?.fontSize // Default font size
      });

  } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ message: 'Server error while fetching settings.' });
  }
});


// --- PUT/PATCH User Settings ---
// (You'll need this counterpart to save settings)
router.put('/settings', authenticateToken, checkPermission('settings', 'update'),async (req, res) => {
  try {
       if (!req.user || !req.user.id) {
           console.error("Auth middleware failed to attach user ID in PUT /settings.");
           return res.status(401).json({ message: 'Authentication failed or user ID missing.' });
       }

      // Destructure all expected settings from the body
      const { design, orderDesign, fontSize } = req.body;

      // --- Validation ---
      if (design && !['old', 'new'].includes(design)) {
          return res.status(400).json({ message: 'Invalid website design value provided.' });
      }
      if (orderDesign && !['old', 'new'].includes(orderDesign)) {
           return res.status(400).json({ message: 'Invalid order design value provided.' });
      }
      // Validate fontSize if provided
      if (fontSize !== undefined) { // Check if it was sent
          const parsedFontSize = parseInt(fontSize, 10);
          if (isNaN(parsedFontSize) || parsedFontSize < 8 || parsedFontSize > 32) { // Example range
               return res.status(400).json({ message: 'Invalid font size. Must be a number between 8 and 32.' });
          }
      }
      // --- End Validation ---


      const user = await User.findById(req.user.id);

      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      // Ensure settings object exists
      if (!user.settings) {
          user.settings = {
              design: 'new', // Default if settings object was missing
              orderDesign: 'new',
              fontSize: 16
          };
      }

      let changed = false;

      // Update website design if provided and different
      if (design && user.settings.design !== design) {
           user.settings.design = design;
           changed = true;
      }

      // Update order design if provided and different
      if (orderDesign && user.settings.orderDesign !== orderDesign) {
            user.settings.orderDesign = orderDesign;
            changed = true;
      }

      // Update font size if provided and different
      if (fontSize !== undefined) {
          const parsedFontSize = parseInt(fontSize, 10); // Use parsed value
          if (user.settings.fontSize !== parsedFontSize) {
              user.settings.fontSize = parsedFontSize;
              changed = true;
          }
      }

      // Only save if something actually changed
      if (changed) {
            user.markModified('settings'); // Mark nested 'settings' object as modified
            await user.save();
            console.log(`Settings updated for user: ${req.user.id}`, user.settings);
      } else {
           console.log("No setting changes detected for user:", req.user.id);
      }


      // Return the current state of all settings
      res.json({
          design: user.settings.design,
          orderDesign: user.settings.orderDesign,
          fontSize: user.settings.fontSize
        });

  } catch (error) {
      console.error('Error updating user settings:', error);
       if (error.name === 'ValidationError') {
          return res.status(400).json({ message: 'Validation failed', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error while updating settings.', error: error.message });
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
