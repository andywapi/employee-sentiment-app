/**
 * Simple sentiment analysis library for the Employee Sentiment App
 * This provides basic sentiment analysis capabilities without external dependencies
 */

const SentimentAnalyzer = (function() {
  // Positive and negative word lists
  const positiveWords = [
    // General positive terms
    'good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'wonderful', 'happy',
    'pleased', 'satisfied', 'enjoy', 'like', 'love', 'best', 'better', 'improved',
    'improvement', 'helpful', 'positive', 'success', 'successful', 'well', 'benefit',
    'benefits', 'effective', 'efficiently', 'recommend', 'appreciated', 'appreciate',
    'thank', 'thanks', 'grateful', 'glad', 'perfect', 'interesting', 'innovative',
    'impressive', 'exceptional', 'outstanding', 'superior', 'favorable', 'convenient',
    'comfortable', 'excited', 'exciting', 'enthusiasm', 'enthusiastic',
    'satisfied', 'satisfaction', 'satisfying', 'proud', 'pride', 'delight', 'delighted',
    'delightful', 'pleased', 'pleasure', 'pleasant', 'impressed', 'impressive',
    
    // Workplace-specific positive terms
    'productive', 'efficient', 'organized', 'motivated', 'inspiring', 'supportive',
    'collaborative', 'teamwork', 'leadership', 'mentoring', 'growth', 'opportunity',
    'opportunities', 'advancement', 'promotion', 'bonus', 'raise', 'recognition',
    'acknowledged', 'praised', 'rewarded', 'valued', 'respected', 'inclusive',
    'diverse', 'flexible', 'balance', 'fair', 'transparent', 'honest', 'integrity',
    'trust', 'reliable', 'dependable', 'professional', 'expertise', 'skilled',
    'competent', 'knowledgeable', 'learning', 'development', 'training', 'progress',
    'achievement', 'accomplished', 'succeed', 'succeeding', 'succeeded', 'win', 'winning',
    'won', 'achieve', 'achieved', 'achieving', 'excel', 'excelled', 'excelling',
    'thrive', 'thriving', 'thrived', 'prosper', 'prospering', 'prospered'
  ];

  const negativeWords = [
    // General negative terms
    'bad', 'poor', 'terrible', 'horrible', 'awful', 'disappointing', 'disappointed',
    'frustrating', 'frustrated', 'annoying', 'annoyed', 'unhappy', 'sad', 'hate',
    'dislike', 'worst', 'worse', 'difficult', 'hard', 'problem', 'issue', 'concern',
    'negative', 'fail', 'failure', 'failed', 'inadequate', 'insufficient', 'ineffective',
    'inefficient', 'slow', 'confusing', 'confused', 'complicated', 'complex', 'boring',
    'tired', 'exhausted', 'stressful', 'stress', 'painful', 'pain', 'trouble',
    'troublesome', 'inconvenient', 'uncomfortable', 'dissatisfied', 'dissatisfaction',
    'unpleasant', 'unfavorable', 'unfortunate', 'unprofessional', 'unreliable',
    'unreasonable', 'unacceptable', 'unsatisfactory', 'unsatisfied', 'useless',
    'worthless', 'waste', 'wasted', 'wasting', 'mediocre', 'subpar',
    
    // Workplace-specific negative terms
    'overworked', 'underpaid', 'micromanage', 'micromanaged', 'micromanaging',
    'unfair', 'biased', 'discrimination', 'harassment', 'bullying', 'toxic',
    'hostile', 'overwhelming', 'burnout', 'burnt', 'understaffed', 'turnover',
    'quit', 'quitting', 'resign', 'resigning', 'resigned', 'leave', 'leaving',
    'left', 'abandon', 'abandoning', 'abandoned', 'ignore', 'ignored', 'ignoring',
    'neglect', 'neglected', 'neglecting', 'mismanage', 'mismanaged', 'mismanaging',
    'disorganized', 'chaotic', 'unclear', 'vague', 'ambiguous', 'miscommunication',
    'conflict', 'argument', 'disagreement', 'dispute', 'tension', 'pressure',
    'deadline', 'overdue', 'late', 'delay', 'delayed', 'postpone', 'postponed',
    'cancel', 'canceled', 'cancellation', 'cutback', 'layoff', 'fired', 'termination',
    'demoted', 'demotion', 'undervalued', 'underappreciated', 'overlooked', 'ignored'
  ];

  // Intensifiers and negators that modify sentiment
  const intensifiers = [
    'very', 'really', 'extremely', 'absolutely', 'completely', 'highly', 'greatly',
    'particularly', 'especially', 'exceptionally', 'totally', 'utterly', 'quite',
    'remarkably', 'extraordinarily', 'incredibly', 'decidedly', 'deeply'
  ];

  const negators = [
    'not', 'no', 'never', 'neither', 'nor', 'none', 'nobody', 'nothing', 'nowhere',
    'hardly', 'scarcely', 'barely', 'doesn\'t', 'don\'t', 'didn\'t', 'isn\'t', 'aren\'t',
    'wasn\'t', 'weren\'t', 'hasn\'t', 'haven\'t', 'hadn\'t', 'won\'t', 'wouldn\'t',
    'can\'t', 'cannot', 'couldn\'t', 'shouldn\'t', 'won\'t', 'wouldn\'t'
  ];

  /**
   * Analyze the sentiment of a text
   * @param {string} text - The text to analyze
   * @returns {Object} Sentiment analysis result with score and label
   */
  function analyzeSentiment(text) {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return { score: 0, label: 'neutral', confidence: 0 };
    }

    // Normalize text: lowercase and remove punctuation
    const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = normalizedText.split(/\s+/);
    
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let wordCount = 0;
    
    // Analyze each word in context
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word.length < 2) continue; // Skip very short words
      
      wordCount++;
      
      // Check for negation (looking at previous word)
      const isNegated = i > 0 && negators.includes(words[i-1]);
      
      // Check for intensifiers
      const isIntensified = i > 0 && intensifiers.includes(words[i-1]);
      const intensifierMultiplier = isIntensified ? 2 : 1;
      
      // Calculate word sentiment
      if (positiveWords.includes(word)) {
        if (isNegated) {
          score -= 1 * intensifierMultiplier;
          negativeCount++;
        } else {
          score += 1 * intensifierMultiplier;
          positiveCount++;
        }
      } else if (negativeWords.includes(word)) {
        if (isNegated) {
          score += 1 * intensifierMultiplier;
          positiveCount++;
        } else {
          score -= 1 * intensifierMultiplier;
          negativeCount++;
        }
      }
    }
    
    // Normalize score between -1 and 1
    const normalizedScore = wordCount > 0 ? score / wordCount : 0;
    
    // Calculate confidence based on the proportion of sentiment words
    const sentimentWordCount = positiveCount + negativeCount;
    const confidence = wordCount > 0 ? sentimentWordCount / wordCount : 0;
    
    // Determine sentiment label
    let label = 'neutral';
    if (normalizedScore > 0.03) {
      label = normalizedScore > 0.12 ? 'very positive' : 'positive';
    } else if (normalizedScore < -0.03) {
      label = normalizedScore < -0.12 ? 'very negative' : 'negative';
    }
    
    return {
      score: normalizedScore,
      label: label,
      confidence: confidence,
      details: {
        positiveWords: positiveCount,
        negativeWords: negativeCount,
        totalWords: wordCount
      }
    };
  }

  /**
   * Get the color for a sentiment score
   * @param {number} score - Sentiment score between -1 and 1
   * @returns {string} Color in hex format
   */
  function getSentimentColor(score) {
    if (score > 0.12) return '#4CAF50'; // Very positive - Green
    if (score > 0.03) return '#8BC34A'; // Positive - Light green
    if (score > -0.03) return '#9E9E9E'; // Neutral - Gray
    if (score > -0.12) return '#FF9800'; // Negative - Orange
    return '#F44336'; // Very negative - Red
  }

  /**
   * Get a descriptive label for a sentiment score
   * @param {number} score - Sentiment score between -1 and 1
   * @returns {string} Descriptive label
   */
  function getSentimentLabel(score) {
    if (score > 0.12) return 'Very Positive';
    if (score > 0.03) return 'Positive';
    if (score > -0.03) return 'Neutral';
    if (score > -0.12) return 'Negative';
    return 'Very Negative';
  }

  // Public API
  return {
    analyze: analyzeSentiment,
    getColor: getSentimentColor,
    getLabel: getSentimentLabel
  };
})();

// Make available globally
window.SentimentAnalyzer = SentimentAnalyzer;
