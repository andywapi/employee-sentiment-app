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
// Trust proxy for accurate IP addresses (important for deployment)
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IP tracking middleware
app.use((req, res, next) => {
  // Get client IP address
  const clientIP = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'];
  
  req.clientIP = clientIP;
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.includes('/responses')) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Client IP:', req.clientIP);
  }
  next();
});

// CORS configuration for API requests
app.use((req, res, next) => {
  // Allow requests from any origin in development and from Render in production
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

/**
 * MongoDB Connection
 */
const connectDB = async () => {
  try {
    // Use different connection strings based on environment
    const mongoURI = process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_URI // Use cloud MongoDB in production
      : 'mongodb://localhost:27017/employee_sentiment_db'; // Use local MongoDB in development
    
    console.log(`Connecting to MongoDB in ${process.env.NODE_ENV || 'development'} mode...`);
    // Set strictQuery to false to prepare for Mongoose 7
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increase timeout to 10 seconds
      heartbeatFrequencyMS: 2000,     // Check connection every 2 seconds
      retryWrites: true,              // Enable retry for write operations
      w: 'majority',                  // Wait for writes to be acknowledged
      maxPoolSize: 10,               // Maximum number of connections
      minPoolSize: 2                 // Minimum number of connections
    });
    
    // Handle MongoDB connection events
    mongoose.connection.on('connected', () => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      // Don't exit process, let it retry
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
      // Mongoose will automatically try to reconnect
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Don't exit process, let it retry
    if (process.env.NODE_ENV === 'production') {
      // In production, wait and retry
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      // In development, exit to show the error
      process.exit(1);
    }
  }
};

// Connect to MongoDB
connectDB();

// Add a direct test route for question ordering
app.post('/api/test-order', (req, res) => {
  console.log('Test order route hit:', req.body);
  res.json({
    success: true,
    message: 'Order update test successful',
    data: req.body
  });
});

// Add a direct implementation of the question ordering functionality
app.post('/api/questions/order', async (req, res) => {
  try {
    console.log('Direct question order route hit:', req.body);
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.error('Invalid request format:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Invalid request format. Expected an array of questions with id and order.'
      });
    }
    
    // Import the SurveyQuestion model directly
    const SurveyQuestion = require('./models/SurveyQuestion');
    
    // Process each question update in sequence
    for (const item of questions) {
      if (!item.id || item.order === undefined) {
        console.error('Invalid question item:', item);
        return res.status(400).json({
          success: false,
          message: 'Each question must have an id and order'
        });
      }
      
      const updatedQuestion = await SurveyQuestion.findByIdAndUpdate(
        item.id,
        { order: item.order },
        { new: true }
      );
      
      if (!updatedQuestion) {
        console.error('Question not found:', item.id);
        return res.status(404).json({
          success: false,
          message: `Question with id ${item.id} not found`
        });
      }
      
      console.log('Updated question order:', updatedQuestion._id, 'to', updatedQuestion.order);
    }
    
    // Fetch the updated questions with their new order
    const updatedQuestions = await SurveyQuestion.find().sort({ order: 1 });
    
    res.json({
      success: true,
      message: 'Question order updated successfully',
      data: updatedQuestions
    });
  } catch (error) {
    console.error('Error updating question order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating question order'
    });
  }
});

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
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    type: err.name,
    code: err.code
  });

  // Handle specific types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'This record already exists'
    });
  }

  // Generic error response
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
