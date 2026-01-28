@echo off
REM HMS Backend Setup Script

echo ================================================
echo Hospital Management System - Backend Setup
echo ================================================
echo.

REM Check if PostgreSQL is installed
echo Checking PostgreSQL installation...
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: psql command not found in PATH
    echo.
    echo Please ensure PostgreSQL is installed and added to PATH
    echo Typical PostgreSQL bin path: C:\Program Files\PostgreSQL\{version}\bin
    echo.
    echo You can:
    echo 1. Add PostgreSQL bin folder to system PATH
    echo 2. Or use pgAdmin to run the SQL files manually
    echo.
    pause
    exit /b 1
)

echo PostgreSQL found!
echo.

REM Create database
echo Creating database 'hms_database'...
psql -U postgres -c "CREATE DATABASE hms_database;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Database created successfully!
) else (
    echo Database might already exist or error occurred
    echo This is normal if the database was previously created
)
echo.

REM Run schema
echo Running database schema...
psql -U postgres -d hms_database -f database/schema.sql
if %ERRORLEVEL% EQU 0 (
    echo Schema executed successfully!
) else (
    echo Error executing schema
    pause
    exit /b 1
)

echo Running auth tables...
psql -U postgres -d hms_database -f database/auth_tables.sql
if %ERRORLEVEL% EQU 0 (
    echo Auth tables executed successfully!
) else (
    echo Error executing auth tables
    pause
    exit /b 1
)

echo Running seed data...
psql -U postgres -d hms_database -f database/seed_data.sql
if %ERRORLEVEL% EQU 0 (
    echo Seed data executed successfully!
) else (
    echo Error executing seed data
    pause
    exit /b 1
)

echo.
echo ================================================
echo Database setup completed!
echo ================================================
echo.
echo Next steps:
echo 1. Start the server with: npm run dev
echo 2. Access the API at: http://localhost:5000/api
echo.
pause
