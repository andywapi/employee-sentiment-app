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
  newKeyword: document.getElementById('new-keyword'),
  addKeywordBtn: document.getElementById('add-keyword'),
  keywordsList: document.getElementById('keywords-list'),
  chartContainer: document.getElementById('chart-container')
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
        analyzeKeywords();
      }
    });
  });
  
  // Question type change
  DOM.questionType.addEventListener('change', function() {
    DOM.optionsContainer.style.display = this.value === 'multipleChoice' ? 'block' : 'none';
  });
  
  // Question form submission
  DOM.questionForm.addEventListener('submit', handleQuestionFormSubmit);
  
  // Add keyword button
  DOM.addKeywordBtn.addEventListener('click', () => {
    const keyword = DOM.newKeyword.value.trim().toLowerCase();
    if (keyword) {
      addKeyword(keyword);
      DOM.newKeyword.value = '';
      analyzeKeywords();
    }
  });
  
  // Enter key for adding keywords
  DOM.newKeyword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      DOM.addKeywordBtn.click();
    }
  });
  
  // Remove keyword buttons (delegated event)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-keyword')) {
      const keywordBadge = e.target.closest('.keyword-badge');
      const keyword = keywordBadge.dataset.keyword;
      removeKeyword(keyword);
    }
  });
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
    translations[STATE.currentLanguage].paretoAnalysis;
  document.querySelector('#analytics-tab > p').textContent = 
    translations[STATE.currentLanguage].analyzeKeywords;
  
  DOM.newKeyword.placeholder = 
    translations[STATE.currentLanguage].newKeyword;
  DOM.addKeywordBtn.textContent = 
    translations[STATE.currentLanguage].addKeyword;
  
  document.querySelector('#keyword-analysis h3').textContent = 
    translations[STATE.currentLanguage].paretoChart;
  
  // Reload data for the active tab
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  if (activeTab === 'questions') {
    loadQuestions();
  } else if (activeTab === 'responses') {
    loadUsers();
  } else if (activeTab === 'analytics') {
    analyzeKeywords();
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
    analyzeKeywords();
  } catch (error) {
    showError(`Error loading responses for analytics: ${error.message}`);
  }
}

/**
 * Render Pareto chart from keyword data
 * @param {Array} keywordData - Array of keyword data objects
 */
function renderParetoChart(keywordData) {
  if (!keywordData || keywordData.length === 0) {
    DOM.chartContainer.innerHTML = '<p class="no-data">No data available for analysis</p>';
    return;
  }
  
  // Clear previous chart
  DOM.chartContainer.innerHTML = '';
  
  // Create canvas for chart
  const canvas = document.createElement('canvas');
  canvas.width = DOM.chartContainer.offsetWidth;
  canvas.height = 400;
  DOM.chartContainer.appendChild(canvas);
  
  // Display the Pareto chart
  displayParetoChart(keywordData);
}

/**
 * Add a keyword to the list
 * @param {string} keyword - Keyword to add
 */
function addKeyword(keyword) {
  // Check if keyword already exists
  const existingKeyword = document.querySelector(`.keyword-badge[data-keyword="${keyword}"]`);
  if (existingKeyword) {
    return;
  }
  
  const keywordBadge = document.createElement('div');
  keywordBadge.className = 'keyword-badge';
  keywordBadge.dataset.keyword = keyword;
  keywordBadge.textContent = keyword + ' ';
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-keyword';
  removeBtn.textContent = '×';
  
  keywordBadge.appendChild(removeBtn);
  DOM.keywordsList.appendChild(keywordBadge);
}

/**
 * Remove a keyword from the list
 * @param {string} keyword - Keyword to remove
 */
function removeKeyword(keyword) {
  const keywordBadge = document.querySelector(`.keyword-badge[data-keyword="${keyword}"]`);
  if (keywordBadge) {
    keywordBadge.remove();
    analyzeKeywords();
  }
}

/**
 * Analyze keywords in responses
 */
function analyzeKeywords() {
  if (!STATE.allResponses.length) return;
  
  const keywords = Array.from(DOM.keywordsList.querySelectorAll('.keyword-badge')).map(
    badge => badge.getAttribute('data-keyword')
  );
  
  const keywordCounts = {};
  keywords.forEach(keyword => {
    keywordCounts[keyword] = 0;
  });
  
  // Count occurrences
  STATE.allResponses.forEach(response => {
    const text = (response.responseText || response.selectedOption || '').toLowerCase();
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywordCounts[keyword]++;
      }
    });
  });
  
  // Sort by count
  const sortedKeywords = Object.keys(keywordCounts).sort((a, b) => keywordCounts[b] - keywordCounts[a]);
  
  // Calculate total and cumulative percentages
  const total = Object.values(keywordCounts).reduce((sum, count) => sum + count, 0);
  let cumulative = 0;
  const chartData = sortedKeywords.map(keyword => {
    const count = keywordCounts[keyword];
    const percentage = total > 0 ? (count / total) * 100 : 0;
    cumulative += percentage;
    return {
      keyword,
      count,
      percentage,
      cumulative
    };
  });
  
  // Display chart
  displayParetoChart(chartData);
}

/**
 * Display Pareto chart
 * @param {Array} data - Chart data
 */
function displayParetoChart(data) {
  DOM.chartContainer.innerHTML = '';
  
  if (data.length === 0) {
    DOM.chartContainer.textContent = translations[STATE.currentLanguage].noData || 'No data available';
    return;
  }
  
  // Create chart elements
  const canvas = document.createElement('canvas');
  canvas.id = 'pareto-chart';
  canvas.width = DOM.chartContainer.offsetWidth;
  canvas.height = 400;
  DOM.chartContainer.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  
  // Draw axes
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();
  
  // Draw bars and line
  const barWidth = chartWidth / data.length;
  const maxCount = Math.max(...data.map(item => item.count));
  
  // Draw bars
  data.forEach((item, index) => {
    const barHeight = (item.count / maxCount) * chartHeight;
    const x = padding + index * barWidth;
    const y = canvas.height - padding - barHeight;
    
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(x, y, barWidth - 5, barHeight);
    
    // Draw keyword label
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(item.keyword, x + barWidth / 2, canvas.height - padding + 15);
    
    // Draw count label
    ctx.fillText(item.count, x + barWidth / 2, y - 5);
  });
  
  // Draw cumulative line
  ctx.beginPath();
  ctx.strokeStyle = '#FF5722';
  ctx.lineWidth = 2;
  
  data.forEach((item, index) => {
    const x = padding + index * barWidth + barWidth / 2;
    const y = canvas.height - padding - (item.cumulative / 100) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Draw y-axis labels
  ctx.fillStyle = '#000';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 10; i++) {
    const y = canvas.height - padding - (i / 10) * chartHeight;
    ctx.fillText(`${i * 10}%`, padding - 5, y + 3);
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
