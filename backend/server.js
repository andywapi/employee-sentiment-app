const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const surveyRoutes = require('./routes/surveyRoutes');
const { authenticate } = require('./middleware/auth');

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
 * MongoDB Connection
 */
const connectDB = async () => {
  try {
    // Use MONGODB_URI from environment variables
    const mongoURI = process.env.MONGODB_URI;
    
    console.log(`Connecting to MongoDB...`);
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// API Routes - Apply authentication middleware to all API routes
app.use(API_PREFIX, authenticate);
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
