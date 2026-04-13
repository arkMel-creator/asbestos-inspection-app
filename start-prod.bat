@echo off
REM Asbestos Inspection Management System - Production Start Script
REM This script builds and runs the application in production mode

echo.
echo ========================================
echo Asbestos Inspection Management System
echo Production Build & Run
echo ========================================
echo.

setlocal enabledelayedexpansion

REM Check dependencies
if not exist "node_modules" (
    echo [ERROR] Dependencies not installed. Run 'npm install' first.
    pause
    exit /b 1
)

if not exist "server\node_modules" (
    echo [ERROR] Server dependencies not installed. Run 'cd server && npm install' first.
    pause
    exit /b 1
)

REM Build frontend
echo [1] Building frontend...
call node_modules\.bin\vite.cmd build
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo [OK] Frontend built successfully.
echo.

REM Start server
echo [2] Starting production server on port 3000...
echo [INFO] Open your browser to http://localhost:3000
echo.
cd server
set NODE_ENV=production
node server.js

pause
