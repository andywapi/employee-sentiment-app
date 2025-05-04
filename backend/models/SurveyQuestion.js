const mongoose = require('mongoose');

// Define the validation function before using it in the schema
function arrayLimit(val) {
  return !this.questionType || this.questionType !== 'multipleChoice' || val.length <= 3;
}

const SurveyQuestionSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  questionType: {
    type: String, 
    enum: ['text', 'multipleChoice'], 
    default: 'text'
  },
  options: {
    type: [String],
    validate: [
      arrayLimit, 
      'Multiple-choice questions can have up to 3 options'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 9999 // Default to a high number so new questions appear at the end
  }
});

module.exports = mongoose.model('SurveyQuestion', SurveyQuestionSchema);
