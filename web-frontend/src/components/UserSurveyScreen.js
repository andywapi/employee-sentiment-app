import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

function UserSurveyScreen() {
  const [questions, setQuestions] = useState([]);
  const [userId, setUserId] = useState('');
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const fetchedQuestions = await apiService.getQuestions();
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error('Failed to fetch questions', error);
      }
    };
    fetchQuestions();
  }, []);

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionPromises = questions.map(question => {
        const response = {
          userId,
          questionId: question._id,
          responseText: responses[question._id] || '',
          selectedOption: question.questionType === 'multipleChoice' ? responses[question._id] : null
        };
        return apiService.submitResponse(response);
      });

      await Promise.all(submissionPromises);
      alert('Responses submitted successfully!');
      setResponses({});
    } catch (error) {
      console.error('Failed to submit responses', error);
      alert('Failed to submit responses');
    }
  };

  return (
    <div className="user-survey-container">
      <h1>Employee Sentiment Survey</h1>
      <form onSubmit={handleSubmit}>
        <div className="user-id-section">
          <label>
            Your User ID:
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </label>
        </div>

        {questions.map(question => (
          <div key={question._id} className="question-container">
            <p>{question.text}</p>
            {question.questionType === 'text' ? (
              <textarea
                value={responses[question._id] || ''}
                onChange={(e) => handleResponseChange(question._id, e.target.value)}
                maxLength={100}
                placeholder="Enter your response (max 100 characters)"
              />
            ) : (
              <div className="multiple-choice-options">
                {question.options.map(option => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={option}
                      checked={responses[question._id] === option}
                      onChange={() => handleResponseChange(question._id, option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        <button type="submit">Submit Responses</button>
      </form>
    </div>
  );
}

export default UserSurveyScreen;
