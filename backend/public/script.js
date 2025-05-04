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
    currentLanguage: localStorage.getItem('language') || 'en',
    questions: [],
    currentQuestionIndex: 0,
    responses: new Map(),
    showConfirmation: false
  };
  
  // DOM Elements
  const DOM = {
    languageSelect: document.getElementById('language-select'),
    form: document.getElementById('survey-form'),
    questionsDiv: document.getElementById('questions'),
    submitButton: document.querySelector('button[type="submit"]'),
    progressIndicator: document.getElementById('progress-indicator'),
    navigationButtons: document.getElementById('navigation-buttons')
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
    
    // Navigation button events will be set up in renderNavigation()
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
  }
  
  /**
   * Load active questions from the API
   */
  async function loadQuestions() {
    try {
      showLoading(DOM.questionsDiv);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/questions?active=true`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      
      const result = await response.json();
      
      // Handle both response formats (array or {success, data})
      const questions = Array.isArray(result) ? result : (result.data || []);
      
      if (questions.length === 0) {
        DOM.questionsDiv.innerHTML = `
          <div class="no-questions">
            ${translations[STATE.currentLanguage].noQuestionsMessage || 'No questions found.'}
          </div>
        `;
        DOM.submitButton.style.display = 'none';
        DOM.progressIndicator.style.display = 'none';
        DOM.navigationButtons.style.display = 'none';
        return;
      }
      
      // Sort questions by order if available
      STATE.questions = questions.sort((a, b) => (a.order || 9999) - (b.order || 9999));
      STATE.currentQuestionIndex = 0;
      STATE.responses = new Map();
      
      renderCurrentQuestion();
      renderProgressIndicator();
      renderNavigation();
      
      // Hide the submit button since we'll use the next button as submit on the last question
      DOM.submitButton.style.display = 'none';
    } catch (error) {
      console.error('Error loading questions:', error);
      DOM.questionsDiv.innerHTML = `
        <div class="error">
          ${translations[STATE.currentLanguage].failedToLoad || 'Failed to load questions. Please try again.'}
        </div>
      `;
    }
  }
  
  /**
   * Render the current question based on the currentQuestionIndex
   */
  function renderCurrentQuestion() {
    // If we're showing the confirmation page, render that instead
    if (STATE.showConfirmation) {
      renderConfirmationPage();
      return;
    }
    
    DOM.questionsDiv.innerHTML = ''; // Clear existing questions
    
    if (STATE.questions.length === 0) return;
    
    const question = STATE.questions[STATE.currentQuestionIndex];
    
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
      
      // If we have a saved response for this question, populate it
      if (STATE.responses.has(question._id)) {
        textarea.value = STATE.responses.get(question._id);
      }
      
      // Add event listener to save response as user types
      textarea.addEventListener('input', (e) => {
        STATE.responses.set(question._id, e.target.value);
      });
      
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
        
        // If we have a saved response for this question, check the appropriate radio button
        if (STATE.responses.has(question._id) && STATE.responses.get(question._id) === option) {
          radioInput.checked = true;
        }
        
        // Add event listener to save response when selected
        radioInput.addEventListener('change', (e) => {
          if (e.target.checked) {
            STATE.responses.set(question._id, e.target.value);
          }
        });
        
        optionLabel.appendChild(radioInput);
        optionLabel.append(` ${option}`);
        optionsContainer.appendChild(optionLabel);
      });
      
      questionDiv.appendChild(optionsContainer);
    }
    
    DOM.questionsDiv.appendChild(questionDiv);
  }
  
  /**
   * Render the confirmation page after survey submission
   */
  function renderConfirmationPage() {
    // Hide progress indicator and navigation buttons when showing confirmation
    DOM.progressIndicator.style.display = 'none';
    DOM.navigationButtons.style.display = 'none';
    
    // Create confirmation message
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'confirmation-page';
    
    const icon = document.createElement('div');
    icon.className = 'confirmation-icon';
    icon.innerHTML = '✓';
    confirmationDiv.appendChild(icon);
    
    const message = document.createElement('h2');
    message.className = 'confirmation-message';
    message.textContent = translations[STATE.currentLanguage].confirmationMessage || 'Thank you for completing the survey';
    confirmationDiv.appendChild(message);
    
    const newSurveyBtn = document.createElement('button');
    newSurveyBtn.className = 'new-survey-button';
    newSurveyBtn.textContent = translations[STATE.currentLanguage].startNewSurvey || 'Start a new survey';
    newSurveyBtn.addEventListener('click', () => {
      // Reset the form and state
      DOM.form.reset();
      STATE.responses = new Map();
      STATE.currentQuestionIndex = 0;
      STATE.showConfirmation = false;
      
      // Show progress indicator and navigation buttons again
      DOM.progressIndicator.style.display = 'block';
      DOM.navigationButtons.style.display = 'block';
      
      // Reload questions
      loadQuestions();
    });
    confirmationDiv.appendChild(newSurveyBtn);
    
    // Clear questions div and add confirmation
    DOM.questionsDiv.innerHTML = '';
    DOM.questionsDiv.appendChild(confirmationDiv);
  }
  
  /**
   * Render the subway-style progress indicator
   */
  function renderProgressIndicator() {
    DOM.progressIndicator.innerHTML = '';
    
    if (STATE.questions.length === 0) return;
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'subway-progress';
    
    STATE.questions.forEach((question, index) => {
      // Create station indicator
      const station = document.createElement('div');
      station.className = 'subway-station';
      
      // Add appropriate classes based on progress
      if (index < STATE.currentQuestionIndex) {
        station.classList.add('completed');
      } else if (index === STATE.currentQuestionIndex) {
        station.classList.add('current');
      }
      
      // Add station number
      const stationNumber = document.createElement('span');
      stationNumber.className = 'station-number';
      stationNumber.textContent = index + 1;
      station.appendChild(stationNumber);
      
      // Add station to container
      progressContainer.appendChild(station);
      
      // Add connecting line (except for the last station)
      if (index < STATE.questions.length - 1) {
        const line = document.createElement('div');
        line.className = 'subway-line';
        
        // Add appropriate classes based on progress
        if (index < STATE.currentQuestionIndex) {
          line.classList.add('completed');
        }
        
        progressContainer.appendChild(line);
      }
    });
    
    DOM.progressIndicator.appendChild(progressContainer);
  }
  
  /**
   * Render navigation buttons (previous/next)
   */
  function renderNavigation() {
    DOM.navigationButtons.innerHTML = '';
    
    if (STATE.questions.length === 0 || STATE.showConfirmation) return;
    
    const navContainer = document.createElement('div');
    navContainer.className = 'navigation-container';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'nav-button prev-button';
    prevButton.textContent = STATE.currentLanguage === 'en' ? 'Previous' : 'Anterior';
    prevButton.disabled = STATE.currentQuestionIndex === 0;
    prevButton.addEventListener('click', goToPreviousQuestion);
    navContainer.appendChild(prevButton);
    
    // Next/Submit button
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    
    // Change button text and function if it's the last question
    const isLastQuestion = STATE.currentQuestionIndex === STATE.questions.length - 1;
    
    if (isLastQuestion) {
      nextButton.className = 'nav-button submit-button';
      nextButton.textContent = translations[STATE.currentLanguage].submit || 'Submit';
      nextButton.addEventListener('click', handleSubmitFromNavigation);
    } else {
      nextButton.className = 'nav-button next-button';
      nextButton.textContent = STATE.currentLanguage === 'en' ? 'Next' : 'Siguiente';
      nextButton.addEventListener('click', goToNextQuestion);
    }
    
    navContainer.appendChild(nextButton);
    
    DOM.navigationButtons.appendChild(navContainer);
  }
  
  /**
   * Go to the previous question
   */
  function goToPreviousQuestion() {
    if (STATE.currentQuestionIndex > 0) {
      STATE.currentQuestionIndex--;
      renderCurrentQuestion();
      renderProgressIndicator();
      renderNavigation();
    }
  }
  
  /**
   * Go to the next question
   */
  function goToNextQuestion() {
    const currentQuestion = STATE.questions[STATE.currentQuestionIndex];
    
    // Validate the current question has a response before proceeding
    if (!validateCurrentQuestion(currentQuestion)) {
      return;
    }
    
    if (STATE.currentQuestionIndex < STATE.questions.length - 1) {
      STATE.currentQuestionIndex++;
      renderCurrentQuestion();
      renderProgressIndicator();
      renderNavigation();
      
      // Scroll to top of the question
      DOM.questionsDiv.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  /**
   * Validate that the current question has a valid response
   * @param {Object} question - The current question object
   * @returns {boolean} Whether the question has a valid response
   */
  function validateCurrentQuestion(question) {
    if (!question) return false;
    
    // Check if we have a response for this question
    if (!STATE.responses.has(question._id)) {
      showError(STATE.currentLanguage === 'en' ? 
        'Please answer the question before proceeding.' : 
        'Por favor responda la pregunta antes de continuar.');
      return false;
    }
    
    // For text questions, check if the response is not empty
    if (question.questionType === 'text' && STATE.responses.get(question._id).trim() === '') {
      showError(STATE.currentLanguage === 'en' ? 
        'Please enter a response before proceeding.' : 
        'Por favor ingrese una respuesta antes de continuar.');
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle form submission triggered from the navigation button
   */
  async function handleSubmitFromNavigation() {
    // Validate the current question first
    const currentQuestion = STATE.questions[STATE.currentQuestionIndex];
    if (!validateCurrentQuestion(currentQuestion)) {
      return;
    }
    
    // Now handle the actual submission
    try {
      // Validate userId
      const userId = document.getElementById('userId').value.trim();
      
      if (!userId) {
        showError(translations[STATE.currentLanguage].userIdRequired || 'User ID is required');
        return;
      }
      
      // Validate all questions have responses
      const unansweredQuestions = STATE.questions.filter(q => !STATE.responses.has(q._id));
      
      if (unansweredQuestions.length > 0) {
        showError(STATE.currentLanguage === 'en' ? 
          'Please answer all questions before submitting.' : 
          'Por favor responda todas las preguntas antes de enviar.');
        return;
      }
      
      // Disable navigation buttons to prevent multiple submissions
      const navButtons = document.querySelectorAll('.nav-button');
      navButtons.forEach(button => {
        button.disabled = true;
        if (button.classList.contains('submit-button')) {
          button.textContent = STATE.currentLanguage === 'en' ? 'Submitting...' : 'Enviando...';
        }
      });
      
      const promises = [];
      
      // Send each response to the API
      STATE.questions.forEach(question => {
        const response = STATE.responses.get(question._id);
        
        if (!response) return;
        
        // Create the appropriate payload based on question type
        const payload = {
          userId,
          questionId: question._id
        };
        
        if (question.questionType === 'text') {
          payload.responseText = response;
        } else {
          payload.selectedOption = response;
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
      
      // Show the confirmation page
      STATE.showConfirmation = true;
      renderCurrentQuestion();
      
    } catch (error) {
      console.error('Error submitting responses:', error);
      showError(translations[STATE.currentLanguage].failedToSubmit || 'Failed to submit responses. Please try again.');
      
      // Re-enable navigation buttons
      const navButtons = document.querySelectorAll('.nav-button');
      navButtons.forEach(button => {
        button.disabled = false;
        if (button.classList.contains('submit-button')) {
          button.textContent = translations[STATE.currentLanguage].submit || 'Submit';
        }
      });
    }
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    // We're now handling submission through the navigation buttons
    // This is just a fallback in case the form is submitted directly
    if (STATE.currentQuestionIndex === STATE.questions.length - 1) {
      handleSubmitFromNavigation();
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
