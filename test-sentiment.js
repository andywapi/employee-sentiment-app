/**
 * Test script for the improved sentiment analysis
 * This script will analyze sample employee responses and show their sentiment classifications
 */

// Sample responses with various sentiments
const sampleResponses = [
  // Positive responses
  "I really enjoy working with my team, they are very supportive.",
  "The new leadership training program has been excellent for my professional development.",
  "I appreciate the flexible work hours that help me maintain work-life balance.",
  "My manager provides helpful feedback that has improved my performance.",
  "The collaborative environment makes it easy to share ideas and grow.",
  
  // Negative responses
  "I feel overworked and understaffed in our department.",
  "Communication from management has been poor and confusing.",
  "The micromanagement style is frustrating and reduces my productivity.",
  "I'm concerned about the lack of growth opportunities in my position.",
  "The constant deadline pressure is causing burnout among team members.",
  
  // Mixed/Neutral responses
  "Some aspects of the new system are good, but others need improvement.",
  "The office location is convenient, though the parking situation is difficult.",
  "I like my coworkers but find the work itself somewhat boring.",
  "The salary is acceptable but could be better compared to industry standards.",
  "Training resources are available, but they're not always relevant to my role."
];

// Load the sentiment analyzer
const fs = require('fs');
const path = require('path');

// Read the sentiment.js file
const sentimentJsPath = path.join(__dirname, 'backend', 'public', 'sentiment.js');
const sentimentJs = fs.readFileSync(sentimentJsPath, 'utf8');

// Create a modified version that works in Node.js
const modifiedSentimentJs = sentimentJs
  .replace('const SentimentAnalyzer = (function() {', 'const SentimentAnalyzer = (function() {')
  .replace('window.SentimentAnalyzer = SentimentAnalyzer;', '');

// Execute the modified script to get the SentimentAnalyzer object
let SentimentAnalyzer;
eval(modifiedSentimentJs + '; SentimentAnalyzer = SentimentAnalyzer;');

// Function to test and display sentiment analysis results
function testSentimentAnalysis() {
  console.log('===== SENTIMENT ANALYSIS TEST =====\n');
  
  // Analyze each sample response
  sampleResponses.forEach((response, index) => {
    const sentiment = SentimentAnalyzer.analyze(response);
    const color = SentimentAnalyzer.getColor(sentiment.score);
    const label = SentimentAnalyzer.getLabel(sentiment.score);
    
    console.log(`Response #${index + 1}:`);
    console.log(`"${response}"`);
    console.log(`Sentiment: ${label} (score: ${sentiment.score.toFixed(4)})`);
    console.log(`Confidence: ${(sentiment.confidence * 100).toFixed(1)}%`);
    console.log(`Details: ${sentiment.details.positiveWords} positive words, ${sentiment.details.negativeWords} negative words`);
    console.log('-----------------------------------\n');
  });
  
  // Summary
  const results = sampleResponses.map(response => SentimentAnalyzer.analyze(response));
  
  const sentimentCounts = {
    'Very Positive': 0,
    'Positive': 0,
    'Neutral': 0,
    'Negative': 0,
    'Very Negative': 0
  };
  
  results.forEach(result => {
    const label = SentimentAnalyzer.getLabel(result.score);
    sentimentCounts[label]++;
  });
  
  console.log('===== SUMMARY =====');
  console.log('Distribution of sentiments:');
  Object.entries(sentimentCounts).forEach(([label, count]) => {
    console.log(`${label}: ${count} responses`);
  });
}

// Run the test
testSentimentAnalysis();
