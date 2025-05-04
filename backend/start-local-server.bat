@echo off
echo Starting Employee Sentiment App server in DEVELOPMENT mode...
echo Authentication will be BYPASSED in this mode.
echo.

cd /d "%~dp0"

echo Checking for processes using port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Found process with PID: %%a using port 5000
    echo Terminating process...
    taskkill /F /PID %%a
    echo Process terminated.
    timeout /t 1 /nobreak >nul
)
echo Port check complete.
echo.

set NODE_ENV=development
set PORT=5000
set MONGODB_URI=mongodb://localhost:27017/employee_sentiment_db
echo Environment variables set:
echo NODE_ENV=%NODE_ENV%
echo PORT=%PORT%
echo MONGODB_URI=%MONGODB_URI%
echo.
echo Starting server...
"C:\Program Files\nodejs\node.exe" server.js
pause
