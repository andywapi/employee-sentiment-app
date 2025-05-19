@echo off
echo Running question translation update script...
set NODE_ENV=development
set MONGODB_URI=mongodb://localhost:27017/employee_sentiment_db
node update-questions-with-translations.js
echo Done.
pause
