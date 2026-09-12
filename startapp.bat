@echo off
title SolePulse – Production Mode

REM Change to the directory containing this bat file
REM (handles spaces in path correctly)
pushd "%~dp0"

echo ============================================================
echo  SolePulse   ^|   PRODUCTION MODE
echo  App URL  -^>  http://localhost:8000
echo ============================================================
echo.

REM ── Step 1: Activate venv ────────────────────────────────────────────────
echo [1/5] Activating virtual environment...
if not exist ".venv\Scripts\activate.bat" (
    echo ERROR: .venv\Scripts\activate.bat not found.
    echo Make sure the .venv folder exists at the repo root.
    pause & exit /b 1
)
call ".venv\Scripts\activate.bat"

REM ── Step 2: Install / update backend dependencies ────────────────────────
echo [2/5] Installing backend dependencies...
pip install -r "backend\requirements.txt" --quiet
if %errorlevel% neq 0 (
    echo ERROR: pip install failed.
    pause & exit /b 1
)

REM ── Step 3: Build frontend ───────────────────────────────────────────────
echo [3/5] Installing frontend dependencies and building...
pushd frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: npm install failed.
    pause & exit /b 1
)
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: npm build failed.
    pause & exit /b 1
)
popd

REM ── Step 4: Copy dist into Flask static folder ───────────────────────────
echo [4/5] Copying frontend build to backend static folder...
if not exist "backend\app\dist" mkdir "backend\app\dist"
xcopy /E /I /Y "frontend\dist" "backend\app\dist" >nul

REM ── Step 5: Launch Flask production server ───────────────────────────────
echo [5/5] Starting Flask production server on http://localhost:8000 ...
pushd backend
set FLASK_APP=wsgi.py
set FLASK_ENV=production
set FLASK_DEBUG=0
python -m flask run --host=0.0.0.0 --port=8000
popd

echo.
echo Server stopped.
popd
pause

