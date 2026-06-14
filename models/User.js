const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['buyer', 'seller', 'super_admin'], 
    default: 'buyer' 
  },
  sellerRequestStatus: { 
    type: String, 
    enum: ['none', 'pending', 'approved', 'rejected'], 
    default: 'none' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
