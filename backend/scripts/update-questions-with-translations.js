/**
 * Update Questions with Translations
 * This script updates existing questions in the database with both English and Spanish translations
 */

const mongoose = require('mongoose');
const SurveyQuestion = require('../models/SurveyQuestion');

// Translations mapping
const translations = {
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

// Helper function to detect if text is in Spanish
function isSpanishText(text) {
  return text.includes('¿') || text.includes('á') || text.includes('é') || 
         text.includes('í') || text.includes('ó') || text.includes('ú') || 
         text.includes('ñ');
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_sentiment_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  updateQuestions();
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

async function updateQuestions() {
  try {
    // Get all questions
    const questions = await SurveyQuestion.find({});
    console.log(`Found ${questions.length} questions to update`);
    
    let updatedCount = 0;
    
    // Update each question with translations
    for (const question of questions) {
      const originalText = question.text;
      
      // Determine if the original text is in English or Spanish
      const isSpanish = isSpanishText(originalText);
      
      if (isSpanish) {
        // If original is in Spanish, set text_es to original and translate to English for text_en
        question.text_es = originalText;
        question.text_en = translations[originalText] || originalText;
      } else {
        // If original is in English, set text_en to original and translate to Spanish for text_es
        question.text_en = originalText;
        question.text_es = translations[originalText] || originalText;
      }
      
      await question.save();
      updatedCount++;
      
      console.log(`Updated question: "${originalText}"`);
      console.log(`  English: "${question.text_en}"`);
      console.log(`  Spanish: "${question.text_es}"`);
    }
    
    console.log(`Successfully updated ${updatedCount} questions`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating questions:', error);
    process.exit(1);
  }
}
