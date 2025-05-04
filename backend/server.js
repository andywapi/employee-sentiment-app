const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const surveyRoutes = require('./routes/surveyRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_sentiment_db';
const API_PREFIX = process.env.API_PREFIX || '/api';

/**
 * Configure Express middleware
 */
app.use(cors());
app.use(express.json());

/**
 * Connect to MongoDB
 * @returns {Promise} MongoDB connection promise
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('MongoDB connected successfully');
    }
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Initialize database connection
connectDB();

// API Routes
app.use(API_PREFIX, surveyRoutes);

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start Server
const server = app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running on port ${PORT}`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app; // Export for testing
