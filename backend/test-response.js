/**
 * Test script to diagnose and fix the multiple choice response issue
 */
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const SurveyQuestion = require('./models/SurveyQuestion');
const SurveyResponse = require('./models/SurveyResponse');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/employee-sentiment')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function diagnoseResponses() {
  try {
    // 1. Get all questions
    const questions = await SurveyQuestion.find();
    console.log('\n=== All Questions ===');
    questions.forEach(q => {
      console.log(`ID: ${q._id}, Text: ${q.text}, Type: ${q.questionType}, Options: ${q.options.join(', ')}`);
    });

    // 2. Get all responses
    const responses = await SurveyResponse.find().populate('questionId');
    console.log('\n=== All Responses ===');
    responses.forEach(r => {
      console.log(`Response ID: ${r._id}`);
      console.log(`Question ID: ${r.questionId ? r.questionId._id : 'N/A'}`);
      console.log(`Question Text: ${r.questionId ? r.questionId.text : 'N/A'}`);
      console.log(`Question Type: ${r.questionId ? r.questionId.questionType : 'N/A'}`);
      console.log(`User ID: ${r.userId}`);
      console.log(`Response Text: ${r.responseText}`);
      console.log(`Selected Option: ${r.selectedOption}`);
      console.log(`Created At: ${r.createdAt}`);
      console.log('---');
    });

    // 3. Fix any issues with responses
    console.log('\n=== Fixing Issues ===');
    for (const response of responses) {
      if (!response.questionId) {
        console.log(`Skipping response ${response._id} - question not found`);
        continue;
      }

      let needsUpdate = false;
      const updates = {};

      // Check if the response type matches the question type
      if (response.questionId.questionType === 'multipleChoice' && !response.selectedOption && response.responseText) {
        console.log(`Fixing response ${response._id}: Moving responseText to selectedOption`);
        updates.selectedOption = response.responseText;
        updates.responseText = null;
        needsUpdate = true;
      }

      if (response.questionId.questionType === 'text' && !response.responseText && response.selectedOption) {
        console.log(`Fixing response ${response._id}: Moving selectedOption to responseText`);
        updates.responseText = response.selectedOption;
        updates.selectedOption = null;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await SurveyResponse.findByIdAndUpdate(response._id, updates);
        console.log(`Updated response ${response._id}`);
      }
    }

    console.log('\nDiagnosis complete. Please restart your server.');
    process.exit(0);
  } catch (error) {
    console.error('Error during diagnosis:', error);
    process.exit(1);
  }
}

// Run the diagnosis
diagnoseResponses();
