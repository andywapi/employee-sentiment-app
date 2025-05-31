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
  deviceFingerprint: {
    type: String,
    required: false,
    index: true
  },
  submissionTimestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to prevent duplicate submissions
SurveyResponseSchema.index({ userId: 1, questionId: 1 }, { unique: true });

// Index for duplicate detection
SurveyResponseSchema.index({ deviceFingerprint: 1, submissionTimestamp: 1 });

module.exports = mongoose.model('SurveyResponse', SurveyResponseSchema);
