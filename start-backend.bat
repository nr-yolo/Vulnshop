@echo off
title VulnShop - Backend Server
color 0A

echo ====================================
echo   VulnShop Backend Server
echo ====================================
echo.
echo Starting backend on http://localhost:3001
echo.
echo WARNING: This is a vulnerable application
echo         For training purposes only!
echo.

cd backend
call npm start
