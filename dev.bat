@echo off
setlocal

REM Starts both the API server and the client dev server in separate terminals.
REM Run this from the project root: double-click or `dev.bat` in cmd/PowerShell.

set ROOT=%~dp0

start "SecureShare API" cmd /k "cd /d \"%ROOT%server\" && npm run dev"
start "SecureShare Client" cmd /k "cd /d \"%ROOT%client\" && npm run dev"

echo.
echo Client: http://localhost:5173/
echo API health: http://localhost:3000/health
echo.
echo If registration/login says the API is unreachable, check the "SecureShare API" window.

endlocal
