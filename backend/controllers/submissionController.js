const SubmissionTracker = require('../models/SubmissionTracker');
const SurveyResponse = require('../models/SurveyResponse');

/**
 * Check if a submission already exists for this device/IP combination
 */
const checkSubmission = async (req, res) => {
  try {
    const { fingerprint } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (!fingerprint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device fingerprint is required' 
      });
    }

    // Check if this fingerprint has submitted recently (within 30 days)
    const existingSubmission = await SubmissionTracker.findOne({
      $or: [
        { deviceFingerprint: fingerprint },
        { 
          deviceFingerprint: fingerprint, 
          ipAddress: clientIP 
        }
      ],
      submissionDate: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      }
    });

    // Also check survey responses for additional verification
    const existingResponse = await SurveyResponse.findOne({
      deviceFingerprint: fingerprint,
      submissionTimestamp: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      }
    });

    const alreadySubmitted = !!(existingSubmission || existingResponse);

    res.json({
      success: true,
      alreadySubmitted,
      message: alreadySubmitted 
        ? 'Submission already exists for this device' 
        : 'No previous submission found'
    });

  } catch (error) {
    console.error('Error checking submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking submission status',
      error: error.message
    });
  }
};

/**
 * Record a new submission
 */
const recordSubmission = async (req, res) => {
  try {
    const { fingerprint, employeeId } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!fingerprint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device fingerprint is required' 
      });
    }

    // Check if submission already exists
    const existingSubmission = await SubmissionTracker.findOne({
      deviceFingerprint: fingerprint,
      submissionDate: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      }
    });

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.responseCount += 1;
      existingSubmission.lastSubmissionDate = new Date();
      await existingSubmission.save();
    } else {
      // Create new submission tracker
      const submissionTracker = new SubmissionTracker({
        deviceFingerprint: fingerprint,
        ipAddress: clientIP,
        userAgent,
        employeeId,
        submissionDate: new Date(),
        responseCount: 1,
        lastSubmissionDate: new Date()
      });

      await submissionTracker.save();
    }

    res.json({
      success: true,
      message: 'Submission recorded successfully'
    });

  } catch (error) {
    console.error('Error recording submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording submission',
      error: error.message
    });
  }
};

/**
 * Get submission statistics (for admin)
 */
const getSubmissionStats = async (req, res) => {
  try {
    const totalSubmissions = await SubmissionTracker.countDocuments();
    const uniqueDevices = await SubmissionTracker.distinct('deviceFingerprint').length;
    const uniqueIPs = await SubmissionTracker.distinct('ipAddress').length;
    
    const recentSubmissions = await SubmissionTracker.countDocuments({
      submissionDate: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    });

    res.json({
      success: true,
      stats: {
        totalSubmissions,
        uniqueDevices,
        uniqueIPs,
        recentSubmissions
      }
    });

  } catch (error) {
    console.error('Error getting submission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving submission statistics',
      error: error.message
    });
  }
};

// Clear all tracking data
const clearTrackingData = async (req, res) => {
  try {
    // Clear all submission tracker records
    await SubmissionTracker.deleteMany({});
    
    // Optionally clear device fingerprints from survey responses
    await SurveyResponse.updateMany(
      {},
      { 
        $unset: { 
          deviceFingerprint: 1, 
          ipAddress: 1 
        } 
      }
    );
    
    res.json({ 
      message: 'All tracking data cleared successfully',
      clearedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing tracking data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export tracking data
const exportTrackingData = async (req, res) => {
  try {
    // Get all submission tracker records
    const trackingData = await SubmissionTracker.find({})
      .select('-__v')
      .sort({ createdAt: -1 });
    
    // Get submission statistics
    const stats = await getSubmissionStatsData();
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      statistics: stats,
      trackingRecords: trackingData,
      totalRecords: trackingData.length
    };
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting tracking data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to get stats data (reusable)
const getSubmissionStatsData = async () => {
  const totalSubmissions = await SubmissionTracker.countDocuments();
  const uniqueDevices = await SubmissionTracker.distinct('deviceFingerprint').then(arr => arr.length);
  const uniqueIPs = await SubmissionTracker.distinct('ipAddress').then(arr => arr.length);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSubmissions = await SubmissionTracker.countDocuments({
    createdAt: { $gte: sevenDaysAgo }
  });
  
  return {
    totalSubmissions,
    uniqueDevices,
    uniqueIPs,
    recentSubmissions
  };
};

module.exports = {
  checkSubmission,
  recordSubmission,
  getSubmissionStats,
  clearTrackingData,
  exportTrackingData
};
