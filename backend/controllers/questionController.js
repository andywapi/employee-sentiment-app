const SurveyQuestion = require('../models/SurveyQuestion');

exports.createQuestion = async (req, res) => {
  try {
    const { text, questionType, options } = req.body;
    const question = new SurveyQuestion({ 
      text, 
      questionType, 
      options: questionType === 'multipleChoice' ? options : [] 
    });
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const questions = await SurveyQuestion.find({ isActive: true });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, questionType, options, isActive } = req.body;
    
    const updatedQuestion = await SurveyQuestion.findByIdAndUpdate(
      id,
      { 
        text, 
        questionType, 
        options: questionType === 'multipleChoice' ? options : [],
        isActive
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.json(updatedQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQuestion = await SurveyQuestion.findByIdAndDelete(id);
    
    if (!deletedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
