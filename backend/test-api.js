const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5001;

// Configure Express middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Test route for question order
app.post('/api/questions/order', (req, res) => {
  console.log('Received order update request:', req.body);
  res.json({ 
    success: true, 
    message: 'Order update received successfully',
    data: req.body
  });
});

// Serve static frontend for testing
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test the API at: http://localhost:${PORT}/api/test`);
  console.log(`Access the admin panel at: http://localhost:${PORT}/admin.html`);
});
