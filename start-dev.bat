@echo off
REM Asbestos Inspection Management System - Development Start Script
REM Unified launcher using Node.js for robustness

echo.
echo ========================================
echo Asbestos Inspection Management System
echo Development Environment (Safe Launcher)
echo ========================================
echo.

setlocal enabledelayedexpansion

REM Ensure node_modules exists
if not exist "node_modules" (
    echo [INFO] Node modules missing. Attempting to install...
    call npm install
)

if not exist "server\node_modules" (
    echo [INFO] Server node modules missing. Attempting to install...
    cd server
    call npm install
    cd ..
)

echo [INFO] Starting servers in a unified window...
echo [INFO] This ensures we catch all error output.
echo.

node run-dev.js

pause
