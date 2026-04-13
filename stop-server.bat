@echo off
setlocal EnableExtensions

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
  taskkill /F /PID %%a
)

echo Dev server stopped (port 5173 released).
endlocal
