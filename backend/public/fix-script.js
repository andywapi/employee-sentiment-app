/**
 * Employee Sentiment App - Fixed Script
 * This script focuses on the core functionality of displaying questions and handling language changes
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const elements = {
    languageSelect: document.getElementById('language-select'),
    questionsDiv: document.getElementById('questions'),
    progressIndicator: document.getElementById('progress-indicator'),
    navigationButtons: document.getElementById('navigation-buttons'),
    form: document.getElementById('survey-form')
  };
  
  // State
  const state = {
    currentLanguage: localStorage.getItem('language') || 'en',
    questions: [],
    currentQuestionIndex: 0,
    responses: new Map()
  };
  
  // Translations
  const translations = {
    en: {
      previous: "Previous",
      next: "Next",
      submit: "Submit",
      placeholder: "Enter your response (max 100 characters)",
      noQuestions: "No questions found. Please check back later.",
      error: "Error loading questions. Please try again later."
    },
    es: {
      previous: "Anterior",
      next: "Siguiente",
      submit: "Enviar",
      placeholder: "Ingrese su respuesta (máximo 100 caracteres)",
      noQuestions: "No se encontraron preguntas. Por favor, vuelva más tarde.",
      error: "Error al cargar preguntas. Por favor, inténtelo de nuevo más tarde."
    }
  };
  
  // Question translations
  const questionTranslations = {
    en_to_es: {
      "How would you rate your work environment?": "¿Cómo calificaría su ambiente de trabajo?",
      "How satisfied are you with team collaboration?": "¿Qué tan satisfecho está con la colaboración en equipo?",
      "Do you feel supported by management?": "¿Se siente apoyado por la gerencia?",
      "Are you satisfied with your career growth opportunities?": "¿Está satisfecho con sus oportunidades de crecimiento profesional?",
      "How would you rate your work-life balance?": "¿Cómo calificaría su equilibrio entre trabajo y vida personal?",
      "Are you satisfied with your compensation and benefits?": "¿Está satisfecho con su compensación y beneficios?",
      "Do you have the tools and resources needed to do your job effectively?": "¿Tiene las herramientas y recursos necesarios para realizar su trabajo de manera efectiva?",
      "Do you receive regular feedback about your performance?": "¿Recibe comentarios regulares sobre su desempeño?",
      "Do you feel your work is recognized and appreciated?": "¿Siente que su trabajo es reconocido y apreciado?",
      "What could we improve to make your work experience better?": "¿Qué podríamos mejorar para hacer que su experiencia de trabajo sea mejor?"
    },
    es_to_en: {
      "¿Cómo calificaría su ambiente de trabajo?": "How would you rate your work environment?",
      "¿Qué tan satisfecho está con la colaboración en equipo?": "How satisfied are you with team collaboration?",
      "¿Se siente apoyado por la gerencia?": "Do you feel supported by management?",
      "¿Está satisfecho con sus oportunidades de crecimiento profesional?": "Are you satisfied with your career growth opportunities?",
      "¿Cómo calificaría su equilibrio entre trabajo y vida personal?": "How would you rate your work-life balance?",
      "¿Está satisfecho con su compensación y beneficios?": "Are you satisfied with your compensation and benefits?",
      "¿Tiene las herramientas y recursos necesarios para realizar su trabajo de manera efectiva?": "Do you have the tools and resources needed to do your job effectively?",
      "¿Recibe comentarios regulares sobre su desempeño?": "Do you receive regular feedback about your performance?",
      "¿Siente que su trabajo es reconocido y apreciado?": "Do you feel your work is recognized and appreciated?",
      "¿Qué podríamos mejorar para hacer que su experiencia de trabajo sea mejor?": "What could we improve to make your work experience better?"
    }
  };
  
  // Initialize
  function init() {
    console.log('Initializing app with fixed script...');
    
    // Set initial language
    elements.languageSelect.value = state.currentLanguage;
    
    // Add language change listener
    elements.languageSelect.addEventListener('change', function(e) {
      state.currentLanguage = e.target.value;
      localStorage.setItem('language', state.currentLanguage);
      console.log(`Language changed to: ${state.currentLanguage}`);
      
      // Force re-render of all elements with the new language
      setTimeout(() => {
        // Re-render current question with new language
        renderCurrentQuestion();
        renderProgressIndicator();
        renderNavigation();
        
        // Log the current state for debugging
        console.log('Re-rendered all UI elements with new language');
        console.log('Current question index:', state.currentQuestionIndex);
        console.log('Current question:', state.questions[state.currentQuestionIndex]?.text);
      }, 10);
    });
    
    // Load questions
    loadQuestions();
    
    // Form submission
    elements.form.addEventListener('submit', function(e) {
      e.preventDefault();
      submitResponses();
    });
  }
  
  // Load questions from API
  async function loadQuestions() {
    try {
      console.log('Loading questions...');
      elements.questionsDiv.innerHTML = '<div class="loading">Loading questions...</div>';
      
      const response = await fetch('/api/questions?active=true');
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      
      const result = await response.json();
      
      // Handle both response formats (array or {success, data})
      const questions = Array.isArray(result) ? result : (result.data || []);
      
      if (questions.length === 0) {
        elements.questionsDiv.innerHTML = `
          <div class="no-questions">
            ${translations[state.currentLanguage].noQuestions}
          </div>
        `;
        return;
      }
      
      // Sort questions by order if available
      state.questions = questions.sort((a, b) => (a.order || 9999) - (b.order || 9999));
      state.currentQuestionIndex = 0;
      
      console.log(`Loaded ${state.questions.length} questions`);
      
      // Render first question
      renderCurrentQuestion();
      renderProgressIndicator();
      renderNavigation();
      
    } catch (error) {
      console.error('Error loading questions:', error);
      elements.questionsDiv.innerHTML = `
        <div class="error">
          ${translations[state.currentLanguage].error}
        </div>
      `;
    }
  }
  
  // Translate a question
  function translateQuestion(text) {
    if (!text) return '';
    
    // Debug the translation process
    console.log(`Translating question: "${text}" to ${state.currentLanguage}`);
    
    // Check if this is already in Spanish
    const isSpanish = text.includes('¿') || text.includes('á') || text.includes('é') || 
                      text.includes('í') || text.includes('ó') || text.includes('ú') || 
                      text.includes('ñ');
    
    if (state.currentLanguage === 'es') {
      // If we want Spanish and the text is already in Spanish, return it
      if (isSpanish) {
        console.log('Already in Spanish, keeping as is');
        return text;
      }
      // Otherwise translate from English to Spanish
      const translation = questionTranslations.en_to_es[text];
      console.log(`English to Spanish translation: ${translation || 'not found'}`);
      return translation || text;
    } else {
      // If we want English and the text is in Spanish, translate it
      if (isSpanish) {
        const translation = questionTranslations.es_to_en[text];
        console.log(`Spanish to English translation: ${translation || 'not found'}`);
        return translation || text;
      }
      // Otherwise it's already in English, return it
      console.log('Already in English, keeping as is');
      return text;
    }
  }
  
  // Render current question
  function renderCurrentQuestion() {
    elements.questionsDiv.innerHTML = '';
    
    if (state.questions.length === 0) return;
    
    const question = state.questions[state.currentQuestionIndex];
    console.log(`Rendering question ${state.currentQuestionIndex + 1}/${state.questions.length}: ${question.text}`);
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.dataset.id = question._id;
    questionDiv.dataset.type = question.questionType;
    
    // Create question label
    const questionLabel = document.createElement('p');
    questionLabel.className = 'question-label';
    
    // Store both English and Spanish versions for reliable translation
    const englishText = question.text_en || question.text;
    const spanishText = question.text_es || questionTranslations.en_to_es[englishText] || question.text;
    
    // Store both versions as data attributes for future reference
    questionLabel.dataset.englishText = englishText;
    questionLabel.dataset.spanishText = spanishText;
    
    // Set the content based on current language
    if (state.currentLanguage === 'es') {
      questionLabel.textContent = spanishText;
      console.log(`Showing Spanish question: "${spanishText}"`);
    } else {
      questionLabel.textContent = englishText;
      console.log(`Showing English question: "${englishText}"`);  
    }
    
    questionDiv.appendChild(questionLabel);
    
    // Create input based on question type
    if (question.questionType === 'text' || !question.questionType) {
      const textarea = document.createElement('textarea');
      textarea.name = question._id;
      textarea.maxLength = 100;
      textarea.required = true;
      textarea.placeholder = translations[state.currentLanguage].placeholder;
      
      // Set existing response if available
      if (state.responses.has(question._id)) {
        textarea.value = state.responses.get(question._id);
      }
      
      // Save response as user types
      textarea.addEventListener('input', function() {
        state.responses.set(question._id, textarea.value);
      });
      
      questionDiv.appendChild(textarea);
    } else if (question.questionType === 'multipleChoice' && question.options && question.options.length > 0) {
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'options';
      
      question.options.forEach((option, index) => {
        const optionLabel = document.createElement('label');
        optionLabel.className = 'option';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = question._id;
        radio.value = option;
        radio.required = true;
        
        // Set existing response if available
        if (state.responses.has(question._id) && state.responses.get(question._id) === option) {
          radio.checked = true;
        }
        
        // Save response when selected
        radio.addEventListener('change', function() {
          if (radio.checked) {
            state.responses.set(question._id, option);
          }
        });
        
        const optionText = document.createElement('span');
        optionText.textContent = option;
        
        optionLabel.appendChild(radio);
        optionLabel.appendChild(optionText);
        optionsDiv.appendChild(optionLabel);
      });
      
      questionDiv.appendChild(optionsDiv);
    }
    
    elements.questionsDiv.appendChild(questionDiv);
  }
  
  // Render progress indicator
  function renderProgressIndicator() {
    elements.progressIndicator.innerHTML = '';
    
    if (state.questions.length === 0) return;
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-steps';
    
    state.questions.forEach((_, index) => {
      const step = document.createElement('div');
      step.className = 'progress-step';
      
      if (index < state.currentQuestionIndex) {
        step.classList.add('completed');
      } else if (index === state.currentQuestionIndex) {
        step.classList.add('current');
      }
      
      progressContainer.appendChild(step);
    });
    
    elements.progressIndicator.appendChild(progressContainer);
  }
  
  // Render navigation buttons
  function renderNavigation() {
    elements.navigationButtons.innerHTML = '';
    
    if (state.questions.length === 0) return;
    
    const navContainer = document.createElement('div');
    navContainer.className = 'nav-buttons';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'nav-button prev-button';
    prevButton.textContent = translations[state.currentLanguage].previous;
    prevButton.disabled = state.currentQuestionIndex === 0;
    prevButton.addEventListener('click', goToPreviousQuestion);
    navContainer.appendChild(prevButton);
    
    // Next/Submit button
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    
    // Change button text and function if it's the last question
    const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1;
    
    if (isLastQuestion) {
      nextButton.className = 'nav-button submit-button';
      nextButton.textContent = translations[state.currentLanguage].submit;
      nextButton.addEventListener('click', submitResponses);
    } else {
      nextButton.className = 'nav-button next-button';
      nextButton.textContent = translations[state.currentLanguage].next;
      nextButton.addEventListener('click', goToNextQuestion);
    }
    
    navContainer.appendChild(nextButton);
    elements.navigationButtons.appendChild(navContainer);
  }
  
  // Go to previous question
  function goToPreviousQuestion() {
    if (state.currentQuestionIndex > 0) {
      state.currentQuestionIndex--;
      renderCurrentQuestion();
      renderProgressIndicator();
      renderNavigation();
    }
  }
  
  // Go to next question
  function goToNextQuestion() {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    
    // Validate response
    if (!validateCurrentQuestion(currentQuestion)) {
      return;
    }
    
    if (state.currentQuestionIndex < state.questions.length - 1) {
      state.currentQuestionIndex++;
      renderCurrentQuestion();
      renderProgressIndicator();
      renderNavigation();
      
      // Scroll to top of the question
      elements.questionsDiv.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  // Validate current question
  function validateCurrentQuestion(question) {
    // Check if the question has a response
    if (!state.responses.has(question._id)) {
      alert('Please provide a response before continuing.');
      return false;
    }
    
    return true;
  }
  
  // Submit responses
  async function submitResponses() {
    try {
      // Validate all questions have responses
      for (const question of state.questions) {
        if (!state.responses.has(question._id)) {
          alert(`Please answer all questions before submitting.`);
          return;
        }
      }
      
      // Get user ID
      const userId = document.getElementById('userId').value;
      if (!userId) {
        alert('Please enter your User ID.');
        return;
      }
      
      // Prepare responses for submission
      const responsesArray = Array.from(state.responses.entries()).map(([questionId, response]) => ({
        questionId,
        response,
        userId
      }));
      
      // Submit responses
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(responsesArray)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit responses');
      }
      
      // Show success message
      elements.questionsDiv.innerHTML = `
        <div class="success">
          <h2>Thank you!</h2>
          <p>Your responses have been submitted successfully.</p>
        </div>
      `;
      
      // Hide navigation
      elements.navigationButtons.innerHTML = '';
      elements.progressIndicator.innerHTML = '';
      
    } catch (error) {
      console.error('Error submitting responses:', error);
      alert('Error submitting responses. Please try again.');
    }
  }
  
  // Initialize the app
  init();
});
