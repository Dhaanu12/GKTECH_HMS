@echo off
REM HMS Backend Start Script

echo ================================================
echo Starting HMS Backend Server
echo ================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the server in development mode
echo Starting server in development mode...
echo Server will run at: http://localhost:5000
echo API endpoints at: http://localhost:5000/api
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
