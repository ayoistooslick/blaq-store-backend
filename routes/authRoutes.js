const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { cloudinary, upload } = require('../config/cloudinary');

const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    cloudinary.uploader.upload(fileBase64, { folder: 'blaq_store_avatars', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] }, (err, result) => {
      if (err) reject(err);
      else resolve(result.secure_url);
    });
  });

const generateToken = (id) => jwt.sign({ id }, "SUPER_SECRET_BLAQ_KEY_2026", { expiresIn: '30d' });

router.post('/register', async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, phoneNumber });

    res.status(201).json({ _id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber, role: user.role, sellerRequestStatus: user.sellerRequestStatus, avatar: user.avatar, token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ _id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber, role: user.role, sellerRequestStatus: user.sellerRequestStatus, avatar: user.avatar, token: generateToken(user._id) });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided.' });
    const avatarUrl = await uploadToCloudinary(req.file);
    const user = await User.findById(req.user._id);
    user.avatar = avatarUrl;
    await user.save();
    res.json({ avatar: avatarUrl });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Avatar upload failed.' });
  }
});

router.put('/profile', protect, async (req, res) => {
  const { name, email, phoneNumber } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) return res.status(400).json({ message: 'That email is already in use.' });
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();

    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      sellerRequestStatus: user.sellerRequestStatus,
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/become-seller', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role === 'seller' || user.role === 'super_admin') {
      return res.status(400).json({ message: 'You are already an approved seller or admin.' });
    }
    user.sellerRequestStatus = 'pending';
    await user.save();
    res.json({ message: 'Seller application submitted successfully.', status: user.sellerRequestStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
