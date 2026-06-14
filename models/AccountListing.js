const mongoose = require('mongoose');

const AccountListingSchema = new mongoose.Schema({
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  gameType: { 
    type: String, 
    enum: ['Free Fire', 'CODM', 'Other'], 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  status: { 
    type: String, 
    enum: ['available', 'sold'], 
    default: 'available' 
  }
}, { timestamps: true });

module.exports = mongoose.model('AccountListing', AccountListingSchema);
