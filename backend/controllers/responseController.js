const SurveyResponse = require('../models/SurveyResponse');
const SurveyQuestion = require('../models/SurveyQuestion');
const SubmissionTracker = require('../models/SubmissionTracker');

exports.submitResponse = async (req, res) => {
  try {
    const { questionId, responseText, selectedOption, deviceFingerprint, submissionTimestamp } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Validate question type and response
    const question = await SurveyQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    console.log('Submitting response:', {
      questionId,
      questionType: question.questionType,
      responseText,
      selectedOption,
      deviceFingerprint,
      clientIP
    });

    // Create response object based on question type
    const responseData = {
      questionId,
      deviceFingerprint,
      submissionTimestamp: submissionTimestamp || new Date(),
      ipAddress: clientIP
    };

    // Add the appropriate response field based on question type
    if (question.questionType === 'multipleChoice') {
      responseData.selectedOption = selectedOption;
      // For multiple choice, we don't need responseText
      responseData.responseText = null;
    } else {
      responseData.responseText = responseText;
      // For text questions, we don't need selectedOption
      responseData.selectedOption = null;
    }

    const response = new SurveyResponse(responseData);

    await response.save();
    
    // Record submission in tracker (only once per survey completion)
    if (deviceFingerprint) {
      try {
        const existingTracker = await SubmissionTracker.findOne({
          deviceFingerprint,
          submissionDate: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        });

        if (!existingTracker) {
          const submissionTracker = new SubmissionTracker({
            deviceFingerprint,
            ipAddress: clientIP,
            userAgent: req.get('User-Agent'),
            submissionDate: new Date(),
            responseCount: 1,
            lastSubmissionDate: new Date()
          });

          await submissionTracker.save();
        }
      } catch (trackerError) {
        console.error('Error saving submission tracker:', trackerError);
        // Don't fail the response submission if tracker fails
      }
    }
    
    console.log('Response saved:', response);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getUserResponses = async (req, res) => {
  try {
    const responses = await SurveyResponse.find()
      .populate('questionId');
    
    console.log('Raw responses from DB:', JSON.stringify(responses, null, 2));
    
    // Format response to include question text and type
    const formattedResponses = responses.map(response => {
      // Handle case where questionId might not be populated
      if (!response.questionId) {
        return {
          _id: response._id,
          questionId: null,
          questionText: 'Unknown Question',
          questionType: 'text',
          responseText: response.responseText,
          selectedOption: response.selectedOption,
          createdAt: response.createdAt
        };
      }
      
      // Determine the question type based on the response data
      let questionType = 'text';
      if (response.questionId.questionType) {
        questionType = response.questionId.questionType;
      } else if (response.selectedOption) {
        // If we have a selectedOption but no questionType, it's likely a multiple choice
        questionType = 'multipleChoice';
      }
      
      return {
        _id: response._id,
        questionId: response.questionId._id,
        questionText: response.questionId.text,
        questionType: questionType,
        responseText: response.responseText,
        selectedOption: response.selectedOption,
        createdAt: response.createdAt
      };
    });
    
    console.log('Formatted responses:', JSON.stringify(formattedResponses, null, 2));
    
    res.json(formattedResponses);
  } catch (error) {
    console.error('Error in getUserResponses:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllResponses = async (req, res) => {
  try {
    const responses = await SurveyResponse.find()
      .populate('questionId');
    
    // Format response to include question text and type
    const formattedResponses = responses.map(response => {
      // Handle case where questionId might not be populated
      if (!response.questionId) {
        return {
          _id: response._id,
          questionId: null,
          questionText: 'Unknown Question',
          questionType: 'text',
          responseText: response.responseText,
          selectedOption: response.selectedOption,
          createdAt: response.createdAt
        };
      }
      
      // Determine the question type based on the response data
      let questionType = 'text';
      if (response.questionId.questionType) {
        questionType = response.questionId.questionType;
      } else if (response.selectedOption) {
        // If we have a selectedOption but no questionType, it's likely a multiple choice
        questionType = 'multipleChoice';
      }
      
      return {
        _id: response._id,
        questionId: response.questionId._id,
        questionText: response.questionId.text,
        questionType: questionType,
        responseText: response.responseText,
        selectedOption: response.selectedOption,
        createdAt: response.createdAt
      };
    });
    
    res.json(formattedResponses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    // Get unique user IDs from responses
    const responses = await SurveyResponse.find().distinct('userId');
    res.json(responses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getParetoAnalysis = async (req, res) => {
  try {
    const responses = await SurveyResponse.find();
    
    // Basic Pareto analysis for text responses
    const keywords = ['good', 'bad', 'improve', 'issue', 'problem'];
    const keywordCounts = {};

    responses.forEach(response => {
      if (response.responseText) {
        keywords.forEach(keyword => {
          const count = (response.responseText.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + count;
        });
      }
    });

    // Sort keywords by frequency
    const sortedKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, count]) => ({ keyword, count }));

    // Calculate cumulative percentage
    let total = sortedKeywords.reduce((sum, item) => sum + item.count, 0);
    let cumulativePercentage = 0;
    sortedKeywords.forEach(item => {
      item.percentage = (item.count / total) * 100;
      cumulativePercentage += item.percentage;
      item.cumulativePercentage = cumulativePercentage;
    });

    res.json(sortedKeywords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
