const SurveyResponse = require('../models/SurveyResponse');
const SurveyQuestion = require('../models/SurveyQuestion');

exports.submitResponse = async (req, res) => {
  try {
    const { questionId, userId, responseText, selectedOption } = req.body;
    
    // Validate question type and response
    const question = await SurveyQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const response = new SurveyResponse({
      questionId,
      userId,
      responseText: question.questionType === 'text' ? responseText : null,
      selectedOption: question.questionType === 'multipleChoice' ? selectedOption : null
    });

    await response.save();
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserResponses = async (req, res) => {
  try {
    const { userId } = req.params;
    const responses = await SurveyResponse.find({ userId })
      .populate('questionId');
    
    // Format response to include question text
    const formattedResponses = responses.map(response => {
      return {
        _id: response._id,
        questionId: response.questionId._id,
        questionText: response.questionId.text,
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

exports.getAllResponses = async (req, res) => {
  try {
    const responses = await SurveyResponse.find()
      .populate('questionId');
    
    // Format response to include question text
    const formattedResponses = responses.map(response => {
      return {
        _id: response._id,
        questionId: response.questionId._id,
        questionText: response.questionId.text,
        userId: response.userId,
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
