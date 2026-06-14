require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const marketRoutes = require('./routes/marketRoutes');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/market', marketRoutes);
app.get('/', (req, res) => {
  res.json({ status: 'active', platform: 'Blaq Store REST API Engine' });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`~ Blaq Store Backend Service running on port ${PORT}`);
  });
});
