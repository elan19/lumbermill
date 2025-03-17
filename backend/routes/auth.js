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
