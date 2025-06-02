/**
 * Employee Sentiment App - User Survey
 * 
 * This file contains the JavaScript code for the user survey functionality,
 * including loading questions and submitting responses.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the i18n system
  if (window.i18n) {
    i18n.initLanguage();
  }
  
  // API configuration
  const API_CONFIG = {
    BASE_URL: window.location.origin + '/api',
    WEATHER_API: window.location.origin + '/api/weather' // Changed to use our backend as a proxy
  };

  // Translations
  const translations = {
    en: {
      noQuestionsMessage: 'No questions found.',
      failedToLoad: 'Failed to load questions. Please try again.',
      loading: 'Loading...',
      submit: 'Submit',
      nextButton: 'Next',
      previous: 'Previous',
      duplicateTitle: 'Survey Already Completed',
      duplicateMessage: 'Thank you for your interest! This survey has already been completed from this device. Each employee can only submit one response to ensure data accuracy.',
      duplicateContact: 'If you believe this is an error, please contact your administrator.',
      adminPanel: 'Admin Panel',
      appTitle: 'Employee Survey',
      confirmationMessage: 'Thank you for completing the survey',
      startNewSurvey: 'Start a new survey',
      allQuestionsRequired: 'Please answer all questions',
      failedToSubmit: 'Failed to submit responses. Please try again.',
      submissionSuccess: 'Responses submitted successfully',
      adminLink: 'Admin Panel',
      duplicateSubmissionTitle: "Survey Already Completed",
      duplicateSubmissionMessage: "You have already completed this survey. Thank you for your participation!",
      allowNewSubmission: "Allow New Submission"
    },
    es: {
      noQuestionsMessage: 'No se encontraron preguntas.',
      failedToLoad: 'Error al cargar las preguntas. Por favor, intente de nuevo.',
      loading: 'Cargando...',
      submit: 'Enviar',
      nextButton: 'Siguiente',
      previous: 'Anterior',
      duplicateTitle: 'La encuesta ya ha sido completada',
      duplicateMessage: '¡Gracias por su interés! Esta encuesta ya ha sido completada desde este dispositivo. Cada empleado solo puede enviar una respuesta para garantizar la precisión de los datos.',
      duplicateContact: 'Si cree que esto es un error, por favor comuníquese con su administrador.',
      adminPanel: 'Panel de administración',
      appTitle: 'Encuesta de Empleado',
      confirmationMessage: 'Gracias por completar la encuesta',
      startNewSurvey: 'Comenzar una nueva encuesta',
      allQuestionsRequired: 'Por favor responda todas las preguntas',
      failedToSubmit: 'Error al enviar respuestas. Por favor, inténtelo de nuevo.',
      submissionSuccess: 'Respuestas enviadas con éxito',
      adminLink: 'Panel de administración',
      duplicateSubmissionTitle: "Encuesta Ya Completada",
      duplicateSubmissionMessage: "Ya has completado esta encuesta. ¡Gracias por tu participación!",
      allowNewSubmission: "Permitir Nueva Respuesta"
    }
  };
  
  // State management
  const STATE = {
    currentLanguage: localStorage.getItem('language') || 'en',
    weatherData: null,
    temperatureUnit: localStorage.getItem('temperatureUnit') || 'C', // Default to Celsius
    questions: [],
    currentQuestionIndex: 0, // Start at 0 for first question
    responses: new Map(),
    showConfirmation: false,
    deviceFingerprint: null,
    surveyCompleted: false
  };
  
  // DOM Elements
  const DOM = {
    languageSelect: document.getElementById('language-select'),
    form: document.getElementById('survey-form'),
    questionsDiv: document.getElementById('questions'),
    submitButton: document.querySelector('button[type="submit"]'),
    weatherDisplay: document.getElementById('weather-display'),
    progressIndicator: document.getElementById('progress-indicator'),
    navigationButtons: document.getElementById('navigation-buttons')
  };

  // Debug DOM elements
  console.log('DOM Elements found:', {
    languageSelect: !!DOM.languageSelect,
    form: !!DOM.form,
    questionsDiv: !!DOM.questionsDiv,
    submitButton: !!DOM.submitButton,
    weatherDisplay: !!DOM.weatherDisplay,
    progressIndicator: !!DOM.progressIndicator,
    navigationButtons: !!DOM.navigationButtons
  });

  // Additional debugging for specific elements
  console.log('Questions div element:', DOM.questionsDiv);
  console.log('Navigation buttons element:', DOM.navigationButtons);
  console.log('App title element:', document.querySelector('[data-i18n="appTitle"]'));

  /**
   * Helper function to get auth headers for API requests
   * @returns {Object} Headers object with authorization
   */
  function getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add admin token for protected routes
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    
    // Fallback to basic auth credentials if available
    const credentials = localStorage.getItem('auth_credentials');
    if (credentials && !adminToken) {
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
  async function init() {
    try {
      console.log('Initializing application...');
      
      // Generate device fingerprint for duplicate prevention
      STATE.deviceFingerprint = await generateDeviceFingerprint();
      console.log('Device fingerprint generated:', STATE.deviceFingerprint);
      
      // Check for duplicate submission if prevention is enabled
      if (isDuplicatePreventionEnabled()) {
        console.log('Duplicate prevention is enabled, checking...');
        const isDuplicate = await checkForDuplicateSubmission(STATE.deviceFingerprint);
        if (isDuplicate) {
          console.log('Duplicate submission detected');
          showDuplicateSubmissionMessage();
          return;
        }
        console.log('No duplicate detected');
      } else {
        console.log('Duplicate prevention is disabled - resetting state');
        resetSurveyState();
      }
      
      // Load questions from the server
      console.log('Loading questions...');
      await loadQuestions();
      console.log('Questions loaded:', STATE.questions.length);
      
      // Set up event listeners
      console.log('Setting up event listeners...');
      setupEventListeners();
      
      // Update language first
      console.log('Updating language...');
      updateLanguage();
      
      // Initialize weather display
      console.log('Initializing weather...');
      getWeatherData();
      
      // Render the first question
      console.log('Rendering first question...');
      renderCurrentQuestion();
      
      // Render navigation and progress indicator
      console.log('Rendering navigation and progress...');
      renderNavigation();
      renderProgressIndicator();
      
      console.log('Application initialized successfully');
      
    } catch (error) {
      console.error('Error initializing app:', error);
      showError(translations[STATE.currentLanguage].failedToLoad || 'Failed to load questions. Please try again.');
    }
  }

  /**
   * Load questions from the server
   */
  async function loadQuestions() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/questions`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      const result = await response.json();
      // Extract questions from the data property
      STATE.questions = result.data || result;
      
      console.log('📋 Questions loaded successfully:');
      console.log('  - Total questions:', STATE.questions.length);
      console.log('  - Questions:', STATE.questions);
      
    } catch (error) {
      console.error('Error loading questions:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Language selector
    if (DOM.languageSelect) {
      DOM.languageSelect.addEventListener('change', (e) => {
        STATE.currentLanguage = e.target.value;
        localStorage.setItem('language', STATE.currentLanguage);
        updateLanguage();
        renderCurrentQuestion();
      });
    }

    // Form submission
    if (DOM.form) {
      DOM.form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSubmitFromNavigation();
      });
    }
  }

  /**
   * Update all text elements with translations
   */
  function updateLanguage() {
    console.log('🔍 updateLanguage called');
    
    // Safety check - make sure STATE is initialized
    if (typeof STATE === 'undefined') {
      console.log('🔍 STATE not yet initialized, skipping updateLanguage');
      return;
    }
    
    console.log('🔍 STATE.currentLanguage:', STATE.currentLanguage);
    
    const currentTranslations = translations[STATE.currentLanguage];
    console.log('🔍 currentTranslations:', currentTranslations);
    
    // Update all elements with data-i18n attributes
    const i18nElements = document.querySelectorAll('[data-i18n]');
    console.log('🔍 Found i18n elements:', i18nElements.length);
    
    i18nElements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      console.log('🔍 Updating element with key:', key, 'value:', currentTranslations[key]);
      if (currentTranslations[key]) {
        element.textContent = currentTranslations[key];
        console.log('🔍 Updated element text to:', element.textContent);
      }
    });
    
    // Update language selector
    if (DOM.languageSelect) {
      DOM.languageSelect.value = STATE.currentLanguage;
      console.log('🔍 Updated language selector to:', STATE.currentLanguage);
    }
    
    console.log('🔍 Language updated to:', STATE.currentLanguage);
  }

  /**
   * Synchronize the language of all form elements
   * This ensures that all elements use the same language
   */
  function synchronizeFormLanguage() {
    if (!window.i18n) return;
    
    console.log(`Synchronizing form language to: ${STATE.currentLanguage}`);
    
    // Update all question texts
    document.querySelectorAll('.question-label').forEach(label => {
      const questionText = label.textContent;
      const translatedText = i18n.translateQuestion(questionText);
      label.textContent = translatedText;
    });
    
    // Update all placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = i18n.translate(key);
    });
    
    // Update navigation buttons
    const prevButton = document.querySelector('.prev-button');
    if (prevButton) {
      prevButton.textContent = i18n.translate('previous');
    }
    
    const nextButton = document.querySelector('.next-button');
    if (nextButton) {
      nextButton.textContent = i18n.translate('nextButton');
    }
    
    // Update user ID label
    const userIdLabel = document.querySelector('label[for="userId"]');
    if (userIdLabel) {
      userIdLabel.textContent = STATE.currentLanguage === 'en' ? 'User ID:' : 'ID de Usuario:';
    }
  }
  
  /**
   * Directly translate a question based on the current language
   * @param {string} questionText - The original question text
   * @returns {string} The translated question text
   */
  function directTranslateQuestion(questionText) {
    // Use our simple language system if available
    if (window.SimpleLanguage) {
      return SimpleLanguage.translateQuestion(questionText);
    }
    
    // Fallback to original text
    return questionText;
  }
  
  /**
   * Render the current question based on the currentQuestionIndex
   */
  function renderCurrentQuestion() {
    console.log('🔍 renderCurrentQuestion called');
    console.log('🔍 STATE.questions:', STATE.questions);
    console.log('🔍 STATE.currentQuestionIndex:', STATE.currentQuestionIndex);
    
    // If we're showing the confirmation page, render that instead
    if (STATE.showConfirmation) {
      console.log('🔍 Showing confirmation page');
      renderConfirmationPage();
      return;
    }
    
    DOM.questionsDiv.innerHTML = ''; // Clear existing questions
    
    // Check if we have questions to display
    if (STATE.questions.length === 0) {
      console.log('🔍 No questions available');
      DOM.questionsDiv.innerHTML = '<p>No questions available. Please check the console for errors.</p>';
      return;
    }
    
    const question = STATE.questions[STATE.currentQuestionIndex];
    if (!question) {
      console.log('🔍 No question at current index');
      DOM.questionsDiv.innerHTML = '<p>Question not found at current index.</p>';
      return;
    }
    
    console.log('🔍 Rendering question:', question);
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.dataset.id = question._id;
    questionDiv.dataset.type = question.questionType;
    
    // Store the original question text as a data attribute for translation purposes
    questionDiv.dataset.originalText = question.text;
    
    // Create question label
    const questionLabel = document.createElement('p');
    questionLabel.className = 'question-label';
    questionLabel.dataset.originalText = question.text;
    questionLabel.dataset.englishText = question.text_en || question.text;
    questionLabel.dataset.spanishText = question.text_es || question.text;
    
    // Use the appropriate language version based on the current language
    if (STATE.currentLanguage === 'es') {
      // Use Spanish version if available
      questionLabel.textContent = question.text_es || question.text;
      console.log(`Using Spanish text: "${questionLabel.textContent}"`);
    } else {
      // Use English version if available
      questionLabel.textContent = question.text_en || question.text;
      console.log(`Using English text: "${questionLabel.textContent}"`);
    }
    
    questionDiv.appendChild(questionLabel);
    
    // Create input based on question type
    if (question.questionType === 'text') {
      const textarea = document.createElement('textarea');
      textarea.name = question._id;
      textarea.maxLength = 100;
      textarea.required = true;
      
      // Set placeholder text using our simple language system
      if (window.SimpleLanguage) {
        textarea.placeholder = SimpleLanguage.translateUI('placeholder');
      } else {
        // Fallback if language system is not available
        textarea.placeholder = STATE.currentLanguage === 'en' ? 
          "Enter your response (max 100 characters)" : 
          "Ingrese su respuesta (máximo 100 caracteres)";
      }
      
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
    
    // Add the question to the DOM
    DOM.questionsDiv.appendChild(questionDiv);
    
    // Synchronize the language of all form elements
    if (window.i18n) {
      setTimeout(synchronizeFormLanguage, 50);
    }
  }

  /**
   * Render the confirmation page after survey submission
   */
  function renderConfirmationPage() {
    // Hide progress indicator, navigation buttons, and submit button when showing confirmation
    DOM.progressIndicator.style.display = 'none';
    DOM.navigationButtons.style.display = 'none';
    DOM.submitButton.style.display = 'none';

    // Create confirmation message
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'confirmation-page';

    const icon = document.createElement('div');
    icon.className = 'confirmation-icon';
    icon.innerHTML = '✓';
    confirmationDiv.appendChild(icon);

    const message = document.createElement('h2');
    message.textContent = translations[STATE.currentLanguage].confirmationMessage || 'Thank you for completing the survey';
    confirmationDiv.appendChild(message);

    // Only show "Start a new survey" button if duplicate prevention is DISABLED
    if (!isDuplicatePreventionEnabled()) {
      const newSurveyBtn = document.createElement('button');
      newSurveyBtn.className = 'new-survey-button';
      newSurveyBtn.textContent = translations[STATE.currentLanguage].startNewSurvey || 'Start a new survey';
      newSurveyBtn.addEventListener('click', () => {
        // Use the proper reset function
        resetSurveyState();
      });
      confirmationDiv.appendChild(newSurveyBtn);
    } else {
      // If duplicate prevention is enabled, show a block message
      const blockMsg = document.createElement('p');
      blockMsg.className = 'duplicate-block-msg';
      blockMsg.textContent = translations[STATE.currentLanguage].duplicateSubmissionMessage || 'You have already completed this survey. Thank you for your participation!';
      confirmationDiv.appendChild(blockMsg);
    }

    // Clear questions div and add confirmation
    DOM.questionsDiv.innerHTML = '';
    DOM.questionsDiv.appendChild(confirmationDiv);
  }

  /**
   * Reset survey state to start a new survey
   */
  function resetSurveyState() {
    console.log('🔄 resetSurveyState called - starting survey restart');
    console.log('🔄 Before reset - currentQuestionIndex:', STATE.currentQuestionIndex);
    console.log('🔄 Before reset - responses:', STATE.responses);
    console.log('🔍 Before reset - showConfirmation:', STATE.showConfirmation);
    
    // Reset all state variables
    STATE.responses = new Map();
    STATE.currentQuestionIndex = 0;
    STATE.showConfirmation = false;
    
    // Reset the form
    DOM.form.reset();
    
    // Clear the questions div
    DOM.questionsDiv.innerHTML = '';
    
    // Show progress indicator and navigation buttons
    DOM.progressIndicator.style.display = 'block';
    DOM.navigationButtons.style.display = 'block';
    DOM.submitButton.style.display = 'none'; // Keep hidden, we use navigation buttons
    
    console.log('🔄 After reset - currentQuestionIndex:', STATE.currentQuestionIndex);
    console.log('🔄 After reset - responses:', STATE.responses);
    console.log('🔍 After reset - showConfirmation:', STATE.showConfirmation);
    
    // Re-render everything
    console.log('🔄 Re-rendering question, navigation, and progress...');
    renderCurrentQuestion();
    renderNavigation();
    renderProgressIndicator();
    
    console.log('🔄 Survey restart completed successfully');
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
   * Validate that the current question has a valid response
   * @param {Object} question - The current question object
   * @returns {boolean} Whether the question has a valid response
   */
  function validateCurrentQuestion(question) {
    // Guard: Only validate if question is present
    if (!question) return true;
    
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
   * Fetch weather data for the user's location
   */
  async function getWeatherData() {
    try {
      // Check if the weather display element exists
      if (!DOM.weatherDisplay) return;
      
      // Show loading in weather display
      DOM.weatherDisplay.innerHTML = `
        <div class="weather-loading">
          <div class="loading-spinner-small"></div>
        </div>
      `;
      
      // Get user's location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Fetch weather data from our backend proxy instead of directly from the weather API
            const response = await fetch(`${API_CONFIG.WEATHER_API}?lat=${latitude}&lon=${longitude}`, {
              headers: getAuthHeaders()
            });
            
            if (!response.ok) {
              throw new Error('Weather API error');
            }
            
            const data = await response.json();
            
            // Save weather data to state
            STATE.weatherData = {
              location: data.location?.name || 'Unknown',
              tempC: data.current?.temp_c || 0,
              tempF: data.current?.temp_f || 32,
              condition: data.current?.condition?.text || 'Unknown',
              icon: data.current?.condition?.icon || ''
            };
            
            // Update weather display
            updateWeatherDisplay();
          } catch (error) {
            console.error('Error fetching weather:', error);
            // Show a more user-friendly error message
            DOM.weatherDisplay.innerHTML = `
              <div class="weather-error">
                <i class="weather-icon">🌦️</i>
                <span>${STATE.currentLanguage === 'en' ? 'Weather unavailable' : 'Clima no disponible'}</span>
              </div>
            `;
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          DOM.weatherDisplay.innerHTML = `
            <div class="weather-error">
              <i class="weather-icon">📍</i>
              <span>${STATE.currentLanguage === 'en' ? 'Location access denied' : 'Acceso a ubicación denegado'}</span>
            </div>
          `;
        },
        { timeout: 10000 } // Add a timeout to prevent long waits
      );
    } catch (error) {
      console.error('Weather feature error:', error);
      // Ensure the weather display doesn't break the rest of the app
      if (DOM.weatherDisplay) {
        DOM.weatherDisplay.innerHTML = '';
      }
    }
  }
  
  /**
   * Update the weather display with current data and preferences
   */
  function updateWeatherDisplay() {
    // Check if weather display element exists and we have data
    if (!DOM.weatherDisplay || !STATE.weatherData) return;
    
    const { location, tempC, tempF, condition, icon } = STATE.weatherData;
    const temp = STATE.temperatureUnit === 'C' ? tempC : tempF;
    const unit = STATE.temperatureUnit;
    
    DOM.weatherDisplay.innerHTML = `
      <div class="weather-container">
        ${icon ? `<img src="${icon}" alt="${condition}" class="weather-icon" />` : '<span class="weather-icon">🌤️</span>'}
        <div class="weather-info">
          <div class="weather-location">${location}</div>
          <div class="weather-temp">${Math.round(temp)}°${unit}</div>
          <div class="weather-condition">${condition}</div>
        </div>
      </div>
    `;
    
    // Add tooltip to indicate you can click to change units
    DOM.weatherDisplay.title = STATE.currentLanguage === 'en' 
      ? 'Click to toggle between °C and °F' 
      : 'Haga clic para cambiar entre °C y °F';
  }
  
  /**
   * Handle form submission triggered from the navigation button
   */
  async function handleSubmitFromNavigation() {
    // Validate the current question
    const currentQuestion = STATE.questions[STATE.currentQuestionIndex];
    if (!validateCurrentQuestion(currentQuestion)) {
      return;
    }
    
    // Now handle the actual submission
    try {
      // Validate all questions have responses
      const unansweredQuestions = STATE.questions.filter(q => !STATE.responses.has(q._id));
      if (unansweredQuestions.length > 0) {
        showError(translations[STATE.currentLanguage].allQuestionsRequired || 'Please answer all questions');
        return;
      }

      // Disable navigation buttons during submission
      const navButtons = document.querySelectorAll('.nav-button');
      navButtons.forEach(button => {
        button.disabled = true;
        if (button.classList.contains('submit-button')) {
          button.textContent = translations[STATE.currentLanguage].loading || 'Loading...';
        }
      });
      
      // Create an array of promises for submitting each response
      const promises = [];
      
      STATE.questions.forEach((question) => {
        const response = STATE.responses.get(question._id);
        if (!response) return;
        
        const payload = {
          questionId: question._id,
          deviceFingerprint: STATE.deviceFingerprint, // Add device fingerprint
          submissionTimestamp: new Date().toISOString()
        };
        
        // Add the appropriate response field based on question type
        if (question.questionType === 'multipleChoice') {
          payload.selectedOption = response;
        } else {
          payload.responseText = response;
        }
        
        console.log('Submitting response payload:', payload); // Debug log
        
        promises.push(
          fetch(`${API_CONFIG.BASE_URL}/responses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify(payload)
          }).then(async (response) => {
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Failed to submit response');
            }
            return response.json();
          })
        );
      });
      
      // Wait for all responses to be submitted
      await Promise.all(promises);
      
      // Mark survey as completed
      markSurveyCompleted(STATE.deviceFingerprint);
      
      // Save submission timestamp
      localStorage.setItem('lastSurveySubmission', new Date().toISOString());
      
      // Show the confirmation page
      STATE.showConfirmation = true;
      renderConfirmationPage();
      
      showSuccess(translations[STATE.currentLanguage].submissionSuccess || 'Responses submitted successfully');
      
    } catch (error) {
      console.error('Error submitting responses:', error);
      showError(error.message || translations[STATE.currentLanguage].failedToSubmit || 'Failed to submit responses. Please try again.');
      
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
    console.error('Error:', message);
    
    // Create or update status message element
    let statusDiv = document.getElementById('status-message');
    if (!statusDiv) {
      statusDiv = document.createElement('div');
      statusDiv.id = 'status-message';
      statusDiv.className = 'status-message error';
      document.querySelector('.container').insertBefore(statusDiv, document.querySelector('main'));
    }
    
    statusDiv.className = 'status-message error';
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (statusDiv) {
        statusDiv.style.display = 'none';
      }
    }, 5000);
  }

  /**
   * Go to the next question
   */
  function goToNextQuestion() {
    // Validate current question before proceeding
    const question = STATE.questions[STATE.currentQuestionIndex];
    if (!validateCurrentQuestion(question)) {
      return;
    }
    
    // If we're on the last question, handle submission
    if (STATE.currentQuestionIndex === STATE.questions.length - 1) {
      handleSubmitFromNavigation();
      return;
    }
    
    STATE.currentQuestionIndex++;
    renderCurrentQuestion();
    renderNavigation();
    renderProgressIndicator();
    
    // Force navigation re-render to ensure button updates
    setTimeout(() => {
      console.log('🔄 Force re-rendering navigation after timeout');
      renderNavigation();
    }, 10);
    
    // Apply translations after navigation
    if (window.SimpleLanguage) {
      setTimeout(() => {
        SimpleLanguage.updateUI();
        console.log('Applied translations after next navigation');
      }, 50);
    }
  }

  /**
   * Generate a device fingerprint for duplicate detection
   */
  async function generateDeviceFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      
      const fingerprint = {
        canvas: canvas.toDataURL(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack
      };
      
      // Create a hash of the fingerprint
      const fingerprintString = JSON.stringify(fingerprint);
      let hash = 0;
      for (let i = 0; i <fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return Math.abs(hash).toString(36);
    } catch (error) {
      console.error('Error generating device fingerprint:', error);
      // Fallback to a simple random string
      return Math.random().toString(36).substring(2, 15);
    }
  }

  /**
   * Check if duplicate prevention is enabled
   */
  function isDuplicatePreventionEnabled() {
    const enabled = localStorage.getItem('duplicatePreventionEnabled');
    return enabled === 'true';
  }

  /**
   * Check for duplicate submission using device fingerprint
   * @param {string} fingerprint - Device fingerprint
   * @returns {boolean} Whether this is a duplicate submission
   */
  async function checkForDuplicateSubmission(fingerprint) {
    try {
      // If duplicate prevention is disabled, always allow submission
      if (!isDuplicatePreventionEnabled()) {
        console.log('Duplicate prevention disabled - allowing submission');
        return false;
      }

      // Check local storage first
      const localCompleted = localStorage.getItem('survey_completed');
      if (localCompleted === 'true') {
        console.log('Local duplicate detected');
        return true;
      }

      // Check server-side duplicate
      const response = await fetch(`${API_CONFIG.BASE_URL}/check-submission`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deviceFingerprint: fingerprint })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.isDuplicate) {
          console.log('Server-side duplicate detected');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking for duplicate submission:', error);
      // Don't block the user if there's an error checking duplicates
      return false;
    }
  }

  /**
   * Mark survey as completed locally and on server
   * @param {string} fingerprint - Device fingerprint
   */
  function markSurveyCompleted(fingerprint) {
    // Mark locally
    localStorage.setItem('survey_completed', 'true');
    localStorage.setItem('survey_completion_date', new Date().toISOString());
    
    // Update state
    STATE.surveyCompleted = true;
  }

  /**
   * Test function for debugging duplicate prevention (accessible from console)
   * Call this from browser console: window.testDuplicatePrevention()
   */
  window.testDuplicatePrevention = function() {
    console.log('Testing duplicate prevention...');
    console.log('Current language:', STATE.currentLanguage);
    console.log('Translations available:', Object.keys(translations));
    console.log('Current translations:', translations[STATE.currentLanguage]);
    
    // Set local completion flag to simulate duplicate
    localStorage.setItem('survey_completed', 'true');
    localStorage.setItem('survey_completion_date', new Date().toISOString());
    
    // Show the duplicate message
    showDuplicateSubmissionMessage();
    console.log('Duplicate message should now be displayed');
  };

  /**
   * Function to clear duplicate flags and refresh (accessible from console)
   * Call this from browser console: window.clearDuplicateFlags()
   */
  window.clearDuplicateFlags = function() {
    console.log('Clearing duplicate flags...');
    localStorage.removeItem('survey_completed');
    localStorage.removeItem('survey_completion_time');
    console.log('Duplicate flags cleared. Refreshing page...');
    location.reload();
  };

  /**
   * Function to check duplicate prevention status (accessible from console)
   * Call this from browser console: window.checkDuplicateStatus()
   */
  window.checkDuplicateStatus = function() {
    const enabled = isDuplicatePreventionEnabled();
    const completed = localStorage.getItem('survey_completed');
    const completionDate = localStorage.getItem('survey_completion_date');
    
    console.log('Duplicate Prevention Status:');
    console.log('- Enabled:', enabled);
    console.log('- Survey Completed Flag:', completed);
    console.log('- Completion Date:', completionDate);
    console.log('- Duration Setting:', localStorage.getItem('duplicatePreventionDuration') || '30', 'days');
    
    if (completed && completionDate) {
      const completedAt = new Date(completionDate);
      const now = new Date();
      const daysDiff = (now - completedAt) / (1000 * 60 * 60 * 24);
      console.log('- Days since completion:', daysDiff.toFixed(1));
    }
  };

  /**
   * Clear old duplicate flags from the removed 24-hour system (accessible from console)
   * Call this from browser console: window.clearOldDuplicateFlags()
   */
  window.clearOldDuplicateFlags = function() {
    console.log('Clearing old duplicate flags...');
    
    // Clear all employee-specific submission flags from the old system
    const keys = Object.keys(localStorage);
    let cleared = 0;
    keys.forEach(key => {
      if (key.startsWith('lastSubmission_')) {
        localStorage.removeItem(key);
        console.log('Removed:', key);
        cleared++;
      }
    });
    
    console.log(`Cleared ${cleared} old duplicate flags. Refreshing page...`);
    window.location.reload();
  };

  /**
   * Show duplicate submission message
   */
  function showDuplicateSubmissionMessage() {
    console.log('Showing duplicate submission message');
    
    // Check if duplicate prevention is enabled
    const preventionEnabled = isDuplicatePreventionEnabled();
    
    // Create the duplicate actions section only if prevention is disabled
    const duplicateActionsHtml = preventionEnabled ? '' : `
      <div class="duplicate-actions">
        <button type="button" onclick="clearDuplicateFlags()" class="btn-secondary">
          <span data-i18n="allowNewSubmission">Allow New Submission</span>
        </button>
      </div>
    `;
    
    // Clear the questions div and show duplicate message
    DOM.questionsDiv.innerHTML = `
      <div class="duplicate-submission-message">
        <h2 data-i18n="duplicateSubmissionTitle">Survey Already Completed</h2>
        <p data-i18n="duplicateSubmissionMessage">You have already completed this survey. Thank you for your participation!</p>
        ${duplicateActionsHtml}
      </div>
    `;
    
    // Hide navigation buttons
    DOM.navigationButtons.innerHTML = '';
    
    // Update translations for the duplicate message
    updateLanguage();
  }

  /**
   * Clear duplicate flags and allow new submission (for testing/admin purposes)
   */
  function clearDuplicateFlags() {
    localStorage.removeItem('survey_completed');
    localStorage.removeItem('survey_completion_time');
    console.log('Duplicate flags cleared, reloading page...');
    window.location.reload();
  }

  /**
   * Reset survey state for a new submission
   */
  function resetSurveyState() {
    console.log('🔄 resetSurveyState called - starting survey restart');
    console.log('🔄 Before reset - currentQuestionIndex:', STATE.currentQuestionIndex);
    console.log('🔄 Before reset - responses:', STATE.responses);
    console.log('🔍 Before reset - showConfirmation:', STATE.showConfirmation);
    
    // Reset all state variables
    STATE.responses = new Map();
    STATE.currentQuestionIndex = 0;
    STATE.showConfirmation = false;
    
    // Reset the form
    DOM.form.reset();
    
    // Clear the questions div
    DOM.questionsDiv.innerHTML = '';
    
    // Show progress indicator and navigation buttons
    DOM.progressIndicator.style.display = 'block';
    DOM.navigationButtons.style.display = 'block';
    DOM.submitButton.style.display = 'none'; // Keep hidden, we use navigation buttons
    
    console.log('🔄 After reset - currentQuestionIndex:', STATE.currentQuestionIndex);
    console.log('🔄 After reset - responses:', STATE.responses);
    console.log('🔍 After reset - showConfirmation:', STATE.showConfirmation);
    
    // Re-render everything
    console.log('🔄 Re-rendering question, navigation, and progress...');
    renderCurrentQuestion();
    renderNavigation();
    renderProgressIndicator();
    
    console.log('🔄 Survey restart completed successfully');
  }

  /**
   * Render navigation buttons (Previous/Next/Submit)
   */
  function renderNavigation() {
    DOM.navigationButtons.innerHTML = '';
    
    if (STATE.questions.length === 0) return;
    
    // Debug logging
    console.log('🔍 renderNavigation Debug:');
    console.log('  - Current question index:', STATE.currentQuestionIndex);
    console.log('  - Total questions:', STATE.questions.length);
    console.log('  - Is last question?', STATE.currentQuestionIndex === STATE.questions.length - 1);
    
    const navContainer = document.createElement('div');
    navContainer.className = 'navigation-container';
    
    // Previous button (only show if not on first question)
    if (STATE.currentQuestionIndex > 0) {
      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'nav-button prev-button';
      prevBtn.textContent = translations[STATE.currentLanguage].previous || 'Previous';
      prevBtn.setAttribute('data-button-type', 'previous');
      prevBtn.setAttribute('data-force-text', 'previous');
      prevBtn.addEventListener('click', () => {
        STATE.currentQuestionIndex--;
        renderCurrentQuestion();
        renderNavigation();
        renderProgressIndicator();
      });
      navContainer.appendChild(prevBtn);
    }
    
    // Next/Submit button
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'nav-button next-button';
    
    if (STATE.currentQuestionIndex === STATE.questions.length - 1) {
      // Last question - show Submit button
      console.log('  - Showing SUBMIT button');
      nextBtn.textContent = translations[STATE.currentLanguage].submit || 'Submit';
      nextBtn.setAttribute('data-button-type', 'submit');
      nextBtn.setAttribute('data-force-text', 'submit');
      nextBtn.addEventListener('click', handleSubmitFromNavigation);
    } else {
      // Not last question - show Next button
      console.log('  - Showing NEXT button');
      nextBtn.textContent = translations[STATE.currentLanguage].nextButton || 'Next';
      nextBtn.setAttribute('data-button-type', 'next');
      nextBtn.setAttribute('data-force-text', 'next');
      nextBtn.addEventListener('click', () => {
        console.log('🔄 Next button clicked - calling goToNextQuestion()');
        goToNextQuestion();
      });
    }
    
    navContainer.appendChild(nextBtn);
    DOM.navigationButtons.appendChild(navContainer);
  }

  // Add global debug function for testing
  window.debugSurveyState = function() {
    console.log('🔍 Current Survey State:');
    console.log('  - Current question index:', STATE.currentQuestionIndex);
    console.log('  - Total questions:', STATE.questions.length);
    console.log('  - Is last question?', STATE.currentQuestionIndex === STATE.questions.length - 1);
    console.log('  - Current language:', STATE.currentLanguage);
    console.log('  - Questions:', STATE.questions);
    return {
      currentIndex: STATE.currentQuestionIndex,
      totalQuestions: STATE.questions.length,
      isLastQuestion: STATE.currentQuestionIndex === STATE.questions.length - 1,
      questions: STATE.questions
    };
  };

  // Add global function to force navigation re-render
  window.forceRenderNavigation = function() {
    console.log('🔄 Force rendering navigation...');
    renderNavigation();
    console.log('✅ Navigation re-rendered');
  };

  // Set up admin authentication token
  function setupAdminAuth() {
    // For demo purposes, set a simple admin token
    // In production, this would come from a proper login system
    if (!localStorage.getItem('adminToken')) {
      localStorage.setItem('adminToken', 'demo-admin-token');
    }
  }

  // Call auth setup
  setupAdminAuth();

  // Protect navigation buttons from translation override
  function protectNavigationButtons() {
    const navContainer = document.querySelector('#navigation-buttons');
    if (!navContainer) return;

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // Check if we're on the last question and the button text was changed
          const nextBtn = navContainer.querySelector('.next-button');
          if (nextBtn && STATE.currentQuestionIndex === STATE.questions.length - 1) {
            const currentText = nextBtn.textContent.trim();
            const expectedSubmitText = translations[STATE.currentLanguage].submit || 'Submit';
            
            if (currentText !== expectedSubmitText && nextBtn.getAttribute('data-button-type') === 'submit') {
              console.log('🛡️ Protecting Submit button text from override:', currentText, '→', expectedSubmitText);
              nextBtn.textContent = expectedSubmitText;
            }
          }
        }
      });
    });

    observer.observe(navContainer, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true
    });

    console.log('🛡️ Navigation button protection enabled');
  }

  // Start protection after DOM is ready
  setTimeout(protectNavigationButtons, 1000);

  // Initialize the application
  init();
});
