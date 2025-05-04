document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = window.location.origin + '/api';
  let currentEditId = null;
  let allResponses = [];
  
  // Initialize language
  let currentLanguage = localStorage.getItem('language') || 'en';
  const languageSelect = document.getElementById('language-select');
  languageSelect.value = currentLanguage;
  
  // Language change handler
  languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    localStorage.setItem('language', currentLanguage);
    updateLanguage();
  });
  
  // Update all text elements with translations
  function updateLanguage() {
    // Update title
    document.title = translations[currentLanguage].adminTitle;
    
    // Update heading
    document.querySelector('h1').textContent = translations[currentLanguage].adminTitle;
    
    // Update language toggle
    document.querySelector('.language-toggle label').textContent = 
      currentLanguage === 'en' ? 'Language:' : 'Idioma:';
    
    // Update tabs
    const tabs = document.querySelectorAll('.tab');
    tabs[0].textContent = translations[currentLanguage].questionsTab;
    tabs[1].textContent = translations[currentLanguage].responsesTab;
    tabs[2].textContent = translations[currentLanguage].analyticsTab;
    
    // Update questions tab
    document.querySelector('#questions-tab h2:first-child').textContent = 
      translations[currentLanguage].createQuestion;
    
    document.querySelector('label[for="question-text"]').textContent = 
      translations[currentLanguage].questionText + ': ';
    
    const questionTypeLabel = document.querySelector('#question-type').previousElementSibling;
    questionTypeLabel.textContent = translations[currentLanguage].questionType + ': ';
    
    const questionTypeOptions = document.querySelectorAll('#question-type option');
    questionTypeOptions[0].textContent = translations[currentLanguage].textResponse;
    questionTypeOptions[1].textContent = translations[currentLanguage].multipleChoice;
    
    document.querySelector('#options-container h3').textContent = 
      translations[currentLanguage].optionsTitle;
    
    const optionInputs = document.querySelectorAll('.option-input');
    optionInputs.forEach((input, index) => {
      input.placeholder = `${translations[currentLanguage].option} ${index + 1}`;
    });
    
    document.querySelector('label[for="is-active"]').textContent = 
      translations[currentLanguage].active;
    
    document.querySelector('#question-form button').textContent = 
      translations[currentLanguage].submit;
    
    document.querySelector('#questions-tab h2:last-of-type').textContent = 
      translations[currentLanguage].existingQuestions;
    
    // Update responses tab
    document.querySelector('#responses-tab h2').textContent = 
      translations[currentLanguage].userResponses;
    
    // Update analytics tab
    document.querySelector('#analytics-tab h2').textContent = 
      translations[currentLanguage].paretoAnalysis;
    document.querySelector('#analytics-tab > p').textContent = 
      translations[currentLanguage].analyzeKeywords;
    
    document.querySelector('#new-keyword').placeholder = 
      translations[currentLanguage].newKeyword;
    document.querySelector('#add-keyword').textContent = 
      translations[currentLanguage].addKeyword;
    
    document.querySelector('#keyword-analysis h3').textContent = 
      translations[currentLanguage].paretoChart;
    
    // Reload data
    if (document.querySelector('.tab.active').getAttribute('data-tab') === 'questions') {
      loadQuestions();
    } else if (document.querySelector('.tab.active').getAttribute('data-tab') === 'responses') {
      loadUsers();
    } else if (document.querySelector('.tab.active').getAttribute('data-tab') === 'analytics') {
      analyzeKeywords();
    }
  }
  
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.add('active');
      
      // Load data for the tab if needed
      if (tabName === 'questions') {
        loadQuestions();
      } else if (tabName === 'responses') {
        loadUsers();
      } else if (tabName === 'analytics') {
        loadAllResponses();
      }
    });
  });
  
  // Question type change handler
  const questionTypeSelect = document.getElementById('question-type');
  questionTypeSelect.addEventListener('change', function() {
    const optionsContainer = document.getElementById('options-container');
    if (this.value === 'multipleChoice') {
      optionsContainer.style.display = 'block';
    } else {
      optionsContainer.style.display = 'none';
    }
  });
  
  // Question form submission
  const questionForm = document.getElementById('question-form');
  questionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const questionText = document.getElementById('question-text').value;
    const questionType = document.getElementById('question-type').value;
    const isActive = document.getElementById('is-active').checked;
    
    // Get options for multiple choice questions
    let options = [];
    if (questionType === 'multipleChoice') {
      const optionInputs = document.querySelectorAll('.option-input');
      optionInputs.forEach(input => {
        if (input.value.trim()) {
          options.push(input.value.trim());
        }
      });
      
      if (options.length === 0) {
        alert(translations[currentLanguage].multipleChoiceRequired || 'Multiple choice questions must have at least one option');
        return;
      }
    }
    
    const questionData = {
      text: questionText,
      questionType,
      options,
      isActive
    };
    
    try {
      let response;
      if (currentEditId) {
        // Update existing question
        response = await fetch(`${API_BASE}/questions/${currentEditId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionData)
        });
      } else {
        // Create new question
        response = await fetch(`${API_BASE}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionData)
        });
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Reset form
      questionForm.reset();
      document.getElementById('options-container').style.display = 'none';
      
      // Reset edit state
      currentEditId = null;
      document.querySelector('#question-form button[type="submit"]').textContent = 
        translations[currentLanguage].submit;
      
      // Reload questions
      loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert(translations[currentLanguage].failedToSave || 'Failed to save question: ' + error.message);
    }
  });
  
  // Add keyword button
  const addKeywordBtn = document.getElementById('add-keyword');
  addKeywordBtn.addEventListener('click', () => {
    const newKeywordInput = document.getElementById('new-keyword');
    const keyword = newKeywordInput.value.trim().toLowerCase();
    
    if (keyword) {
      addKeyword(keyword);
      newKeywordInput.value = '';
      analyzeKeywords();
    }
  });
  
  // Load questions
  async function loadQuestions() {
    try {
      const response = await fetch(`${API_BASE}/questions`);
      const questions = await response.json();
      
      renderQuestions(questions);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  }
  
  // Function to render questions in the admin panel
  function renderQuestions(questions) {
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = '';
    
    if (questions.length === 0) {
      questionsList.innerHTML = `<p>${translations[currentLanguage].noQuestionsMessage}</p>`;
      return;
    }
    
    questions.forEach(question => {
      const questionItem = document.createElement('div');
      questionItem.className = 'question-item';
      questionItem.dataset.id = question._id;
      
      let questionTypeDisplay = question.questionType === 'text' 
        ? translations[currentLanguage].textResponse 
        : translations[currentLanguage].multipleChoice;
      
      let optionsHtml = '';
      if (question.questionType === 'multipleChoice' && question.options && question.options.length > 0) {
        optionsHtml = `
          <div class="question-options">
            <p><strong>${translations[currentLanguage].options}:</strong></p>
            <ul>
              ${question.options.map(option => `<li>${option}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      questionItem.innerHTML = `
        <h3>${question.text}</h3>
        <p><strong>${translations[currentLanguage].type}:</strong> ${questionTypeDisplay}</p>
        <p><strong>${translations[currentLanguage].status}:</strong> ${question.isActive ? translations[currentLanguage].active : translations[currentLanguage].inactive}</p>
        ${optionsHtml}
        <div class="question-actions">
          <button class="edit-btn">${translations[currentLanguage].edit}</button>
          <button class="delete-btn">${translations[currentLanguage].delete}</button>
        </div>
      `;
      
      questionsList.appendChild(questionItem);
      
      // Add event listeners for edit and delete buttons
      const editBtn = questionItem.querySelector('.edit-btn');
      const deleteBtn = questionItem.querySelector('.delete-btn');
      
      editBtn.addEventListener('click', () => {
        editQuestion(question);
      });
      
      deleteBtn.addEventListener('click', () => {
        deleteQuestion(question._id);
      });
    });
  }
  
  // Edit question
  function editQuestion(question) {
    console.log('Editing question:', question); // Debug log
    currentEditId = question._id;
    
    // Fill the form with the question data
    document.getElementById('question-text').value = question.text;
    
    // Set question type and trigger change event to show/hide options
    const questionTypeSelect = document.getElementById('question-type');
    questionTypeSelect.value = question.questionType;
    
    // Handle multiple choice options
    const optionsContainer = document.getElementById('options-container');
    const optionInputs = document.querySelectorAll('.option-input');
    
    // Clear existing option values first
    optionInputs.forEach(input => {
      input.value = '';
    });
    
    // Show options container if it's a multiple choice question
    if (question.questionType === 'multipleChoice') {
      console.log('Multiple choice question with options:', question.options); // Debug log
      optionsContainer.style.display = 'block';
      
      // Fill in the options
      if (question.options && question.options.length > 0) {
        question.options.forEach((option, index) => {
          if (index < optionInputs.length) {
            optionInputs[index].value = option;
          }
        });
      }
    } else {
      optionsContainer.style.display = 'none';
    }
    
    // Set active status
    document.getElementById('is-active').checked = question.isActive;
    
    // Change the submit button text to "Update"
    const submitButton = document.querySelector('#question-form button[type="submit"]');
    submitButton.textContent = translations[currentLanguage].save || 'Save';
    
    // Scroll to the form
    document.getElementById('question-form').scrollIntoView({ behavior: 'smooth' });
  }
  
  // Delete question
  async function deleteQuestion(id) {
    if (!confirm(translations[currentLanguage].deleteConfirm)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/questions/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(translations[currentLanguage].failedToDelete);
      }
      
      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert(translations[currentLanguage].failedToDelete + ': ' + error.message);
    }
  }
  
  // Load users
  async function loadUsers() {
    try {
      const response = await fetch(`${API_BASE}/responses/users`);
      const users = await response.json();
      
      const usersList = document.getElementById('users-list');
      usersList.innerHTML = '';
      
      users.forEach(user => {
        const userBadge = document.createElement('div');
        userBadge.className = 'user-badge';
        userBadge.textContent = user;
        userBadge.addEventListener('click', () => {
          document.querySelectorAll('.user-badge').forEach(badge => badge.classList.remove('active'));
          userBadge.classList.add('active');
          loadUserResponses(user);
        });
        usersList.appendChild(userBadge);
      });
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }
  
  // Load user responses
  async function loadUserResponses(userId) {
    try {
      const response = await fetch(`${API_BASE}/responses/user/${userId}`);
      const responses = await response.json();
      
      const userResponsesDiv = document.getElementById('user-responses');
      userResponsesDiv.innerHTML = '';
      
      const userHeader = document.createElement('h3');
      userHeader.textContent = `${translations[currentLanguage].responsesFrom} ${userId}`;
      userResponsesDiv.appendChild(userHeader);
      
      responses.forEach(response => {
        const responseItem = document.createElement('div');
        responseItem.className = 'response-item';
        
        const questionText = document.createElement('p');
        questionText.innerHTML = `<strong>${translations[currentLanguage].question}:</strong> ${response.questionText}`;
        responseItem.appendChild(questionText);
        
        const responseText = document.createElement('p');
        responseText.innerHTML = `<strong>${translations[currentLanguage].response}:</strong> ${response.responseText || response.selectedOption}`;
        responseItem.appendChild(responseText);
        
        const timestamp = document.createElement('p');
        timestamp.innerHTML = `<strong>${translations[currentLanguage].submitted}:</strong> ${new Date(response.createdAt).toLocaleString(
          currentLanguage === 'en' ? 'en-US' : 'es-MX'
        )}`;
        responseItem.appendChild(timestamp);
        
        userResponsesDiv.appendChild(responseItem);
      });
    } catch (error) {
      console.error('Error loading user responses:', error);
    }
  }
  
  // Load all responses for analytics
  async function loadAllResponses() {
    try {
      const response = await fetch(`${API_BASE}/responses`);
      allResponses = await response.json();
      analyzeKeywords();
    } catch (error) {
      console.error('Error loading responses for analytics:', error);
    }
  }
  
  // Add keyword
  function addKeyword(keyword) {
    const keywordsList = document.getElementById('keywords-list');
    const existingKeywords = Array.from(keywordsList.querySelectorAll('.keyword-badge')).map(
      badge => badge.getAttribute('data-keyword')
    );
    
    if (existingKeywords.includes(keyword)) {
      return; // Keyword already exists
    }
    
    const keywordBadge = document.createElement('div');
    keywordBadge.className = 'keyword-badge';
    keywordBadge.setAttribute('data-keyword', keyword);
    keywordBadge.textContent = keyword + ' ';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-keyword';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      keywordBadge.remove();
      analyzeKeywords();
    });
    
    keywordBadge.appendChild(removeBtn);
    keywordsList.appendChild(keywordBadge);
  }
  
  // Analyze keywords
  function analyzeKeywords() {
    if (!allResponses.length) return;
    
    const keywordsList = document.getElementById('keywords-list');
    const keywords = Array.from(keywordsList.querySelectorAll('.keyword-badge')).map(
      badge => badge.getAttribute('data-keyword')
    );
    
    const keywordCounts = {};
    keywords.forEach(keyword => {
      keywordCounts[keyword] = 0;
    });
    
    // Count occurrences
    allResponses.forEach(response => {
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
  
  // Display Pareto chart
  function displayParetoChart(data) {
    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = '';
    
    if (data.length === 0) {
      chartContainer.textContent = translations[currentLanguage].noData;
      return;
    }
    
    // Create chart elements
    const canvas = document.createElement('canvas');
    canvas.id = 'pareto-chart';
    canvas.width = chartContainer.offsetWidth;
    canvas.height = chartContainer.offsetHeight;
    chartContainer.appendChild(canvas);
    
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
  
  // Initial load
  loadQuestions();
  
  // Initial language update
  updateLanguage();
});
