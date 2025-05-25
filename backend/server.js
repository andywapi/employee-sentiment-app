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
app.use(express.urlencoded({ extended: true }));

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
    // Use local MongoDB
    const mongoURI = 'mongodb://localhost:27017/employee_sentiment_db';
    
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

// API Routes - Apply authentication middleware to all API routes
if (process.env.NODE_ENV === 'production') {
  app.use(API_PREFIX, authenticate);
} else {
  console.log('Running in development mode - authentication bypassed');
}
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
