const mongoose = require('mongoose');

const SurveyResponseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SurveyQuestion',
    required: true
  },
  userId: {
    type: String,
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

module.exports = mongoose.model('SurveyResponse', SurveyResponseSchema);
