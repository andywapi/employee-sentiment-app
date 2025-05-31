const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const responseController = require('../controllers/responseController');
const axios = require('axios');

// Question Routes
router.post('/questions/order', questionController.updateQuestionOrder);
router.post('/questions', questionController.createQuestion);
router.get('/questions', questionController.getQuestions);
router.put('/questions/:id', questionController.updateQuestion);
router.delete('/questions/:id', questionController.deleteQuestion);

// Response Routes
router.post('/responses', responseController.submitResponse);
router.get('/responses/user/:userId', responseController.getUserResponses);
router.get('/responses', responseController.getAllResponses);
router.get('/responses/users', responseController.getUsers);
router.get('/responses/pareto', responseController.getParetoAnalysis);

// Weather proxy route to avoid CORS issues
router.get('/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    // You would normally use your own API key here
    const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'demo_key';
    const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}`;
    
    // For demo purposes, return mock data if no API key is available
    if (WEATHER_API_KEY === 'demo_key') {
      return res.json({
        location: {
          name: 'Your Location',
          region: 'Demo Region',
          country: 'Demo Country'
        },
        current: {
          temp_c: 22,
          temp_f: 71.6,
          condition: {
            text: 'Sunny',
            icon: '//cdn.weatherapi.com/weather/64x64/day/113.png'
          }
        }
      });
    }
    
    const response = await axios.get(weatherUrl);
    res.json(response.data);
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching weather data'
    });
  }
});

module.exports = router;
