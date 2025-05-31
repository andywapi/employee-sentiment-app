const mongoose = require('mongoose');
require('./models/SurveyResponse');

mongoose.connect('mongodb://localhost:27017/employee-sentiment-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  try {
    await mongoose.connection.dropCollection('surveyresponses');
    console.log('Successfully cleared survey responses');
  } catch (error) {
    if (error.code === 26) {
      console.log('Collection does not exist, nothing to clear');
    } else {
      console.error('Error clearing database:', error);
    }
  }
  process.exit(0);
})
.catch(error => {
  console.error('Error connecting to MongoDB:', error);
  process.exit(1);
});
