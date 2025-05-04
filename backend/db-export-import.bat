@echo off
echo Employee Sentiment App - Database Export/Import Tool
echo ===================================================
echo.
echo This tool will help you export data from your Render MongoDB Atlas database
echo and import it into your local development MongoDB database.
echo.
echo IMPORTANT: MongoDB Tools (mongodump, mongorestore) need to be installed first.
echo.
echo Step 1: Install MongoDB Tools if not already installed
echo ---------------------------------------------------
echo 1. Download MongoDB Database Tools from:
echo    https://www.mongodb.com/try/download/database-tools
echo 2. Install the tools
echo 3. Add the bin directory to your PATH (usually C:\Program Files\MongoDB\Tools\100\bin)
echo 4. Restart this script after installation
echo.
echo Step 2: Export/Import Database
echo ----------------------------
echo.

set /p CONTINUE="Have you installed MongoDB Tools? (Y/N): "
if /i "%CONTINUE%" neq "Y" goto :EOF

set /p ATLAS_URI="Enter your MongoDB Atlas connection string: "
set LOCAL_DB=mongodb://localhost:27017/employee_sentiment_db
set EXPORT_DIR=%~dp0db_export

echo.
echo Step 1: Creating export directory...
if not exist "%EXPORT_DIR%" mkdir "%EXPORT_DIR%"

echo.
echo Step 2: Exporting data from MongoDB Atlas...
echo This may take a few moments...
echo Running: mongodump --uri="%ATLAS_URI%" --out="%EXPORT_DIR%"
mongodump --uri="%ATLAS_URI%" --out="%EXPORT_DIR%"

if %ERRORLEVEL% neq 0 (
  echo.
  echo Error: mongodump failed. Please make sure MongoDB Tools are installed correctly.
  echo and that your connection string is valid.
  goto :END
)

echo.
echo Step 3: Importing data to local MongoDB...
echo This may take a few moments...
echo Running: mongorestore --uri="%LOCAL_DB%" --dir="%EXPORT_DIR%"
mongorestore --uri="%LOCAL_DB%" --dir="%EXPORT_DIR%"

if %ERRORLEVEL% neq 0 (
  echo.
  echo Error: mongorestore failed. Please make sure your local MongoDB server is running.
  goto :END
)

echo.
echo Process complete!
echo Your local database should now have the same data as your Render deployment.

:END
echo.
pause
