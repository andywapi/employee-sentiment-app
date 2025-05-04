import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

function AdminSurveyScreen() {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    questionType: 'text',
    options: ['', '', '']
  });
  const [userResponses, setUserResponses] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const fetchedQuestions = await apiService.getQuestions();
      setQuestions(fetchedQuestions);
    } catch (error) {
      console.error('Failed to fetch questions', error);
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion(prev => ({
      ...prev,
      options: updatedOptions
    }));
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      // Backend API call to create question would go here
      alert('Question creation not implemented in this demo');
      fetchQuestions();
    } catch (error) {
      console.error('Failed to create question', error);
    }
  };

  const handleUserSelect = async (userId) => {
    try {
      const responses = await apiService.getUserResponses(userId);
      setUserResponses(responses);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Failed to fetch user responses', error);
    }
  };

  return (
    <div className="admin-survey-container">
      <h1>Admin Survey Management</h1>

      <div className="create-question-section">
        <h2>Create New Question</h2>
        <form onSubmit={handleCreateQuestion}>
          <input
            type="text"
            placeholder="Question Text"
            value={newQuestion.text}
            onChange={(e) => setNewQuestion(prev => ({
              ...prev,
              text: e.target.value
            }))}
            required
          />
          <select
            value={newQuestion.questionType}
            onChange={(e) => setNewQuestion(prev => ({
              ...prev,
              questionType: e.target.value
            }))}
          >
            <option value="text">Text Response</option>
            <option value="multipleChoice">Multiple Choice</option>
          </select>

          {newQuestion.questionType === 'multipleChoice' && (
            <div className="multiple-choice-options">
              {newQuestion.options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
              ))}
            </div>
          )}

          <button type="submit">Create Question</button>
        </form>
      </div>

      <div className="existing-questions-section">
        <h2>Existing Questions</h2>
        {questions.map(question => (
          <div key={question._id} className="question-item">
            <p>{question.text}</p>
            <p>Type: {question.questionType}</p>
            {question.questionType === 'multipleChoice' && (
              <div>
                Options: {question.options.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="user-responses-section">
        <h2>User Responses</h2>
        <input
          type="text"
          placeholder="Enter User ID"
          onBlur={(e) => handleUserSelect(e.target.value)}
        />

        {selectedUser && (
          <div>
            <h3>Responses for User: {selectedUser}</h3>
            {userResponses.map(response => (
              <div key={response._id} className="response-item">
                <p>Question: {response.questionText}</p>
                <p>Response: {response.responseText || response.selectedOption}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSurveyScreen;
