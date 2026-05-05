# ArivuPro Exam App - Development Setup Guide

## Project Structure

```
ArivuPro_ExamApp/
├── backend/              # Django REST API
│   ├── config/          # Django settings, wsgi, asgi
│   ├── apps/            # Django applications
│   │   ├── accounts/
│   │   ├── exams/
│   │   └── evaluator/
│   ├── requirements/    # Python dependencies
│   │   ├── base.txt
│   │   ├── dev.txt
│   │   └── prod.txt
│   ├── tests/          # Backend tests
│   ├── media/          # User uploads
│   └── staticfiles/    # Static files
├── frontend/            # React application
│   ├── src/
│   │   ├── assets/     # Images, fonts
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom hooks
│   │   ├── context/    # Context API
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── utils/      # Utilities
│   │   └── constants/  # Constants
│   └── tests/          # Frontend tests
├── docs/               # Documentation
├── scripts/            # Utility scripts
├── .github/workflows/  # CI/CD pipelines
├── docker-compose.yml  # Docker orchestration
├── Dockerfile          # Django container
└── .env.example        # Environment template
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

## Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd ArivuPro_ExamApp
```

### 2. Backend Setup

#### Using Virtual Environment
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements/dev.txt

# Create .env file
cp ../.env.example .env

# Run migrations
python manage.py migrate

# Load seed data (if available)
python manage.py seed_data

# Start development server
python manage.py runserver
```

#### Using Docker
```bash
docker-compose up django
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp ../.env.example .env.local

# Start development server
npm start
```

### 4. Database Setup

The project uses PostgreSQL. Update `.env` with your database credentials:

```env
DB_NAME=arivu_db
DB_USER=arivu
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

## Running Tests

### Backend Tests
```bash
cd backend
pytest --cov=. --cov-report=html
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Building for Production

### Backend
```bash
cd backend
pip install -r requirements/prod.txt
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Frontend
```bash
cd frontend
npm run build
serve -s build
```

## Using Docker Compose

```bash
# Start all services
docker-compose up

# Build images
docker-compose build

# Stop services
docker-compose down

# View logs
docker-compose logs -f django
docker-compose logs -f react
```

## Useful Commands

### Django Management
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic
```

### Database
```bash
# Backup database
pg_dump -U arivu -d arivu_db > backup.sql

# Restore database
psql -U arivu -d arivu_db < backup.sql
```

## Environment Variables

See `.env.example` for all available configuration options. Copy to `.env` and update values:

```bash
cp .env.example .env
```

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port 8000
lsof -i :8000
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Verify connection
psql -U arivu -d arivu_db
```

### Node Modules Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## Support

For issues and questions, please open a GitHub issue or contact the development team.
