/**
 * Employee Sentiment App - User Survey
 * 
 * This file contains the JavaScript code for the user survey functionality,
 * including loading questions and submitting responses.
 */

document.addEventListener('DOMContentLoaded', () => {
  // API configuration
  const API_CONFIG = {
    BASE_URL: window.location.origin + '/api'
  };
  
  // State management
  const STATE = {
    currentLanguage: localStorage.getItem('language') || 'en'
  };
  
  // DOM Elements
  const DOM = {
    languageSelect: document.getElementById('language-select'),
    form: document.getElementById('survey-form'),
    questionsDiv: document.getElementById('questions'),
    submitButton: document.querySelector('button[type="submit"]')
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
    
    // Load questions
    loadQuestions();
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
    
    // Form submission
    DOM.form.addEventListener('submit', handleFormSubmit);
  }
  
  /**
   * Update all text elements with translations
   */
  function updateLanguage() {
    // Update title
    document.title = translations[STATE.currentLanguage].appTitle;
    
    // Update heading
    document.querySelector('h1').textContent = translations[STATE.currentLanguage].surveyTitle;
    
    // Update language toggle
    document.querySelector('.language-toggle label').textContent = 
      STATE.currentLanguage === 'en' ? 'Language:' : 'Idioma:';
    
    // Update status message
    const statusP = document.querySelector('.status-message p');
    if (statusP) {
      statusP.innerHTML = `<strong>${STATE.currentLanguage === 'en' ? 'Status' : 'Estado'}:</strong> ${translations[STATE.currentLanguage].statusMessage || 'Frontend successfully loaded!'}`;
    }
    
    // Update admin panel link
    const adminLink = document.querySelector('a[href="/admin.html"]');
    if (adminLink) {
      adminLink.textContent = translations[STATE.currentLanguage].adminPanel;
    }
    
    // Update form elements
    const userIdLabel = document.querySelector('label[for="userId"]');
    if (userIdLabel) {
      userIdLabel.textContent = translations[STATE.currentLanguage].userId + ':';
    }
    
    // Update submit button
    DOM.submitButton.textContent = translations[STATE.currentLanguage].submit;
    
    // Reload questions to update their text
    loadQuestions();
  }
  
  /**
   * Load active questions from the API
   */
  async function loadQuestions() {
    try {
      showLoading(DOM.questionsDiv);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/questions`, {
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
      
      const result = await response.json();
      const questions = result.data || result; // Handle both formats
      
      if (!questions || questions.length === 0) {
        DOM.questionsDiv.innerHTML = `<p class="no-questions">${translations[STATE.currentLanguage].noQuestionsAvailable || 'No questions available at this time.'}</p>`;
        return;
      }
      
      renderQuestions(questions);
    } catch (error) {
      console.error('Error loading questions:', error);
      DOM.questionsDiv.innerHTML = `<p class="error">${translations[STATE.currentLanguage].errorLoadingQuestions || 'Error loading questions. Please try again later.'}</p>`;
    }
  }
  
  /**
   * Render questions in the survey form
   * @param {Array} questions - Array of question objects
   */
  function renderQuestions(questions) {
    DOM.questionsDiv.innerHTML = ''; // Clear existing questions
    
    questions.forEach(question => {
      const questionDiv = document.createElement('div');
      questionDiv.className = 'question';
      questionDiv.dataset.id = question._id;
      questionDiv.dataset.type = question.questionType;
      
      // Create question label
      const questionLabel = document.createElement('p');
      questionLabel.className = 'question-label';
      questionLabel.textContent = question.text;
      questionDiv.appendChild(questionLabel);
      
      // Create input based on question type
      if (question.questionType === 'text') {
        const textarea = document.createElement('textarea');
        textarea.name = question._id;
        textarea.maxLength = 100;
        textarea.required = true;
        textarea.placeholder = STATE.currentLanguage === 'en' ? 
          "Enter your response (max 100 characters)" : 
          "Ingrese su respuesta (máximo 100 caracteres)";
        questionDiv.appendChild(textarea);
      } else if (question.questionType === 'multipleChoice' && question.options && question.options.length > 0) {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        
        question.options.forEach(option => {
          const optionLabel = document.createElement('label');
          optionLabel.className = 'radio-label';
          
          const radioInput = document.createElement('input');
          radioInput.type = 'radio';
          radioInput.name = question._id;
          radioInput.value = option;
          radioInput.required = true;
          
          optionLabel.appendChild(radioInput);
          optionLabel.append(` ${option}`);
          optionsContainer.appendChild(optionLabel);
        });
        
        questionDiv.appendChild(optionsContainer);
      }
      
      DOM.questionsDiv.appendChild(questionDiv);
    });
  }
  
  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
      // Disable submit button to prevent multiple submissions
      DOM.submitButton.disabled = true;
      DOM.submitButton.textContent = STATE.currentLanguage === 'en' ? 'Submitting...' : 'Enviando...';
      
      const formData = new FormData(DOM.form);
      const userId = formData.get('userId');
      
      if (!userId) {
        showError(translations[STATE.currentLanguage].userIdRequired || 'User ID is required');
        return;
      }
      
      const promises = [];
      
      // Collect all responses
      formData.forEach((value, key) => {
        if (key === 'userId') return;
        
        const questionElement = document.querySelector(`.question[data-id="${key}"]`);
        const questionType = questionElement ? questionElement.dataset.type : 'text';
        
        // Create the appropriate payload based on question type
        const payload = {
          userId,
          questionId: key
        };
        
        if (questionType === 'text') {
          payload.responseText = value;
        } else {
          payload.selectedOption = value;
        }
        
        // Send the response
        promises.push(
          fetch(`${API_CONFIG.BASE_URL}/responses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
          })
        );
      });
      
      // Wait for all responses to be submitted
      await Promise.all(promises);
      
      // Show success message
      showSuccess(translations[STATE.currentLanguage].responseSubmitted || 'Thank you for your feedback!');
      
      // Reset form and reload questions
      DOM.form.reset();
      DOM.questionsDiv.innerHTML = '';
      
      // Reload after a short delay
      setTimeout(() => {
        loadQuestions();
        DOM.submitButton.disabled = false;
        DOM.submitButton.textContent = translations[STATE.currentLanguage].submit;
      }, 1000);
    } catch (error) {
      console.error('Error submitting responses:', error);
      showError(translations[STATE.currentLanguage].failedToSubmit || 'Failed to submit responses. Please try again.');
      
      // Re-enable submit button
      DOM.submitButton.disabled = false;
      DOM.submitButton.textContent = translations[STATE.currentLanguage].submit;
    }
  }
  
  /**
   * Show a loading indicator
   * @param {HTMLElement} container - Container element to show loading in
   */
  function showLoading(container) {
    container.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>${translations[STATE.currentLanguage]?.loading || 'Loading...'}</p>
      </div>
    `;
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
  
  // Initialize the application
  init();
});
