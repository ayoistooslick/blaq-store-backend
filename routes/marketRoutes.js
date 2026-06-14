const express = require('express');
const router = express.Router();
const AccountListing = require('../models/AccountListing');
const { protect, authorize } = require('../middleware/auth');
const { cloudinary, upload } = require('../config/cloudinary');

const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    cloudinary.uploader.upload(fileBase64, { folder: 'blaq_store_listings' }, (err, result) => {
      if (err) reject(err);
      else resolve(result.secure_url);
    });
  });

router.get('/catalog', async (req, res) => {
  try {
    const catalogItems = await AccountListing.find({ status: 'available' })
      .populate('seller', 'name phoneNumber')
      .sort({ createdAt: -1 });
    res.json(catalogItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-listings', protect, authorize('seller', 'super_admin'), async (req, res) => {
  try {
    const listings = await AccountListing.find({ seller: req.user._id })
      .populate('seller', 'name phoneNumber')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/list-account', protect, authorize('seller', 'super_admin'), upload.array('images', 5), async (req, res) => {
  const { gameType, title, description, price, imageUrls } = req.body;
  try {
    let images = [];

    if (req.files && req.files.length > 0) {
      images = await Promise.all(req.files.map(uploadToCloudinary));
    } else if (imageUrls) {
      const parsed = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls;
      images = Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed].filter(Boolean);
    }

    const newListing = await AccountListing.create({
      seller: req.user._id,
      gameType,
      title,
      description,
      price: Number(price),
      images,
    });

    res.status(201).json({ message: 'Account listed successfully!', listing: newListing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/listing/:id', protect, authorize('seller', 'super_admin'), upload.array('images', 5), async (req, res) => {
  try {
    const listing = await AccountListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });

    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Unauthorized modification attempt.' });
    }

    const { gameType, title, description, price, imageUrls, status } = req.body;

    if (gameType) listing.gameType = gameType;
    if (title) listing.title = title;
    if (description) listing.description = description;
    if (price) listing.price = Number(price);
    if (status === 'available' || status === 'sold') listing.status = status;

    if (req.files && req.files.length > 0) {
      listing.images = await Promise.all(req.files.map(uploadToCloudinary));
    } else if (imageUrls !== undefined) {
      const parsed = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls;
      listing.images = Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed].filter(Boolean);
    }

    await listing.save();
    res.json({ message: 'Listing updated successfully.', listing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/listing/:id/sold', protect, authorize('seller', 'super_admin'), async (req, res) => {
  try {
    const listing = await AccountListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });

    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Unauthorized modification attempt.' });
    }

    listing.status = 'sold';
    await listing.save();
    res.json({ message: 'Listing successfully marked as SOLD.', listing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/listing/:id', protect, authorize('seller', 'super_admin'), async (req, res) => {
  try {
    const listing = await AccountListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });

    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Unauthorized modification attempt.' });
    }

    await listing.deleteOne();
    res.json({ message: 'Listing deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
