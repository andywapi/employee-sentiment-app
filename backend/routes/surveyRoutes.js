const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const responseController = require('../controllers/responseController');

// Question Routes
router.post('/questions', questionController.createQuestion);
router.get('/questions', questionController.getQuestions);
router.post('/questions/order', questionController.updateQuestionOrder);
router.put('/questions/:id', questionController.updateQuestion);
router.delete('/questions/:id', questionController.deleteQuestion);

// Response Routes
router.post('/responses', responseController.submitResponse);
router.get('/responses/user/:userId', responseController.getUserResponses);
router.get('/responses', responseController.getAllResponses);
router.get('/responses/users', responseController.getUsers);
router.get('/responses/pareto', responseController.getParetoAnalysis);

module.exports = router;
