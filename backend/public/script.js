/**
 * Employee Sentiment App - User Survey
 * 
 * This file contains the JavaScript code for the user survey functionality,
 * including loading questions and submitting responses.
 */

document.addEventListener('DOMContentLoaded', () => {
  // API configuration
  const API_CONFIG = {
    BASE_URL: window.location.origin + '/api',
    WEATHER_API: 'https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q='
  };
  
  // State management
  const STATE = {
    currentLanguage: localStorage.getItem('language') || 'en',
    weatherData: null,
    temperatureUnit: localStorage.getItem('temperatureUnit') || 'C' // Default to Celsius
  };
  
  // DOM Elements
  const DOM = {
    languageSelect: document.getElementById('language-select'),
    form: document.getElementById('survey-form'),
    questionsDiv: document.getElementById('questions'),
    submitButton: document.querySelector('button[type="submit"]'),
    weatherDisplay: document.getElementById('weather-display')
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
    
    // Get weather data
    getWeatherData();
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
    
    // Weather display click for temperature unit toggle
    DOM.weatherDisplay.addEventListener('click', () => {
      // Toggle between Celsius and Fahrenheit
      STATE.temperatureUnit = STATE.temperatureUnit === 'C' ? 'F' : 'C';
      // Save preference
      localStorage.setItem('temperatureUnit', STATE.temperatureUnit);
      // Update display
      updateWeatherDisplay();
    });
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
    
    // Update weather display if data is available
    if (STATE.weatherData) {
      updateWeatherDisplay();
    }
    
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
  
  /**
   * Get weather data based on user's IP geolocation
   */
  async function getWeatherData() {
    try {
      // First, get the user's IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const userIp = ipData.ip;
      
      // Then, get geolocation data from the IP
      const geoResponse = await fetch(`https://ipapi.co/${userIp}/json/`);
      const geoData = await geoResponse.json();
      
      // Finally, get weather data for the location
      // Using a free weather API that doesn't require an API key for development
      const weatherResponse = await fetch(`https://wttr.in/${geoData.city}?format=j1`);
      const weatherData = await weatherResponse.json();
      
      // Store weather data in state
      STATE.weatherData = {
        temperature_C: weatherData.current_condition[0].temp_C,
        temperature_F: weatherData.current_condition[0].temp_F,
        condition: weatherData.current_condition[0].weatherDesc[0].value,
        city: geoData.city
      };
      
      // Update the weather display
      updateWeatherDisplay();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Show a fallback message
      DOM.weatherDisplay.innerHTML = `
        <span class="icon">🌡️</span>
        <span class="temp">Weather unavailable</span>
      `;
    }
  }
  
  /**
   * Update the weather display with the fetched data
   */
  function updateWeatherDisplay() {
    if (!STATE.weatherData) return;
    
    // Get weather icon based on condition
    let weatherIcon = '🌡️'; // Default icon
    const condition = STATE.weatherData.condition.toLowerCase();
    
    if (condition.includes('sun') || condition.includes('clear')) {
      weatherIcon = '☀️';
    } else if (condition.includes('cloud')) {
      weatherIcon = '☁️';
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
      weatherIcon = '🌧️';
    } else if (condition.includes('snow')) {
      weatherIcon = '❄️';
    } else if (condition.includes('thunder') || condition.includes('storm')) {
      weatherIcon = '⛈️';
    } else if (condition.includes('fog') || condition.includes('mist')) {
      weatherIcon = '🌫️';
    }
    
    // Get temperature in the current unit
    const temperature = STATE.temperatureUnit === 'C' 
      ? STATE.weatherData.temperature_C 
      : STATE.weatherData.temperature_F;
    
    // Update the DOM
    DOM.weatherDisplay.innerHTML = `
      <span class="icon">${weatherIcon}</span>
      <span class="temp">${temperature}°${STATE.temperatureUnit} ${STATE.weatherData.city}</span>
    `;
    
    // Add title attribute for tooltip
    DOM.weatherDisplay.title = STATE.currentLanguage === 'en' 
      ? 'Click to toggle between °C and °F' 
      : 'Haga clic para cambiar entre °C y °F';
    
    // Add cursor style to indicate it's clickable
    DOM.weatherDisplay.style.cursor = 'pointer';
  }
  
  // Initialize the application
  init();
});
