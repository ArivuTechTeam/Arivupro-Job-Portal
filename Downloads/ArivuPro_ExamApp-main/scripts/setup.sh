#!/bin/bash

# Development setup script for ArivuPro Exam App

echo "Starting ArivuPro setup..."

# Backend setup
echo "Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements/dev.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    cp ../.env.example .env
    echo "Created .env file. Please update it with your settings."
fi

# Run migrations
python manage.py migrate

# Create superuser prompt
read -p "Create superuser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend

# Install dependencies
npm install

# Create .env if it doesn't exist
if [ ! -f ".env.local" ]; then
    cp ../.env.example .env.local
    echo "Created frontend .env.local file"
fi

cd ..

echo "Setup complete! Run 'npm start' in frontend and 'python manage.py runserver' in backend"
