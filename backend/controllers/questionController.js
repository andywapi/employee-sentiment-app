const SurveyQuestion = require('../models/SurveyQuestion');

/**
 * Create a new survey question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with created question or error
 */
exports.createQuestion = async (req, res) => {
  try {
    const { text, questionType, options, order } = req.body;
    
    // Input validation
    if (!text || text.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Question text is required' 
      });
    }
    
    if (questionType === 'multipleChoice' && (!options || options.length === 0)) {
      return res.status(400).json({ 
        success: false,
        message: 'Multiple-choice questions must have at least one option' 
      });
    }
    
    // Get the count of existing questions to set a default order if not provided
    const questionCount = await SurveyQuestion.countDocuments();
    
    const question = new SurveyQuestion({ 
      text, 
      questionType, 
      options: questionType === 'multipleChoice' ? options : [],
      order: order !== undefined ? order : questionCount + 1 // Set order based on count if not provided
    });
    
    await question.save();
    
    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Error creating question:', error.message);
    
    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating question' 
    });
  }
};

/**
 * Get all active survey questions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with questions or error
 */
exports.getQuestions = async (req, res) => {
  try {
    console.log('Query params:', req.query);
    
    // Get all questions if all=true, only active questions for regular users, or all questions for admin
    const showAll = req.query.all === 'true';
    const isAdmin = req.query.admin === 'true';
    const filter = showAll || isAdmin ? {} : { isActive: true };
    
    console.log('Using filter:', filter);
    
    // Sort questions by order field
    const questions = await SurveyQuestion.find(filter).sort({ order: 1 });
    console.log(`Found ${questions.length} questions`);
    
    // For all=true, return just the array without the wrapper object
    if (showAll) {
      return res.json(questions);
    }
    
    // Otherwise return the standard format
    res.json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Error fetching questions:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching questions' 
    });
  }
};

/**
 * Update an existing survey question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated question or error
 */
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, questionType, options, isActive, order } = req.body;
    
    // Input validation
    if (!text || text.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Question text is required' 
      });
    }
    
    if (questionType === 'multipleChoice' && (!options || options.length === 0)) {
      return res.status(400).json({ 
        success: false,
        message: 'Multiple-choice questions must have at least one option' 
      });
    }
    
    const updateData = { 
      text, 
      questionType, 
      options: questionType === 'multipleChoice' ? options : [],
      isActive
    };
    
    // Only include order in the update if it was provided
    if (order !== undefined) {
      updateData.order = order;
    }
    
    const updatedQuestion = await SurveyQuestion.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedQuestion) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }
    
    res.json({
      success: true,
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Error updating question:', error.message);
    
    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID format'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating question' 
    });
  }
};

/**
 * Update the order of multiple questions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message or error
 */
exports.updateQuestionOrder = async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format. Expected an array of questions with id and order.'
      });
    }
    
    // Process each question update in parallel
    const updatePromises = questions.map(item => {
      if (!item.id || item.order === undefined) {
        return Promise.reject(new Error('Each question must have an id and order'));
      }
      
      return SurveyQuestion.findByIdAndUpdate(
        item.id,
        { order: item.order },
        { new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    // Fetch the updated questions with their new order
    const updatedQuestions = await SurveyQuestion.find().sort({ order: 1 });
    
    res.json({
      success: true,
      message: 'Question order updated successfully',
      data: updatedQuestions
    });
  } catch (error) {
    console.error('Error updating question order:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating question order'
    });
  }
};

/**
 * Delete a survey question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message or error
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedQuestion = await SurveyQuestion.findByIdAndDelete(id);
    
    if (!deletedQuestion) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Question deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting question:', error.message);
    
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID format'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting question' 
    });
  }
};
