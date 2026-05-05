@echo off
REM Development setup script for ArivuPro Exam App (Windows)

echo Starting ArivuPro setup...

REM Backend setup
echo Setting up backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
pip install -r requirements/dev.txt

REM Create .env if it doesn't exist
if not exist ".env" (
    copy ..\\.env.example .env
    echo Created .env file. Please update it with your settings.
)

REM Run migrations
python manage.py migrate

REM Ask to create superuser
set /p create_super="Create superuser? (y/n): "
if /i "%create_super%"=="y" (
    python manage.py createsuperuser
)

cd ..

REM Frontend setup
echo Setting up frontend...
cd frontend

REM Install dependencies
call npm install

REM Create .env if it doesn't exist
if not exist ".env.local" (
    copy ..\\.env.example .env.local
    echo Created frontend .env.local file
)

cd ..

echo.
echo Setup complete!
echo.
echo To start development:
echo 1. Backend: cd backend && python manage.py runserver
echo 2. Frontend: cd frontend && npm start
pause
