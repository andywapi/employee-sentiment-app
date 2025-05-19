/**
 * Direct Translations for Employee Sentiment App
 * This file provides a simple, direct mapping between English and Spanish questions
 */

// Direct translation mappings
const TRANSLATIONS = {
  // Common variations and potential typos
  "Cómo calificaría su ambiente de trabajo?": "How would you rate your work environment?",
  "Qué tan satisfecho está con la colaboración en equipo?": "How satisfied are you with team collaboration?",
  "Se siente apoyado por la gerencia?": "Do you feel supported by management?",
  "Está satisfecho con sus oportunidades de crecimiento profesional?": "Are you satisfied with your career growth opportunities?",
  "Cómo calificaría su equilibrio entre trabajo y vida personal?": "How would you rate your work-life balance?",
  // English to Spanish
  "How would you rate your work environment?": "¿Cómo calificaría su ambiente de trabajo?",
  "How satisfied are you with team collaboration?": "¿Qué tan satisfecho está con la colaboración en equipo?",
  "Do you feel supported by management?": "¿Se siente apoyado por la gerencia?",
  "Are you satisfied with your career growth opportunities?": "¿Está satisfecho con sus oportunidades de crecimiento profesional?",
  "How would you rate your work-life balance?": "¿Cómo calificaría su equilibrio entre trabajo y vida personal?",
  "Are you satisfied with your compensation and benefits?": "¿Está satisfecho con su compensación y beneficios?",
  "Do you have the tools and resources needed to do your job effectively?": "¿Tiene las herramientas y recursos necesarios para realizar su trabajo de manera efectiva?",
  "Do you receive regular feedback about your performance?": "¿Recibe comentarios regulares sobre su desempeño?",
  "Do you feel your work is recognized and appreciated?": "¿Siente que su trabajo es reconocido y apreciado?",
  "What could we improve to make your work experience better?": "¿Qué podríamos mejorar para hacer que su experiencia de trabajo sea mejor?",
  "What aspects of your job do you find most rewarding?": "¿Qué aspectos de su trabajo encuentra más gratificantes?",
  "What challenges are you currently facing in your role?": "¿Qué desafíos está enfrentando actualmente en su rol?",
  "How would you describe the company culture?": "¿Cómo describiría la cultura de la empresa?",
  "Do you feel comfortable sharing ideas with your team?": "¿Se siente cómodo compartiendo ideas con su equipo?",
  "What additional training would help you in your role?": "¿Qué capacitación adicional le ayudaría en su rol?",
  "How clear are your job responsibilities?": "¿Qué tan claras son sus responsabilidades laborales?",
  "How satisfied are you with your salary?": "¿Qué tan satisfecho está con su sueldo?",
  
  // Spanish to English (reverse mapping)
  "¿Cómo calificaría su ambiente de trabajo?": "How would you rate your work environment?",
  "¿Qué tan satisfecho está con la colaboración en equipo?": "How satisfied are you with team collaboration?",
  "¿Se siente apoyado por la gerencia?": "Do you feel supported by management?",
  "¿Está satisfecho con sus oportunidades de crecimiento profesional?": "Are you satisfied with your career growth opportunities?",
  "¿Cómo calificaría su equilibrio entre trabajo y vida personal?": "How would you rate your work-life balance?",
  "¿Está satisfecho con su compensación y beneficios?": "Are you satisfied with your compensation and benefits?",
  "¿Tiene las herramientas y recursos necesarios para realizar su trabajo de manera efectiva?": "Do you have the tools and resources needed to do your job effectively?",
  "¿Recibe comentarios regulares sobre su desempeño?": "Do you receive regular feedback about your performance?",
  "¿Siente que su trabajo es reconocido y apreciado?": "Do you feel your work is recognized and appreciated?",
  "¿Qué podríamos mejorar para hacer que su experiencia de trabajo sea mejor?": "What could we improve to make your work experience better?",
  "¿Qué aspectos de su trabajo encuentra más gratificantes?": "What aspects of your job do you find most rewarding?",
  "¿Qué desafíos está enfrentando actualmente en su rol?": "What challenges are you currently facing in your role?",
  "¿Cómo describiría la cultura de la empresa?": "How would you describe the company culture?",
  "¿Se siente cómodo compartiendo ideas con su equipo?": "Do you feel comfortable sharing ideas with your team?",
  "¿Qué capacitación adicional le ayudaría en su rol?": "What additional training would help you in your role?",
  "¿Qué tan claras son sus responsabilidades laborales?": "How clear are your job responsibilities?",
  "¿Qué tan satisfecho está con su sueldo?": "How satisfied are you with your salary?"
};

// UI element translations
const UI_TRANSLATIONS = {
  en: {
    previous: "Previous",
    next: "Next",
    submit: "Submit",
    placeholder: "Enter your response (max 100 characters)"
  },
  es: {
    previous: "Anterior",
    next: "Siguiente",
    submit: "Enviar",
    placeholder: "Ingrese su respuesta (máximo 100 caracteres)"
  }
};

// Helper function to detect if text is in Spanish
function isSpanishText(text) {
  return text.includes('¿') || text.includes('á') || text.includes('é') || 
         text.includes('í') || text.includes('ó') || text.includes('ú') || 
         text.includes('ñ');
}

// Direct translation function
function translateText(text, targetLanguage) {
  if (!text) return text;
  
  // If target is Spanish and text is in English
  if (targetLanguage === 'es' && !isSpanishText(text)) {
    return TRANSLATIONS[text] || text;
  }
  
  // If target is English and text is in Spanish
  if (targetLanguage === 'en' && isSpanishText(text)) {
    return TRANSLATIONS[text] || text;
  }
  
  // If already in target language, return as is
  return text;
}

// Get UI translation
function getUITranslation(key, language) {
  return UI_TRANSLATIONS[language]?.[key] || key;
}

// Make functions available globally
window.DirectTranslations = {
  translateText,
  getUITranslation,
  isSpanishText
};
