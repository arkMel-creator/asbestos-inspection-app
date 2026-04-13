@echo off
REM Asbestos Inspection Management System - Setup Script
REM This script initializes the project and checks all prerequisites

echo.
echo ========================================
echo AIMS Project Setup
echo ========================================
echo.

setlocal enabledelayedexpansion

REM Check Node.js
echo [CHECK] Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Found !NODE_VERSION!
)

echo.

REM Check npm
echo [CHECK] npm installation...
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm not found.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] Found npm !NPM_VERSION!
)

echo.

REM Install frontend dependencies
echo [INSTALL] Frontend dependencies...
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed.
) else (
    echo [OK] Frontend dependencies already installed.
)

echo.

REM Install backend dependencies
echo [INSTALL] Backend dependencies...
if not exist "server\node_modules" (
    cd server
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies.
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Backend dependencies installed.
) else (
    echo [OK] Backend dependencies already installed.
)

echo.

REM Create .env file if it doesn't exist
echo [CHECK] Backend configuration...
if not exist "server\.env" (
    echo [CREATE] Creating server\.env from template...
    copy server\.env.example server\.env >nul
    echo [OK] Created server\.env - Please review and customize if needed.
) else (
    echo [OK] server\.env already exists.
)

echo.

REM Build frontend
echo [BUILD] Building frontend...
call node_modules\.bin\vite.cmd build >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Frontend build warning - check if needed.
) else (
    echo [OK] Frontend built successfully.
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Review server\.env configuration
echo 2. Run 'start-dev.bat' for development mode
echo 3. Or run 'start-prod.bat' for production mode
echo.
echo For more information, see README.md
echo.
pause
