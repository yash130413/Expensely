import express from 'express';
import User from '../models/User.js';
import { authMiddleware, generateToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register/create new user from Firebase token
 */
router.post('/register', async (req, res) => {
  try {
    const { firebaseUid, email, name, profileImage } = req.body;

    if (!firebaseUid || !email || !name) {
      return res.status(400).json({ 
        message: 'firebaseUid, email, and name are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser) {
      // Generate token and return existing user
      const token = generateToken(existingUser._id.toString(), firebaseUid);
      return res.status(200).json({
        message: 'User already exists',
        user: existingUser,
        token
      });
    }

    // Create new user
    const newUser = new User({
      firebaseUid,
      email,
      name,
      profileImage,
    });

    const savedUser = await newUser.save();
    const token = generateToken(savedUser._id.toString(), firebaseUid);

    res.status(201).json({
      message: 'User created successfully',
      user: savedUser,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login user with Firebase ID token
 * Returns JWT token for subsequent requests
 */
router.post('/login', async (req, res) => {
  try {
    const { firebaseUid, email, name, profileImage } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ message: 'firebaseUid is required' });
    }

    // Find or create user
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
      // Auto-create user on first login
      user = new User({
        firebaseUid,
        email,
        name,
        profileImage,
      });
      await user.save();
    } else {
      // Update user info if provided
      if (name) user.name = name;
      if (email) user.email = email;
      if (profileImage) user.profileImage = profileImage;
      await user.save();
    }

    const token = generateToken(user._id.toString(), firebaseUid);

    res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile (requires auth)
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (requires auth)
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, profileImage, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { 
        ...(name && { name }),
        ...(profileImage && { profileImage }),
        ...(phone && { phone }),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        phone: user.phone,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side mostly handles this)
 */
router.post('/logout', authMiddleware, (req, res) => {
  try {
    // Token becomes invalid on client side
    // Backend can log the logout if needed
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
