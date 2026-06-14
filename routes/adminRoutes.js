const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.get('/pending-sellers', protect, authorize('super_admin'), async (req, res) => {
  try {
    const pendingUsers = await User.find({ sellerRequestStatus: 'pending' }).select('-password');
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/review-seller/:id', protect, authorize('super_admin'), async (req, res) => {
  const { action } = req.body;
  try {
    const user = await User.findById(req.targetUser || req.params.id);
    if (!user) return res.status(404).json({ message: 'User profile not found.' });

    if (action === 'approve') {
      user.role = 'seller';
      user.sellerRequestStatus = 'approved';
    } else if (action === 'reject') {
      user.sellerRequestStatus = 'rejected';
    } else {
      return res.status(400).json({ message: 'Invalid action. Specify approve or reject.' });
    }

    await user.save();
    res.json({ message: `User application has been ${user.sellerRequestStatus}.`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
