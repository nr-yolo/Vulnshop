@echo off
echo ==================================
echo    VulnShop Setup Script
echo ==================================
echo.
echo WARNING: This application is INTENTIONALLY VULNERABLE
echo FOR SECURITY TRAINING PURPOSES ONLY
echo.
set /p confirm="Do you understand and wish to continue? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo Setup cancelled.
    exit /b 1
)

echo.
echo Installing backend dependencies...
cd backend
call npm install

echo.
echo Initializing database...
call npm run init-db

echo.
echo Installing frontend dependencies...
cd ..\frontend
call npm install

echo.
echo ===================================
echo Setup complete!
echo ===================================
echo.
echo To start the application:
echo   1. Open Command Prompt 1: cd backend ^&^& npm start
echo   2. Open Command Prompt 2: cd frontend ^&^& npm start
echo.
echo Default admin credentials: admin/admin
echo See README.md for vulnerability documentation
echo.
pause
