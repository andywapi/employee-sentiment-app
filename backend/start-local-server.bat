@echo off
echo Starting Employee Sentiment App local server...
echo.
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" server.js
