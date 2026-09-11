@echo off
echo Building Full-Stack App for Production...

cd frontend
call npm install
call npm run build
echo Copying frontend build to backend...
mkdir "..\backend\app\dist" 2>nul
xcopy /E /I /Y dist "..\backend\app\dist"
cd ..\backend

echo Installing backend requirements...
pip install -r requirements.txt

echo Starting Production Server (host=0.0.0.0)...
set FLASK_APP=wsgi.py
set FLASK_ENV=production
set FLASK_DEBUG=0
python -m flask run --host=0.0.0.0 --port=8000
