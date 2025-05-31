const mongoose = require('mongoose');

const SurveyResponseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SurveyQuestion',
    required: true
  },
  responseText: {
    type: String,
    maxlength: 100
  },
  selectedOption: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to prevent duplicate submissions
SurveyResponseSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('SurveyResponse', SurveyResponseSchema);
