// i18n.js - Internationalization System
window.i18n = {
  currentLanguage: 'en',
  translations: {},

  initLanguage() {
    this.currentLanguage = localStorage.getItem('language') || 'en';
  },

  setLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    this.updatePageTranslations();
  },

  getLanguage() {
    return this.currentLanguage;
  },

  translate(key) {
    const translations = this.translations[this.currentLanguage];
    return translations && translations[key] ? translations[key] : key;
  },

  translateQuestion(text) {
    // For questions, we'll use the language-specific version if available
    const question = document.querySelector(`[data-original-text="${text}"]`);
    if (question) {
      return this.currentLanguage === 'es' ? 
        question.dataset.spanishText || text :
        question.dataset.englishText || text;
    }
    return text;
  },

  updatePageTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.translate(key);
    });

    // Update all elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.translate(key);
    });
  }
};
