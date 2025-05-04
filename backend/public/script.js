document.addEventListener('DOMContentLoaded', () => {
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
    document.title = translations[currentLanguage].appTitle;

    // Update heading
    document.querySelector('h1').textContent = translations[currentLanguage].surveyTitle;

    // Update status message
    document.querySelector('.language-toggle label').textContent = 
      currentLanguage === 'en' ? 'Language:' : 'Idioma:';

    // Update status message
    const statusP = document.querySelector('div[style*="background-color: #e0ffe0"] p');
    statusP.innerHTML = `<strong>${currentLanguage === 'en' ? 'Status' : 'Estado'}:</strong> ${translations[currentLanguage].statusMessage}`;

    // Update admin panel link
    document.querySelector('a[href="/admin.html"]').textContent = translations[currentLanguage].adminPanel;

    // Update form elements
    const userIdLabel = document.querySelector('label');
    userIdLabel.childNodes[0].textContent = translations[currentLanguage].userId + ': ';

    // Update submit button
    document.querySelector('button[type="submit"]').textContent = translations[currentLanguage].submit;

    // Reload questions to update their text
    loadQuestions();
  }

  const API_BASE = window.location.origin + '/api';
  const form = document.getElementById('survey-form');
  const questionsDiv = document.getElementById('questions');

  // Load questions
  function loadQuestions() {
    fetch(`${API_BASE}/questions`)
      .then(res => res.json())
      .then(questions => {
        questionsDiv.innerHTML = ''; // Clear existing questions
        questions.forEach(q => {
          const div = document.createElement('div');
          div.className = 'question';
          const label = document.createElement('p');
          label.textContent = q.text;
          div.appendChild(label);
          if (q.questionType === 'text') {
            const ta = document.createElement('textarea');
            ta.name = q._id;
            ta.maxLength = 100;
            ta.placeholder = currentLanguage === 'en' ? 
              "Enter your response (max 100 characters)" : 
              "Ingrese su respuesta (máximo 100 caracteres)";
            div.appendChild(ta);
          } else {
            q.options.forEach(opt => {
              const lbl = document.createElement('label');
              const input = document.createElement('input');
              input.type = 'radio';
              input.name = q._id;
              input.value = opt;
              lbl.appendChild(input);
              lbl.append(` ${opt}`);
              div.appendChild(lbl);
            });
          }
          questionsDiv.appendChild(div);
        });
      })
      .catch(err => console.error('Error loading questions', err));
  }

  // Submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const userId = formData.get('userId');

    const promises = [];

    formData.forEach((value, key) => {
      if (key === 'userId') return;
      promises.push(
        fetch(`${API_BASE}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, questionId: key, responseText: value })
        })
      );
    });

    Promise.all(promises)
      .then(() => {
        alert(translations[currentLanguage].responseSubmitted);
        form.reset();
        questionsDiv.innerHTML = '';
        // reload
        setTimeout(() => {
          form.reset();
          questionsDiv.innerHTML = '';
          document.location.reload();
        }, 500);
      })
      .catch(err => {
        console.error('Error submitting', err);
        alert(translations[currentLanguage].failedToSubmit);
      });
  });

  // Initial language update
  updateLanguage();
});
