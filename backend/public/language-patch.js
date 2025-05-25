/**
 * Language Patch for Employee Sentiment App
 * This script fixes language discrepancies without modifying the original code
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Language patch loaded - fixing language discrepancies');
  
  // Wait for the main script to initialize
  setTimeout(function() {
    // Patch the language system
    applyLanguagePatch();
  }, 500);
  
  function applyLanguagePatch() {
    // Check if we have access to the direct translations
    if (!window.DirectTranslations) {
      console.error('Direct translations not available');
      return;
    }
    
    // Instead of patching the function, we'll observe DOM changes
    observeQuestionChanges();
    
    // Patch the language toggle
    patchLanguageToggle();
    
    // Add a visual language indicator
    addLanguageIndicator();
    
    // Initial fix for any existing questions
    fixCurrentQuestionLanguage();
    
    console.log('Language patch applied successfully');
  }
  
  function observeQuestionChanges() {
    // Create a mutation observer to watch for changes to the questions div
    const questionsDiv = document.getElementById('questions');
    if (!questionsDiv) {
      console.error('Questions div not found');
      return;
    }
    
    // Create an observer instance
    const observer = new MutationObserver(function(mutations) {
      // When the questions div changes, fix the language
      fixCurrentQuestionLanguage();
    });
    
    // Configuration of the observer
    const config = { childList: true, subtree: true };
    
    // Start observing
    observer.observe(questionsDiv, config);
    console.log('Observing questions div for changes');
  }
  
  function fixCurrentQuestionLanguage() {
    // Get the current language
    const currentLanguage = localStorage.getItem('language') || 'en';
    console.log(`Fixing question language to: ${currentLanguage}`);
    
    // Find the current question label
    const questionLabel = document.querySelector('.question-label');
    if (!questionLabel) {
      console.warn('No question label found');
      return;
    }
    
    // Get the current text
    const currentText = questionLabel.textContent;
    
    // Check if the text is in Spanish (contains Spanish-specific characters)
    const isSpanish = DirectTranslations.isSpanishText(currentText);
    console.log(`Current question text: "${currentText}" (isSpanish: ${isSpanish})`);
    
    // If we want English and the text is in Spanish, or we want Spanish and the text is in English
    if ((currentLanguage === 'en' && isSpanish) || (currentLanguage === 'es' && !isSpanish)) {
      // Get the translation
      const translatedText = DirectTranslations.translateText(currentText, currentLanguage);
      
      // Update the text if we got a translation
      if (translatedText !== currentText) {
        questionLabel.textContent = translatedText;
        console.log(`Updated question text: "${currentText}" -> "${translatedText}"`);
      } else {
        console.warn(`No translation found for: "${currentText}"`);
      }
    } else {
      console.log(`Text already in ${currentLanguage}, no translation needed`);
    }
    
    // Also fix the placeholder text
    const textarea = document.querySelector('.question textarea');
    if (textarea) {
      textarea.placeholder = DirectTranslations.getUITranslation('placeholder', currentLanguage);
    }
    
    // Fix navigation buttons
    fixNavigationButtons(currentLanguage);
  }
  
  function fixNavigationButtons(currentLanguage) {
    // Fix Previous button
    const prevButton = document.querySelector('.prev-button');
    if (prevButton) {
      prevButton.textContent = DirectTranslations.getUITranslation('previous', currentLanguage);
    }
    
    // Fix Next button
    const nextButton = document.querySelector('.next-button');
    if (nextButton) {
      nextButton.textContent = DirectTranslations.getUITranslation('next', currentLanguage);
    }
    
    // Fix Submit button
    const submitButton = document.querySelector('.submit-button');
    if (submitButton) {
      submitButton.textContent = DirectTranslations.getUITranslation('submit', currentLanguage);
    }
  }
  
  function patchLanguageToggle() {
    // Get the language select element
    const languageSelect = document.getElementById('language-select');
    if (!languageSelect) {
      console.error('Language select not found');
      return;
    }
    
    // Add an additional event listener to ensure language changes are applied
    languageSelect.addEventListener('change', function(e) {
      const newLanguage = e.target.value;
      console.log(`Language changed to: ${newLanguage} (patched handler)`);
      
      // Give the original handler time to run
      setTimeout(function() {
        // Force update all text elements
        fixCurrentQuestionLanguage();
        
        // Update the language indicator
        updateLanguageIndicator(newLanguage);
      }, 100);
    });
    
    // Also patch the language toggle button if it exists
    const languageToggle = document.querySelector('.language-toggle');
    if (languageToggle && languageToggle.tagName === 'BUTTON') {
      languageToggle.addEventListener('click', function() {
        // Wait for the original handler to run
        setTimeout(function() {
          // Get the current language
          const currentLanguage = localStorage.getItem('language') || 'en';
          console.log(`Language toggled to: ${currentLanguage} (patched handler)`);
          
          // Force update all text elements
          fixCurrentQuestionLanguage();
          
          // Update the language indicator
          updateLanguageIndicator(currentLanguage);
        }, 100);
      });
    }
    
    console.log('Patched language toggle');
  }
  
  function addLanguageIndicator() {
    // Create a language indicator element
    const indicator = document.createElement('div');
    indicator.className = 'language-indicator';
    indicator.style.position = 'fixed';
    indicator.style.top = '10px';
    indicator.style.right = '150px';
    indicator.style.backgroundColor = '#4CAF50';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '5px';
    indicator.style.fontSize = '14px';
    indicator.style.fontWeight = 'bold';
    indicator.style.zIndex = '1000';
    
    // Set initial language
    const currentLanguage = localStorage.getItem('language') || 'en';
    updateLanguageIndicator(currentLanguage, indicator);
    
    // Add to document
    document.body.appendChild(indicator);
    
    console.log('Added language indicator');
  }
  
  function updateLanguageIndicator(language, indicator) {
    // Get the indicator if not provided
    indicator = indicator || document.querySelector('.language-indicator');
    if (!indicator) return;
    
    // Update text and color
    indicator.textContent = language.toUpperCase();
    indicator.style.backgroundColor = language === 'en' ? '#4CAF50' : '#2196F3';
  }
});
