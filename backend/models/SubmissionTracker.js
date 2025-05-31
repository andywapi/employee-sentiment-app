const mongoose = require('mongoose');

const submissionTrackerSchema = new mongoose.Schema({
  deviceFingerprint: {
    type: String,
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: false
  },
  submissionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  employeeId: {
    type: String,
    required: false // Optional since survey is anonymous
  },
  responseCount: {
    type: Number,
    default: 1
  },
  lastSubmissionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient duplicate checking
submissionTrackerSchema.index({ deviceFingerprint: 1, ipAddress: 1 });

// TTL index to automatically remove old entries after 30 days
submissionTrackerSchema.index({ submissionDate: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('SubmissionTracker', submissionTrackerSchema);
