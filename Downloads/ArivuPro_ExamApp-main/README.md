# ArivuPro ExamApp

### AI-Powered Score Improvement System for CA / CS / CMA Students

> Upload your answer script → AI evaluates it → Get a detailed report → Improve your score

---

## What is ArivuPro?

ArivuPro is a full-stack web application that helps students preparing for **CA, CS, and CMA** professional exams in India to understand **exactly why they lost marks** and **how to improve** — not just a score, but a complete learning feedback loop.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [Project Overview](docs/PROJECT_OVERVIEW.md) | Architecture, tech stack, models |
| [Features List](docs/FEATURES.md) | 100+ features across all pages |
| [User Journey](docs/USER_JOURNEY.md) | Step-by-step flows with diagrams |
| [Workflow](docs/WORKFLOW.md) | Technical API and data flows |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + Django REST Framework |
| Frontend | React 18 |
| Database | PostgreSQL / SQLite |
| Auth | JWT (SimpleJWT) |
| Real-time | Firebase Firestore |
| AI | Anthropic Claude / OpenAI GPT-4o / Smart Text Fallback |
| OCR | PyPDF2 + Tesseract |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)
- Tesseract OCR (for scanned answer scripts)

### Option 1: Local Setup

#### Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/dev.txt

# Configure environment
cp ../.env.example .env

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp ../.env.example .env.local

# Start development server
npm start
```

The app will be available at `http://localhost:3000`

### Option 2: Docker Setup

```bash
# Copy environment file
cp .env.example .env

# Start all services
docker-compose up

# Create superuser (in another terminal)
docker-compose exec django python manage.py createsuperuser
```

Access the app at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`

### Option 3: Automated Setup Script

**Windows:**
```bash
scripts\setup.bat
```

**macOS/Linux:**
```bash
bash scripts/setup.sh
```

---

## 📁 Project Structure

```
ArivuPro_ExamApp/
├── .claude/                    # AI Context & Instructions (Claude/Cursor)
│   ├── claude.md               # Entry point for AI assistants
│   ├── project_context.md      # High-level overview
│   ├── tech_stack.md           # Technical details
│   ├── architecture.md         # Folder structure & flows
│   └── custom_instructions.md  # Coding rules & standards
├── backend/                    # Django REST API
│   ├── config/                # Django settings & WSGI
│   ├── apps/                  # Django applications
│   │   ├── accounts/          # User management & auth
│   │   ├── exams/             # Exam papers & questions
│   │   └── evaluator/         # AI evaluation engine
│   ├── requirements/          # Python dependencies
│   │   ├── base.txt           # Core dependencies
│   │   ├── dev.txt            # Development tools
│   │   └── prod.txt           # Production dependencies
│   ├── tests/                 # Backend unit tests
│   ├── media/                 # User uploads
│   ├── staticfiles/           # Static files
│   ├── manage.py
│   └── seed_data.py           # Database seeder
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── assets/            # Images, fonts, etc.
│   │   ├── components/        # React components
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   └── student/
│   │   ├── config/            # App configuration
│   │   ├── constants/         # Constants & enums
│   │   ├── context/           # Context API
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── styles/            # Global styles
│   │   ├── utils/             # Utility functions
│   │   ├── App.js
│   │   └── index.js
│   ├── tests/                 # Frontend tests
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── docs/                       # Documentation
│   ├── SETUP.md               # Setup instructions
│   ├── ARCHITECTURE.md        # System architecture
│   └── API.md                 # API documentation
│
├── .github/workflows/         # CI/CD pipelines
│   └── ci.yml                # Automated tests & builds
│
├── scripts/                    # Utility scripts
│   ├── setup.sh               # Unix setup script
│   └── setup.bat              # Windows setup script
│
├── docker-compose.yml         # Container orchestration
├── Dockerfile                 # Django container image
├── .env.example               # Environment template
├── .editorconfig              # Editor configuration
├── .dockerignore              # Docker ignore file
├── .gitignore                 # Git ignore file
└── README.md                  # This file
```

---

## 📖 Documentation

- **[SETUP.md](docs/SETUP.md)** - Detailed setup and installation guide
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and API documentation
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Contribution guidelines (if available)

---

## 🔧 Development

### Running Tests

**Backend:**
```bash
cd backend
pytest --cov=. --cov-report=html
```

**Frontend:**
```bash
cd frontend
npm test
```

### Code Quality

**Backend:**
```bash
cd backend

# Format code
black .

# Check for linting issues
flake8 .

# Check imports
isort .
```

**Frontend:**
```bash
cd frontend
npm run lint
```

### Database Migrations

```bash
cd backend

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/accounts/register/` - User registration
- `POST /api/accounts/login/` - User login
- `POST /api/accounts/token/refresh/` - Refresh JWT token
- `POST /api/accounts/logout/` - User logout

### Exams
- `GET /api/exams/` - List all exam papers
- `POST /api/exams/create/` - Create new exam paper
- `GET /api/exams/{id}/` - Get exam details
- `PUT /api/exams/{id}/update/` - Update exam paper
- `DELETE /api/exams/{id}/delete/` - Delete exam paper

### Submissions & Evaluations
- `POST /api/exams/submit/` - Submit answer script
- `GET /api/evaluator/evaluate/` - Evaluate submission
- `GET /api/evaluations/` - Get evaluation history

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for complete API documentation.

---

## 🔐 Environment Configuration

See `.env.example` for all available settings. Key configuration:

```env
# Django
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=arivu_db
DB_USER=arivu
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Frontend
REACT_APP_API_URL=http://localhost:8000/api

# AI
OPENAI_API_KEY=your-api-key
```

---

## 🚢 Deployment

### Using Docker Compose
```bash
docker-compose up --build
```

### Manual Deployment

**Backend:**
```bash
cd backend
pip install -r requirements/prod.txt
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
npm install -g serve
serve -s build -l 3000
```

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -i :8000  # Find process
kill -9 <PID>  # Kill it
```

**Database connection error:**
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Verify credentials in .env
psql -U arivu -d arivu_db
```

**Module not found:**
```bash
# Reinstall dependencies
pip install -r requirements/dev.txt --force-reinstall
```

See [SETUP.md](docs/SETUP.md) for more troubleshooting tips.

---

## 📝 License

This project is proprietary and confidential.

---

## 👥 Support

For issues and questions, please open a GitHub issue or contact the development team.

---

## 🔄 Updates

- **v1.0.0** - Project restructuring and best practices implementation
  - Reorganized backend/frontend structure
  - Added Docker support
  - Added CI/CD pipeline
  - Added comprehensive documentation
  - Split requirements for dev/prod/base

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Tesseract OCR (for scanned answer scripts)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run migrations
python manage.py makemigrations accounts exams evaluator
python manage.py migrate

# Seed database with CA/CS/CMA subjects
python manage.py shell < seed_data.py

# Start server
python manage.py runserver
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm start
```

The app will be available at `http://localhost:3000`

### 3. Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |

Register as a student through the registration page.

---

## Project Structure

```
ArivuPro_ExamApp/
├── backend/            Django REST API + AI engine
├── frontend/           React 18 app (28 pages)
├── docs/               Project documentation
├── .env.example        Environment variables template
└── docker-compose.yml  Docker setup
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for dev)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in your values
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env            # fill in Firebase keys
npm start
```

### Create Admin Account

```bash
# Option 1: Management command
python manage.py make_admin YOUR_USERNAME

# Option 2: Via the app
# Visit /admin → Register Admin → use admin_code from settings
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
SECRET_KEY=your-django-secret-key
DB_NAME=arivu_db
DB_USER=arivu
DB_PASSWORD=your_password
OPENAI_API_KEY=sk-...          # optional
ANTHROPIC_API_KEY=sk-ant-...   # optional (preferred)
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123...:web:abc...
```

> **Note:** AI features work without API keys using smart text fallback analysis.

---

## API Overview

```
POST  /api/auth/login/                  Student/Admin login
POST  /api/auth/register/               Student registration
GET   /api/exams/papers/                List published papers
POST  /api/exams/papers/                Create paper (admin)
POST  /api/exams/submissions/           Submit answer script
GET   /api/exams/submissions/{id}/report/   Get evaluation report
POST  /api/exams/evaluations/{id}/approve/  Approve evaluation (admin)
GET   /api/evaluate/analytics/overview/    Student analytics
```

Full API reference → [docs/WORKFLOW.md](docs/WORKFLOW.md)

---

## User Roles

| Role | Key Capabilities |
|------|-----------------|
| **Student** | Browse papers, upload answers, view reports, track progress |
| **Admin** | All student access + create papers, manage users, approve evaluations |
| **Evaluator** | View all submissions + approve evaluations |

---

## Firebase Setup (Real-time Notifications)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open/create project → Project Settings → Web app → Copy config
3. Paste values into `frontend/.env`
4. Enable Firestore → Create database → Start in test mode
5. Restart React: `npm start`

Verify connection: Admin → Settings → System Info → **🔌 Test Connection**

---

## Deployment

```bash
# Docker (recommended)
docker-compose up --build

# Manual
# Backend: gunicorn config.exam_review.wsgi:application
# Frontend: npm run build → serve /build
```

---

## Repository

**GitHub:** [https://github.com/ArivuPro914/ArivuPro_ExamApp](https://github.com/ArivuPro914/ArivuPro_ExamApp)

**Contact:** tech@arivupro.com

---

*ArivuPro — Helping CA/CS/CMA students score better, one attempt at a time.*
