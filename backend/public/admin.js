/**
 * Employee Sentiment App - Admin Panel
 * 
 * This file contains the JavaScript code for the admin panel functionality,
 * including question management, user response viewing, and analytics.
 */

// API configuration
const API_CONFIG = {
  BASE_URL: window.location.origin + '/api'
};

// State management
const STATE = {
  currentEditId: null,
  currentLanguage: localStorage.getItem('language') || 'en',
  allResponses: [],
  allQuestions: [],
  selectedUser: null
};

// DOM Elements
const DOM = {
  // Language elements
  languageSelect: document.getElementById('language-select'),
  
  // Tab elements
  tabs: document.querySelectorAll('.tab'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Question form elements
  questionForm: document.getElementById('question-form'),
  questionText: document.getElementById('question-text'),
  questionType: document.getElementById('question-type'),
  optionsContainer: document.getElementById('options-container'),
  optionInputs: document.querySelectorAll('.option-input'),
  isActive: document.getElementById('is-active'),
  
  // Question list
  questionsList: document.getElementById('questions-list'),
  
  // User response elements
  usersList: document.getElementById('users-list'),
  userResponses: document.getElementById('user-responses'),
  
  // Analytics elements
  chartsContainer: document.getElementById('charts-container')
};

/**
 * Helper function to get auth headers for API requests
 * @returns {Object} Headers object with authorization
 */
function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add auth header if credentials exist
  const credentials = localStorage.getItem('auth_credentials');
  if (credentials) {
    headers['Authorization'] = `Basic ${credentials}`;
  }
  
  return headers;
}

/**
 * Check if user is authenticated and redirect to login if not
 */
function checkAuth() {
  // Skip in development mode
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }
  
  const credentials = localStorage.getItem('auth_credentials');
  if (!credentials) {
    window.location.href = '/login.html';
  }
}

/**
 * Initialize the application
 */
function init() {
  // Check authentication
  checkAuth();
  
  // Set initial language
  DOM.languageSelect.value = STATE.currentLanguage;
  
  // Set up event listeners
  setupEventListeners();
  
  // Update UI with translations
  updateLanguage();
  
  // Load initial data
  loadQuestions();
  loadUsers();
  loadAllResponses();
  loadQuestionCharts(); // Load multiple choice question charts
  loadSentimentCharts(); // Load sentiment analysis charts for text questions
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Language toggle
  DOM.languageSelect.addEventListener('change', (e) => {
    STATE.currentLanguage = e.target.value;
    localStorage.setItem('language', STATE.currentLanguage);
    updateLanguage();
  });
  
  // Tab switching
  DOM.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      DOM.tabs.forEach(t => t.classList.remove('active'));
      DOM.tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById(`${tabName}-tab`).classList.add('active');
      
      // Load data for the active tab
      if (tabName === 'questions') {
        loadQuestions();
      } else if (tabName === 'responses') {
        loadUsers();
      } else if (tabName === 'analytics') {
        loadQuestionCharts(); // Load multiple choice question charts
        loadSentimentCharts(); // Load sentiment analysis charts for text questions
      }
    });
  });
  
  // Question type change
  DOM.questionType.addEventListener('change', function() {
    DOM.optionsContainer.style.display = this.value === 'multipleChoice' ? 'block' : 'none';
  });
  
  // Question form submission
  DOM.questionForm.addEventListener('submit', handleQuestionFormSubmit);
}

/**
 * Update all text elements with translations
 */
function updateLanguage() {
  // Update title
  document.title = translations[STATE.currentLanguage].adminTitle;
  
  // Update heading
  document.querySelector('h1').textContent = translations[STATE.currentLanguage].adminTitle;
  
  // Update language toggle
  document.querySelector('.language-toggle label').textContent = 
    STATE.currentLanguage === 'en' ? 'Language:' : 'Idioma:';
  
  // Update tabs
  DOM.tabs[0].textContent = translations[STATE.currentLanguage].questionsTab;
  DOM.tabs[1].textContent = translations[STATE.currentLanguage].responsesTab;
  DOM.tabs[2].textContent = translations[STATE.currentLanguage].analyticsTab;
  
  // Update questions tab
  document.querySelector('#questions-tab h2:first-child').textContent = 
    translations[STATE.currentLanguage].createQuestion;
  
  document.querySelector('label[for="question-text"]').textContent = 
    translations[STATE.currentLanguage].questionText + ': ';
  
  const questionTypeLabel = DOM.questionType.previousElementSibling;
  questionTypeLabel.textContent = translations[STATE.currentLanguage].questionType + ': ';
  
  const questionTypeOptions = document.querySelectorAll('#question-type option');
  questionTypeOptions[0].textContent = translations[STATE.currentLanguage].textResponse;
  questionTypeOptions[1].textContent = translations[STATE.currentLanguage].multipleChoice;
  
  document.querySelector('#options-container h3').textContent = 
    translations[STATE.currentLanguage].optionsTitle;
  
  DOM.optionInputs.forEach((input, index) => {
    input.placeholder = `${translations[STATE.currentLanguage].option} ${index + 1}`;
  });
  
  document.querySelector('label[for="is-active"]').textContent = 
    translations[STATE.currentLanguage].active;
  
  document.querySelector('#question-form button').textContent = 
    translations[STATE.currentLanguage].submit;
  
  document.querySelector('#questions-tab h2:last-of-type').textContent = 
    translations[STATE.currentLanguage].existingQuestions;
  
  // Update responses tab
  document.querySelector('#responses-tab h2').textContent = 
    translations[STATE.currentLanguage].userResponses;
  
  // Update analytics tab
  document.querySelector('#analytics-tab h2').textContent = 
    translations[STATE.currentLanguage].questionCharts;
  
  // Reload data for the active tab
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  if (activeTab === 'questions') {
    loadQuestions();
  } else if (activeTab === 'responses') {
    loadUsers();
  } else if (activeTab === 'analytics') {
    loadQuestionCharts(); // Load multiple choice question charts
    loadSentimentCharts(); // Load sentiment analysis charts for text questions
  }
}

/**
 * Handle question form submission
 * @param {Event} e - Form submit event
 */
async function handleQuestionFormSubmit(e) {
  e.preventDefault();
  
  try {
    const questionText = DOM.questionText.value;
    const questionType = DOM.questionType.value;
    const isActive = DOM.isActive.checked;
    
    // Get options for multiple choice questions
    let options = [];
    if (questionType === 'multipleChoice') {
      DOM.optionInputs.forEach(input => {
        if (input.value.trim()) {
          options.push(input.value.trim());
        }
      });
      
      if (options.length === 0) {
        showError(translations[STATE.currentLanguage].multipleChoiceRequired || 'Multiple choice questions must have at least one option');
        return;
      }
    }
    
    const questionData = {
      text: questionText,
      questionType,
      options,
      isActive
    };
    
    let response;
    if (STATE.currentEditId) {
      // Update existing question
      response = await fetch(`${API_CONFIG.BASE_URL}/questions/${STATE.currentEditId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(questionData)
      });
    } else {
      // Create new question
      response = await fetch(`${API_CONFIG.BASE_URL}/questions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(questionData)
      });
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    // Reset form
    DOM.questionForm.reset();
    DOM.optionsContainer.style.display = 'none';
    
    // Reset edit state
    STATE.currentEditId = null;
    document.querySelector('#question-form button[type="submit"]').textContent = 
      translations[STATE.currentLanguage].submit;
    
    // Show success message
    showSuccess(STATE.currentEditId ? 
      translations[STATE.currentLanguage].questionUpdated : 
      translations[STATE.currentLanguage].questionCreated);
    
    // Reload questions
    loadQuestions();
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Load all questions from the API
 */
async function loadQuestions() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/questions?all=true`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      // If unauthorized, redirect to login
      if (response.status === 401) {
        localStorage.removeItem('auth_credentials');
        window.location.href = '/login.html';
        return;
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    renderQuestions(data.data || data);
  } catch (error) {
    showError(`Error loading questions: ${error.message}`);
  }
}

/**
 * Render questions in the admin panel
 * @param {Array} questions - Array of question objects
 */
function renderQuestions(questions) {
  DOM.questionsList.innerHTML = '';
  
  if (!questions || questions.length === 0) {
    DOM.questionsList.innerHTML = `<p>${translations[STATE.currentLanguage].noQuestionsMessage}</p>`;
    return;
  }
  
  questions.forEach(question => {
    const questionItem = document.createElement('div');
    questionItem.className = 'question-item';
    questionItem.dataset.id = question._id;
    
    let questionTypeDisplay = question.questionType === 'text' 
      ? translations[STATE.currentLanguage].textResponse 
      : translations[STATE.currentLanguage].multipleChoice;
    
    let optionsHtml = '';
    if (question.questionType === 'multipleChoice' && question.options && question.options.length > 0) {
      optionsHtml = `
        <div class="question-options">
          <p><strong>${translations[STATE.currentLanguage].options}:</strong></p>
          <ul>
            ${question.options.map(option => `<li>${option}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    questionItem.innerHTML = `
      <h3>${question.text}</h3>
      <p><strong>${translations[STATE.currentLanguage].type}:</strong> ${questionTypeDisplay}</p>
      <p><strong>${translations[STATE.currentLanguage].status}:</strong> ${question.isActive ? translations[STATE.currentLanguage].active : translations[STATE.currentLanguage].inactive}</p>
      ${optionsHtml}
      <div class="question-actions">
        <button class="edit-btn">${translations[STATE.currentLanguage].edit}</button>
        <button class="delete-btn">${translations[STATE.currentLanguage].delete}</button>
      </div>
    `;
    
    DOM.questionsList.appendChild(questionItem);
    
    // Add event listeners for edit and delete buttons
    const editBtn = questionItem.querySelector('.edit-btn');
    const deleteBtn = questionItem.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => {
      editQuestion(question);
    });
    
    deleteBtn.addEventListener('click', () => {
      if (confirm(translations[STATE.currentLanguage].confirmDelete || 'Are you sure you want to delete this question?')) {
        deleteQuestion(question._id);
      }
    });
  });
}

/**
 * Edit a question
 * @param {Object} question - Question object to edit
 */
function editQuestion(question) {
  STATE.currentEditId = question._id;
  
  // Fill the form with the question data
  DOM.questionText.value = question.text;
  
  // Set question type and trigger change event to show/hide options
  DOM.questionType.value = question.questionType;
  
  // Handle multiple choice options
  DOM.optionsContainer.style.display = 'none';
  
  // Clear existing option values first
  DOM.optionInputs.forEach(input => {
    input.value = '';
  });
  
  // Show options container if it's a multiple choice question
  if (question.questionType === 'multipleChoice') {
    DOM.optionsContainer.style.display = 'block';
    
    // Fill in the options
    if (question.options && question.options.length > 0) {
      question.options.forEach((option, index) => {
        if (index < DOM.optionInputs.length) {
          DOM.optionInputs[index].value = option;
        }
      });
    }
  }
  
  // Set active status
  DOM.isActive.checked = question.isActive;
  
  // Change the submit button text to "Update"
  const submitButton = document.querySelector('#question-form button[type="submit"]');
  submitButton.textContent = translations[STATE.currentLanguage].save || 'Save';
  
  // Scroll to the form
  DOM.questionForm.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Delete a question
 * @param {string} id - Question ID to delete
 */
async function deleteQuestion(id) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/questions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    showSuccess(translations[STATE.currentLanguage].questionDeleted || 'Question deleted successfully');
    loadQuestions();
  } catch (error) {
    showError(`Error deleting question: ${error.message}`);
  }
}

/**
 * Load all users who have submitted responses
 */
async function loadUsers() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/responses/users`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const users = await response.json();
    
    DOM.usersList.innerHTML = '';
    
    if (users.length === 0) {
      DOM.usersList.innerHTML = `<p>${translations[STATE.currentLanguage].noUsers || 'No users have submitted responses yet.'}</p>`;
      return;
    }
    
    users.forEach(user => {
      const userBadge = document.createElement('div');
      userBadge.className = 'user-badge';
      userBadge.textContent = user;
      userBadge.addEventListener('click', () => {
        // Remove active class from all badges
        document.querySelectorAll('.user-badge').forEach(badge => {
          badge.classList.remove('active');
        });
        
        // Add active class to clicked badge
        userBadge.classList.add('active');
        
        // Load responses for this user
        loadUserResponses(user);
      });
      
      DOM.usersList.appendChild(userBadge);
    });
  } catch (error) {
    showError(`Error loading users: ${error.message}`);
  }
}

/**
 * Load responses for a specific user
 * @param {string} userId - User ID to load responses for
 */
async function loadUserResponses(userId) {
  try {
    STATE.selectedUser = userId;
    
    // First, get all questions to have their types available
    const questionsResponse = await fetch(`${API_CONFIG.BASE_URL}/questions?all=true`, {
      headers: getAuthHeaders()
    });
    if (!questionsResponse.ok) {
      throw new Error(`HTTP error getting questions! status: ${questionsResponse.status}`);
    }
    
    const questionsResult = await questionsResponse.json();
    const questions = questionsResult.data || questionsResult;
    
    // Create a map of question IDs to their types
    const questionTypeMap = {};
    questions.forEach(question => {
      questionTypeMap[question._id] = {
        type: question.questionType,
        text: question.text,
        options: question.options || []
      };
    });
    
    // Now get the user's responses
    const response = await fetch(`${API_CONFIG.BASE_URL}/responses/user/${userId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error getting responses! status: ${response.status}`);
    }
    
    const userResponses = await response.json();
    console.log('User responses received:', userResponses);
    console.log('Question type map:', questionTypeMap);
    
    DOM.userResponses.innerHTML = '';
    
    if (!userResponses || userResponses.length === 0) {
      DOM.userResponses.innerHTML = `<p class="no-responses">${translations[STATE.currentLanguage].noResponses || 'This user has not submitted any responses.'}</p>`;
      return;
    }
    
    // Add user header
    const userHeader = document.createElement('h3');
    userHeader.className = 'user-responses-header';
    userHeader.textContent = `${translations[STATE.currentLanguage].responsesFrom || 'Responses from'}: ${userId}`;
    DOM.userResponses.appendChild(userHeader);
    
    // Add timestamp
    const timestamp = document.createElement('p');
    timestamp.className = 'response-timestamp';
    const latestResponse = new Date(Math.max(...userResponses.map(r => new Date(r.createdAt))));
    timestamp.textContent = `${translations[STATE.currentLanguage].lastSubmitted || 'Last submitted'}: ${latestResponse.toLocaleString()}`;
    DOM.userResponses.appendChild(timestamp);
    
    // Create responses container
    const responsesContainer = document.createElement('div');
    responsesContainer.className = 'responses-container';
    
    // Group responses by question
    const questionMap = new Map();
    
    userResponses.forEach(response => {
      // Get the question ID
      const questionId = response.questionId || (response.questionId && response.questionId._id);
      if (!questionId) return;
      
      // Get question info from our map or from the response
      const questionInfo = questionTypeMap[questionId] || {
        type: 'text',
        text: response.questionText || 'Unknown Question',
        options: []
      };
      
      if (!questionMap.has(questionId)) {
        questionMap.set(questionId, {
          questionText: questionInfo.text,
          questionType: questionInfo.type,
          options: questionInfo.options,
          responses: []
        });
      }
      
      // Determine the response content based on the actual question type
      let responseContent = '';
      if (questionInfo.type === 'multipleChoice') {
        responseContent = response.selectedOption || 'No option selected';
      } else {
        responseContent = response.responseText || 'No text provided';
      }
      
      questionMap.get(questionId).responses.push({
        responseText: responseContent,
        createdAt: response.createdAt
      });
    });
    
    // Create a card for each question with its responses
    questionMap.forEach((data, questionId) => {
      const questionCard = document.createElement('div');
      questionCard.className = 'question-response-card';
      questionCard.dataset.questionType = data.questionType;
      questionCard.dataset.questionId = questionId;
      
      // Question header
      const questionHeader = document.createElement('h4');
      questionHeader.className = 'question-header';
      questionHeader.textContent = data.questionText || 'Unknown Question';
      
      // Add question type badge
      const typeBadge = document.createElement('span');
      typeBadge.className = `question-type-badge ${data.questionType}`;
      typeBadge.textContent = data.questionType === 'multipleChoice' ? 'Multiple Choice' : 'Text';
      questionHeader.appendChild(typeBadge);
      
      questionCard.appendChild(questionHeader);
      
      // If it's a multiple choice question, show the options
      if (data.questionType === 'multipleChoice' && data.options && data.options.length > 0) {
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'question-options';
        optionsDiv.innerHTML = `<p class="options-label">${translations[STATE.currentLanguage].availableOptions || 'Available options'}:</p>`;
        
        const optionsList = document.createElement('ul');
        data.options.forEach(option => {
          const optionItem = document.createElement('li');
          optionItem.textContent = option;
          optionsList.appendChild(optionItem);
        });
        
        optionsDiv.appendChild(optionsList);
        questionCard.appendChild(optionsDiv);
      }
      
      // Sort responses by date (newest first)
      data.responses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Add each response
      data.responses.forEach((responseData, index) => {
        const responseElement = document.createElement('div');
        responseElement.className = 'response-item';
        
        const responseDate = new Date(responseData.createdAt);
        const formattedDate = responseDate.toLocaleString();
        
        responseElement.innerHTML = `
          <div class="response-content">
            <p class="response-text">${responseData.responseText}</p>
            <p class="response-date">${formattedDate}</p>
          </div>
        `;
        
        // Add a separator between responses except for the last one
        if (index < data.responses.length - 1) {
          const separator = document.createElement('hr');
          separator.className = 'response-separator';
          responseElement.appendChild(separator);
        }
        
        questionCard.appendChild(responseElement);
      });
      
      responsesContainer.appendChild(questionCard);
    });
    
    DOM.userResponses.appendChild(responsesContainer);
  } catch (error) {
    console.error('Error loading user responses:', error);
    showError(`Error loading responses: ${error.message}`);
  }
}

/**
 * Load all responses for analytics
 */
async function loadAllResponses() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/responses`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    STATE.allResponses = await response.json();
  } catch (error) {
    showError(`Error loading responses for analytics: ${error.message}`);
  }
}

/**
 * Load all questions and responses for charts
 */
async function loadQuestionCharts() {
  try {
    // Create a container for question charts if it doesn't exist
    let questionChartsContainer = document.getElementById('question-charts-container');
    if (!questionChartsContainer) {
      questionChartsContainer = document.createElement('div');
      questionChartsContainer.id = 'question-charts-container';
      questionChartsContainer.className = 'charts-container';
      
      // Add a title
      const title = document.createElement('h3');
      title.textContent = 'Multiple Choice Question Results';
      questionChartsContainer.appendChild(title);
      
      // Add the container to the analytics tab
      const analyticsTab = document.getElementById('analytics-tab');
      analyticsTab.appendChild(questionChartsContainer);
    } else {
      // Clear existing charts
      questionChartsContainer.innerHTML = '<h3>Multiple Choice Question Results</h3>';
    }
    
    // Fetch all questions if not already loaded
    if (!STATE.allQuestions || !Array.isArray(STATE.allQuestions) || STATE.allQuestions.length === 0) {
      const questionsResponse = await fetch(`${API_CONFIG.BASE_URL}/questions?all=true`, {
        headers: getAuthHeaders()
      });
      
      if (!questionsResponse.ok) {
        throw new Error(`HTTP error! status: ${questionsResponse.status}`);
      }
      
      const data = await questionsResponse.json();
      
      // Ensure we have an array
      STATE.allQuestions = Array.isArray(data) ? data : [];
      
      console.log('Loaded questions:', STATE.allQuestions);
    }
    
    // Fetch all responses if not already loaded
    if (!STATE.allResponses || !Array.isArray(STATE.allResponses) || STATE.allResponses.length === 0) {
      const responsesResponse = await fetch(`${API_CONFIG.BASE_URL}/responses`, {
        headers: getAuthHeaders()
      });
      
      if (!responsesResponse.ok) {
        throw new Error(`HTTP error! status: ${responsesResponse.status}`);
      }
      
      const data = await responsesResponse.json();
      
      // Ensure we have an array
      STATE.allResponses = Array.isArray(data) ? data : [];
      
      console.log('Loaded responses:', STATE.allResponses);
    }
    
    // Ensure we have arrays before filtering
    if (!Array.isArray(STATE.allQuestions)) {
      console.error('STATE.allQuestions is not an array:', STATE.allQuestions);
      STATE.allQuestions = [];
    }
    
    // Filter for multiple choice questions only
    const multipleChoiceQuestions = STATE.allQuestions.filter(q => 
      q && q.questionType === 'multipleChoice' && q.options && Array.isArray(q.options) && q.options.length > 0
    );
    
    console.log('Multiple choice questions:', multipleChoiceQuestions);
    
    if (multipleChoiceQuestions.length === 0) {
      questionChartsContainer.innerHTML += '<p>No multiple choice questions found.</p>';
      return;
    }
    
    // Create a chart for each multiple choice question
    multipleChoiceQuestions.forEach(question => {
      // Create a container for this question's chart
      const questionChartContainer = document.createElement('div');
      questionChartContainer.className = 'question-chart';
      questionChartContainer.style.marginBottom = '30px';
      
      // Add question text
      const questionTitle = document.createElement('h4');
      questionTitle.textContent = question.text;
      questionChartContainer.appendChild(questionTitle);
      
      // Create canvas for the chart
      const canvas = document.createElement('canvas');
      canvas.id = `chart-question-${question._id}`;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.width = 400;
      canvas.height = 300;
      questionChartContainer.appendChild(canvas);
      
      // Add the question chart to the container
      questionChartsContainer.appendChild(questionChartContainer);
      
      // Create the chart
      createQuestionChart(question, canvas);
    });
    
  } catch (error) {
    console.error('Error in loadQuestionCharts:', error);
    showError(`Error loading question charts: ${error.message}`);
  }
}

/**
 * Load sentiment analysis charts for text questions
 */
async function loadSentimentCharts() {
  try {
    // Create a container for sentiment charts if it doesn't exist
    let sentimentChartsContainer = document.getElementById('sentiment-charts-container');
    if (!sentimentChartsContainer) {
      sentimentChartsContainer = document.createElement('div');
      sentimentChartsContainer.id = 'sentiment-charts-container';
      sentimentChartsContainer.className = 'charts-container';
      
      // Add a title
      const title = document.createElement('h3');
      title.textContent = 'Sentiment Analysis for Open-Ended Questions';
      sentimentChartsContainer.appendChild(title);
      
      // Add the container to the analytics tab
      const analyticsTab = document.getElementById('analytics-tab');
      analyticsTab.appendChild(sentimentChartsContainer);
    } else {
      // Clear existing charts
      sentimentChartsContainer.innerHTML = '<h3>Sentiment Analysis for Open-Ended Questions</h3>';
    }
    
    // Fetch all questions if not already loaded
    if (!STATE.allQuestions || !Array.isArray(STATE.allQuestions) || STATE.allQuestions.length === 0) {
      const questionsResponse = await fetch(`${API_CONFIG.BASE_URL}/questions?all=true`, {
        headers: getAuthHeaders()
      });
      
      if (!questionsResponse.ok) {
        throw new Error(`HTTP error! status: ${questionsResponse.status}`);
      }
      
      const data = await questionsResponse.json();
      
      // Ensure we have an array
      STATE.allQuestions = Array.isArray(data) ? data : [];
      
      console.log('Loaded questions:', STATE.allQuestions);
    }
    
    // Fetch all responses if not already loaded
    if (!STATE.allResponses || !Array.isArray(STATE.allResponses) || STATE.allResponses.length === 0) {
      const responsesResponse = await fetch(`${API_CONFIG.BASE_URL}/responses`, {
        headers: getAuthHeaders()
      });
      
      if (!responsesResponse.ok) {
        throw new Error(`HTTP error! status: ${responsesResponse.status}`);
      }
      
      const data = await responsesResponse.json();
      
      // Ensure we have an array
      STATE.allResponses = Array.isArray(data) ? data : [];
      
      console.log('Loaded responses:', STATE.allResponses);
    }
    
    // Ensure we have arrays before filtering
    if (!Array.isArray(STATE.allQuestions)) {
      console.error('STATE.allQuestions is not an array:', STATE.allQuestions);
      STATE.allQuestions = [];
    }
    
    // Filter for text questions only
    const textQuestions = STATE.allQuestions.filter(q => 
      q && (q.questionType === 'text' || !q.questionType)
    );
    
    console.log('Text questions:', textQuestions);
    
    if (textQuestions.length === 0) {
      sentimentChartsContainer.innerHTML += '<p>No open-ended questions found.</p>';
      return;
    }
    
    // Create a sentiment chart for each text question
    textQuestions.forEach(question => {
      // Create a container for this question's sentiment analysis
      const questionContainer = document.createElement('div');
      questionContainer.className = 'sentiment-analysis';
      questionContainer.style.marginBottom = '40px';
      
      // Add question text
      const questionTitle = document.createElement('h4');
      questionTitle.textContent = question.text;
      questionContainer.appendChild(questionTitle);
      
      // Get responses for this question
      const questionResponses = STATE.allResponses.filter(response => 
        response && response.questionId === question._id && response.responseText
      );
      
      if (questionResponses.length === 0) {
        const noData = document.createElement('p');
        noData.textContent = 'No responses yet for this question.';
        questionContainer.appendChild(noData);
        sentimentChartsContainer.appendChild(questionContainer);
        return;
      }
      
      // Create sentiment summary section
      const summaryContainer = document.createElement('div');
      summaryContainer.className = 'sentiment-summary';
      summaryContainer.style.display = 'flex';
      summaryContainer.style.justifyContent = 'space-between';
      summaryContainer.style.marginBottom = '20px';
      
      // Analyze sentiment for each response
      const sentiments = questionResponses.map(response => {
        return SentimentAnalyzer.analyze(response.responseText);
      });
      
      // Calculate average sentiment
      const totalScore = sentiments.reduce((sum, sentiment) => sum + sentiment.score, 0);
      const averageSentiment = sentiments.length > 0 ? totalScore / sentiments.length : 0;
      
      // Count sentiment categories
      const sentimentCounts = {
        'very positive': 0,
        'positive': 0,
        'neutral': 0,
        'negative': 0,
        'very negative': 0
      };
      
      sentiments.forEach(sentiment => {
        sentimentCounts[sentiment.label]++;
      });
      
      // Create average sentiment display
      const averageContainer = document.createElement('div');
      averageContainer.className = 'average-sentiment';
      averageContainer.style.textAlign = 'center';
      averageContainer.style.padding = '15px';
      averageContainer.style.borderRadius = '5px';
      averageContainer.style.backgroundColor = '#f5f5f5';
      
      const averageLabel = document.createElement('h5');
      averageLabel.textContent = 'Average Sentiment';
      averageLabel.style.margin = '0 0 10px 0';
      
      const averageScore = document.createElement('div');
      averageScore.className = 'sentiment-score';
      averageScore.textContent = SentimentAnalyzer.getLabel(averageSentiment);
      averageScore.style.fontSize = '18px';
      averageScore.style.fontWeight = 'bold';
      averageScore.style.color = SentimentAnalyzer.getColor(averageSentiment);
      
      const responseCount = document.createElement('div');
      responseCount.textContent = `${questionResponses.length} responses`;
      responseCount.style.fontSize = '14px';
      responseCount.style.marginTop = '5px';
      
      averageContainer.appendChild(averageLabel);
      averageContainer.appendChild(averageScore);
      averageContainer.appendChild(responseCount);
      
      summaryContainer.appendChild(averageContainer);
      
      // Create sentiment distribution display
      const distributionContainer = document.createElement('div');
      distributionContainer.className = 'sentiment-distribution';
      distributionContainer.style.flex = '1';
      distributionContainer.style.marginLeft = '20px';
      distributionContainer.style.padding = '15px';
      distributionContainer.style.borderRadius = '5px';
      distributionContainer.style.backgroundColor = '#f5f5f5';
      
      const distributionLabel = document.createElement('h5');
      distributionLabel.textContent = 'Sentiment Distribution';
      distributionLabel.style.margin = '0 0 10px 0';
      
      const distributionBars = document.createElement('div');
      distributionBars.className = 'distribution-bars';
      
      // Create bars for each sentiment category
      const categories = ['very positive', 'positive', 'neutral', 'negative', 'very negative'];
      const colors = ['#4CAF50', '#8BC34A', '#9E9E9E', '#FF9800', '#F44336'];
      
      categories.forEach((category, index) => {
        const count = sentimentCounts[category];
        const percentage = questionResponses.length > 0 ? (count / questionResponses.length) * 100 : 0;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';
        barContainer.style.display = 'flex';
        barContainer.style.alignItems = 'center';
        barContainer.style.marginBottom = '5px';
        
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        label.style.width = '100px';
        label.style.fontSize = '12px';
        
        const barWrapper = document.createElement('div');
        barWrapper.className = 'bar-wrapper';
        barWrapper.style.flex = '1';
        barWrapper.style.height = '15px';
        barWrapper.style.backgroundColor = '#e0e0e0';
        barWrapper.style.borderRadius = '3px';
        barWrapper.style.overflow = 'hidden';
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.width = `${percentage}%`;
        bar.style.height = '100%';
        bar.style.backgroundColor = colors[index];
        
        const countLabel = document.createElement('div');
        countLabel.className = 'count-label';
        countLabel.textContent = `${count} (${percentage.toFixed(1)}%)`;
        countLabel.style.marginLeft = '10px';
        countLabel.style.fontSize = '12px';
        countLabel.style.width = '70px';
        
        barWrapper.appendChild(bar);
        barContainer.appendChild(label);
        barContainer.appendChild(barWrapper);
        barContainer.appendChild(countLabel);
        
        distributionBars.appendChild(barContainer);
      });
      
      distributionContainer.appendChild(distributionLabel);
      distributionContainer.appendChild(distributionBars);
      
      summaryContainer.appendChild(distributionContainer);
      
      questionContainer.appendChild(summaryContainer);
      
      // Create canvas for the sentiment chart
      const chartContainer = document.createElement('div');
      chartContainer.className = 'sentiment-chart-container';
      chartContainer.style.marginTop = '20px';
      
      const canvas = document.createElement('canvas');
      canvas.id = `sentiment-chart-${question._id}`;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.width = 600;
      canvas.height = 300;
      
      chartContainer.appendChild(canvas);
      questionContainer.appendChild(chartContainer);
      
      // Add the question container to the sentiment charts container
      sentimentChartsContainer.appendChild(questionContainer);
      
      // Create the sentiment chart
      createSentimentChart(question, sentiments, canvas);
      
      // Add sample responses section
      const samplesContainer = document.createElement('div');
      samplesContainer.className = 'sample-responses';
      samplesContainer.style.marginTop = '20px';
      
      const samplesTitle = document.createElement('h5');
      samplesTitle.textContent = 'Sample Responses';
      samplesTitle.style.marginBottom = '10px';
      
      samplesContainer.appendChild(samplesTitle);
      
      // Sort responses by sentiment score
      const sortedResponses = [...questionResponses].sort((a, b) => {
        const sentimentA = SentimentAnalyzer.analyze(a.responseText);
        const sentimentB = SentimentAnalyzer.analyze(b.responseText);
        return sentimentB.score - sentimentA.score; // Most positive first
      });
      
      // Get a sample of responses (most positive, most negative, and some in between)
      const samplesToShow = Math.min(5, sortedResponses.length);
      const sampleStep = sortedResponses.length > samplesToShow ? 
        Math.floor(sortedResponses.length / samplesToShow) : 1;
      
      const sampleResponses = [];
      for (let i = 0; i < samplesToShow; i++) {
        const index = Math.min(i * sampleStep, sortedResponses.length - 1);
        sampleResponses.push(sortedResponses[index]);
      }
      
      // Create a table for sample responses
      const table = document.createElement('table');
      table.className = 'sample-responses-table';
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      
      // Create table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      const responseHeader = document.createElement('th');
      responseHeader.textContent = 'Response';
      responseHeader.style.textAlign = 'left';
      responseHeader.style.padding = '8px';
      responseHeader.style.borderBottom = '1px solid #ddd';
      
      const sentimentHeader = document.createElement('th');
      sentimentHeader.textContent = 'Sentiment';
      sentimentHeader.style.textAlign = 'center';
      sentimentHeader.style.padding = '8px';
      sentimentHeader.style.borderBottom = '1px solid #ddd';
      sentimentHeader.style.width = '120px';
      
      headerRow.appendChild(responseHeader);
      headerRow.appendChild(sentimentHeader);
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Create table body
      const tbody = document.createElement('tbody');
      
      sampleResponses.forEach(response => {
        const sentiment = SentimentAnalyzer.analyze(response.responseText);
        
        const row = document.createElement('tr');
        
        const responseCell = document.createElement('td');
        responseCell.textContent = response.responseText;
        responseCell.style.padding = '8px';
        responseCell.style.borderBottom = '1px solid #ddd';
        
        const sentimentCell = document.createElement('td');
        sentimentCell.textContent = SentimentAnalyzer.getLabel(sentiment.score);
        sentimentCell.style.textAlign = 'center';
        sentimentCell.style.padding = '8px';
        sentimentCell.style.borderBottom = '1px solid #ddd';
        sentimentCell.style.color = SentimentAnalyzer.getColor(sentiment.score);
        sentimentCell.style.fontWeight = 'bold';
        
        row.appendChild(responseCell);
        row.appendChild(sentimentCell);
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      samplesContainer.appendChild(table);
      
      questionContainer.appendChild(samplesContainer);
    });
    
  } catch (error) {
    console.error('Error in loadSentimentCharts:', error);
    showError(`Error loading sentiment charts: ${error.message}`);
  }
}

/**
 * Create a chart for a specific multiple choice question
 * @param {Object} question - The question object
 * @param {HTMLCanvasElement} canvas - The canvas element to draw the chart on
 */
function createQuestionChart(question, canvas) {
  try {
    // Count responses for each option
    const optionCounts = {};
    
    // Ensure options is an array
    const options = Array.isArray(question.options) ? question.options : [];
    
    options.forEach(option => {
      optionCounts[option] = 0;
    });
    
    // Ensure allResponses is an array
    const responses = Array.isArray(STATE.allResponses) ? STATE.allResponses : [];
    
    // Count the responses
    responses.forEach(response => {
      if (response && response.questionId === question._id && response.selectedOption) {
        if (optionCounts[response.selectedOption] !== undefined) {
          optionCounts[response.selectedOption]++;
        }
      }
    });
    
    console.log(`Counts for question ${question.text}:`, optionCounts);
    
    // Prepare data for the chart
    const ctx = canvas.getContext('2d');
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Get options and counts
    const optionLabels = Object.keys(optionCounts);
    const counts = Object.values(optionCounts);
    const maxCount = Math.max(...counts, 1); // Ensure we don't divide by zero
    
    // Draw bars
    const barWidth = chartWidth / optionLabels.length;
    
    optionLabels.forEach((option, index) => {
      const count = optionCounts[option];
      const barHeight = (count / maxCount) * chartHeight;
      const x = padding + index * barWidth;
      const y = canvas.height - padding - barHeight;
      
      // Draw bar with different colors
      const colors = ['#4CAF50', '#2196F3', '#FF5722'];
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth - 10, barHeight);
      
      // Draw option label
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      // Truncate long option text
      let displayOption = option;
      if (displayOption.length > 15) {
        displayOption = displayOption.substring(0, 12) + '...';
      }
      
      ctx.fillText(displayOption, x + barWidth / 2, canvas.height - padding + 15);
      
      // Draw count on top of bar
      ctx.fillText(count, x + barWidth / 2, y - 5);
    });
    
    // Draw y-axis labels
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    
    // Calculate appropriate y-axis intervals
    const yAxisSteps = 5;
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = Math.round((i / yAxisSteps) * maxCount);
      const y = canvas.height - padding - (i / yAxisSteps) * chartHeight;
      ctx.fillText(value, padding - 5, y + 3);
    }
    
    // Add title
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Response Distribution', canvas.width / 2, 20);
  } catch (error) {
    console.error('Error in createQuestionChart:', error);
    // Draw error message on canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FF0000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Error rendering chart', canvas.width / 2, canvas.height / 2);
  }
}

/**
 * Create a sentiment chart for a text question
 * @param {Object} question - The question object
 * @param {Array} sentiments - Array of sentiment analysis results
 * @param {HTMLCanvasElement} canvas - The canvas element to draw the chart on
 */
function createSentimentChart(question, sentiments, canvas) {
  try {
    if (!sentiments || sentiments.length === 0) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#9E9E9E';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data available for sentiment analysis', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Group sentiments by category
    const categories = ['very positive', 'positive', 'neutral', 'negative', 'very negative'];
    const colors = ['#4CAF50', '#8BC34A', '#9E9E9E', '#FF9800', '#F44336'];
    
    const sentimentCounts = categories.map(category => {
      return sentiments.filter(sentiment => sentiment.label === category).length;
    });
    
    // Draw bars
    const barWidth = chartWidth / categories.length;
    const maxCount = Math.max(...sentimentCounts, 1);
    
    categories.forEach((category, index) => {
      const count = sentimentCounts[index];
      const barHeight = (count / maxCount) * chartHeight;
      const x = padding + index * barWidth;
      const y = canvas.height - padding - barHeight;
      
      // Draw bar
      ctx.fillStyle = colors[index];
      ctx.fillRect(x, y, barWidth - 10, barHeight);
      
      // Draw category label
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      // Format the category label
      let displayCategory = category.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      ctx.fillText(displayCategory, x + barWidth / 2, canvas.height - padding + 15);
      
      // Draw count on top of bar
      ctx.fillText(count, x + barWidth / 2, y - 5);
    });
    
    // Draw y-axis labels
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    
    // Calculate appropriate y-axis intervals
    const yAxisSteps = 5;
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = Math.round((i / yAxisSteps) * maxCount);
      const y = canvas.height - padding - (i / yAxisSteps) * chartHeight;
      ctx.fillText(value, padding - 5, y + 3);
    }
    
    // Add title
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Sentiment Distribution', canvas.width / 2, 20);
  } catch (error) {
    console.error('Error in createSentimentChart:', error);
    // Draw error message on canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FF0000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Error rendering sentiment chart', canvas.width / 2, canvas.height / 2);
  }
}

/**
 * Show a success message
 * @param {string} message - Success message to display
 */
function showSuccess(message) {
  // Check if a message container already exists
  let messageContainer = document.querySelector('.message-container');
  
  if (!messageContainer) {
    // Create a new message container
    messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    document.body.appendChild(messageContainer);
  }
  
  // Create success message element
  const successMessage = document.createElement('div');
  successMessage.className = 'message success';
  successMessage.textContent = message;
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'close-message';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    successMessage.remove();
  });
  
  successMessage.appendChild(closeButton);
  messageContainer.appendChild(successMessage);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    successMessage.remove();
  }, 5000);
}

/**
 * Show an error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  // Check if a message container already exists
  let messageContainer = document.querySelector('.message-container');
  
  if (!messageContainer) {
    // Create a new message container
    messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    document.body.appendChild(messageContainer);
  }
  
  // Create error message element
  const errorMessage = document.createElement('div');
  errorMessage.className = 'message error';
  errorMessage.textContent = message;
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'close-message';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    errorMessage.remove();
  });
  
  errorMessage.appendChild(closeButton);
  messageContainer.appendChild(errorMessage);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorMessage.remove();
  }, 5000);
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
