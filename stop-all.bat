@echo off
REM Asbestos Inspection Management System - Stop All Servers
REM Stops both Express backend (port 3000) and Vite frontend (port 5173)

echo.
echo Stopping all AIMS servers...
echo.

setlocal EnableExtensions

REM Stop process on port 3000 (Express backend)
echo [1] Checking for backend server on port 3000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3000 ^| findstr LISTENING') do (
  echo Stopping process %%a...
  taskkill /F /PID %%a >nul 2>&1
  if errorlevel 1 (
    echo [OK] No backend server running.
  ) else (
    echo [OK] Backend server stopped.
  )
)

REM Close backend cmd window (started by start-dev.bat)
taskkill /F /T /FI "WINDOWTITLE eq AIMS Backend - Port 3000" >nul 2>&1

REM Stop process on port 5173 (Vite frontend)
echo [2] Checking for frontend server on port 5173...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :5173 ^| findstr LISTENING') do (
  echo Stopping process %%a...
  taskkill /F /PID %%a >nul 2>&1
  if errorlevel 1 (
    echo [OK] No frontend server running.
  ) else (
    echo [OK] Frontend server stopped.
  )
)

REM Close frontend cmd windows (started by start-dev.bat / start-server.bat)
taskkill /F /T /FI "WINDOWTITLE eq Asbestos IMS Dev Server" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq AIMS Frontend - Port 5173" >nul 2>&1

echo.
echo [COMPLETE] All servers stopped.
echo.
endlocal
