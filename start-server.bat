@echo off
setlocal EnableExtensions
cd /d "%~dp0"

REM Kill any process already using the Vite port (default 5173)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

REM Install deps if needed
call npm install >nul 2>&1

REM Start Vite dev server in a dedicated window
start "Asbestos IMS Dev Server" cmd /k "npm run dev"

echo Dev server starting. Check the new window for the exact URL.
endlocal
