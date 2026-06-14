const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedAdmin();
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'storeblaq@gmail.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('BLAQSTORE', 10);
      await User.create({
        name: 'Blaq Store Admin',
        email: 'storeblaq@gmail.com',
        password: hashedPassword,
        phoneNumber: '+2348142146233',
        role: 'super_admin',
        isSellerApproved: true
      });
      console.log('✔ Super Admin seeded successfully with default BLAQSTORE credentials.');
    }
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
  }
};

module.exports = connectDB;
