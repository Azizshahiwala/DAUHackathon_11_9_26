@echo off
title SolePulse – Developer Mode

REM Change to the directory containing this bat file
REM (handles spaces in the path correctly)
pushd "%~dp0"

echo ============================================================
echo  SolePulse   ^|   DEVELOPER MODE
echo  Backend  -^>  http://localhost:5000
echo  Frontend -^>  http://localhost:5173
echo ============================================================
echo.

REM ── Backend (Flask dev server, hot-reload on) ────────────────────────────
start "SolePulse Backend [DEV]" cmd /k "pushd "%~dp0backend" && call "%~dp0.venv\Scripts\activate.bat" && set FLASK_APP=wsgi.py && set FLASK_ENV=development && set FLASK_DEBUG=1 && echo [Backend] Flask on http://localhost:5000 && python -m flask run --port 5000"

REM Give Flask a moment to start before launching Vite
timeout /t 3 /nobreak >nul

REM ── Frontend (Vite dev server, HMR on) ───────────────────────────────────
start "SolePulse Frontend [DEV]" cmd /k "pushd "%~dp0frontend" && echo [Frontend] Vite on http://localhost:5173 && npm run dev"

echo Both servers are starting in separate windows.
echo Press any key to close this launcher window.
popd
pause >nul

