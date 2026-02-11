@echo off
echo ========================================
echo RESTARTING BACKEND SERVER
echo ========================================
echo.
echo Stopping any running Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Clearing Node.js cache...
cd backend
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Cache cleared.

echo.
echo Starting backend server...
start cmd /k "npm start"

echo.
echo ========================================
echo Backend server is restarting...
echo Please wait for "Server running" message
echo ========================================
pause
