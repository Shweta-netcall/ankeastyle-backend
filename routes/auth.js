// code
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // Create new user
      user = new User({
        name,
        email,
        password
        // Role will default to 'user' as per your schema, which is correct for registration
      });

      await user.save();

      // Create JWT
      const payload = {
        user: {
          id: user.id,
          role: user.role // Include the role in the JWT payload for future checks
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: { // Also send user data in response, useful for frontend context
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // --- NEW: Check if the user has the 'admin' role ---
      if (user.role !== 'admin') {
        // You might want a more specific message like "Access Denied: Not an admin."
        // Or you could let them log in but then redirect from dashboard if not admin.
        // For admin dashboard access, it's better to deny here.
        return res.status(403).json({ errors: [{ msg: 'Access Denied: You do not have administrator privileges.' }] });
      }


      // Create JWT
      const payload = {
        user: {
          id: user.id,
          role: user.role // IMPORTANT: Include the user's role in the JWT payload
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' }, // 7 days expiration for convenience, adjust as needed
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: { // Send back relevant user info, excluding password
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role // Include the role here too
            }
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;