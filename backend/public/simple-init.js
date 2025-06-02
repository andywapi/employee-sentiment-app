// Simple initialization script to bypass complex issues
console.log('Simple init script loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM ready - starting simple init');
  
  // Simple translations
  const simpleTranslations = {
    en: {
      appTitle: 'Employee Survey',
      adminLink: 'Admin Panel',
      submit: 'Submit',
      next: 'Next',
      previous: 'Previous',
      loading: 'Loading...',
      failedToLoad: 'Failed to load questions. Please try again.'
    },
    es: {
      appTitle: 'Encuesta de Empleados',
      adminLink: 'Panel de Administración',
      submit: 'Enviar',
      next: 'Siguiente',
      previous: 'Anterior',
      loading: 'Cargando...',
      failedToLoad: 'Error al cargar las preguntas. Por favor, inténtalo de nuevo.'
    }
  };
  
  // Get current language
  let currentLanguage = localStorage.getItem('language') || 'en';
  
  // Update translations immediately
  function updateTranslations() {
    const translations = simpleTranslations[currentLanguage];
    
    // Update app title
    const titleElement = document.querySelector('[data-i18n="appTitle"]');
    if (titleElement && translations.appTitle) {
      titleElement.textContent = translations.appTitle;
    }
    
    // Update admin link
    const adminLink = document.querySelector('[data-i18n="adminLink"]');
    if (adminLink && translations.adminLink) {
      adminLink.textContent = translations.adminLink;
    }
    
    // Update language selector
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      languageSelect.value = currentLanguage;
    }
    
    console.log('Translations updated for language:', currentLanguage);
  }
  
  // Load questions from server
  async function loadQuestions() {
    try {
      console.log('Loading questions from server...');
      const response = await fetch('/api/questions');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API response:', result);
      
      // Extract questions from the data property
      const questions = result.data || result;
      console.log('Questions extracted:', questions.length);
      
      if (questions.length > 0) {
        renderFirstQuestion(questions[0]);
      } else {
        console.log('No questions found, using fallback...');
        useFallbackQuestion();
      }
      
      return questions;
    } catch (error) {
      console.error('Error loading questions:', error);
      console.log('Using fallback sample question...');
      useFallbackQuestion();
      return [];
    }
  }
  
  // Use fallback question
  function useFallbackQuestion() {
    const sampleQuestion = {
      id: 1,
      text: "How satisfied are you with your current work environment?",
      questionType: "multipleChoice",
      options: [
        "Very Satisfied",
        "Satisfied", 
        "Neutral",
        "Dissatisfied",
        "Very Dissatisfied"
      ]
    };
    
    renderFirstQuestion(sampleQuestion);
  }
  
  // Render the first question
  function renderFirstQuestion(question) {
    const questionsContainer = document.getElementById('questions');
    if (!questionsContainer) {
      console.error('Questions container not found');
      return;
    }
    
    console.log('Rendering first question:', question);
    
    // Get the appropriate text based on current language
    let questionText = question.text;
    if (currentLanguage === 'en' && question.text_en) {
      questionText = question.text_en;
    } else if (currentLanguage === 'es' && question.text_es) {
      questionText = question.text_es;
    }
    
    // Use _id if available, otherwise use id
    const questionId = question._id || question.id || 1;
    
    let optionsHtml = '';
    
    // Handle different question types
    if (question.questionType === 'multipleChoice' && question.options && question.options.length > 0) {
      // Multiple choice question
      optionsHtml = question.options.map((option, index) => `
        <label class="option-label">
          <input type="radio" name="question_${questionId}" value="${option}" />
          <span>${option}</span>
        </label>
      `).join('');
    } else {
      // Text question or fallback
      optionsHtml = `
        <div class="text-input-container">
          <textarea name="question_${questionId}" placeholder="Please enter your response..." rows="4" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;"></textarea>
        </div>
      `;
    }
    
    questionsContainer.innerHTML = `
      <div class="question-container">
        <h2>${questionText}</h2>
        <div class="question-options">
          ${optionsHtml}
        </div>
      </div>
    `;
    
    // Show navigation buttons
    const navContainer = document.getElementById('navigation-buttons');
    if (navContainer) {
      navContainer.innerHTML = `
        <button type="button" class="nav-button next-button">Next</button>
      `;
    }
    
    console.log('First question rendered successfully');
  }
  
  // Show error message
  function showError(message) {
    console.error('Error:', message);
    const questionsContainer = document.getElementById('questions');
    if (questionsContainer) {
      questionsContainer.innerHTML = `
        <div class="error-message" style="color: #c33; padding: 20px; text-align: center;">
          ${message}
        </div>
      `;
    }
  }
  
  // Set up language selector
  function setupLanguageSelector() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      languageSelect.addEventListener('change', function(e) {
        currentLanguage = e.target.value;
        localStorage.setItem('language', currentLanguage);
        updateTranslations();
        console.log('Language changed to:', currentLanguage);
      });
    }
  }
  
  // Initialize everything
  async function simpleInit() {
    console.log('Starting simple initialization...');
    
    // Update translations first
    updateTranslations();
    
    // Setup language selector
    setupLanguageSelector();
    
    // Load and display questions
    await loadQuestions();
    
    console.log('Simple initialization complete');
  }
  
  // Start the simple initialization
  simpleInit();
});
