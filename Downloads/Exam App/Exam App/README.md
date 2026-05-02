# ArivuPro - Score Improvement System for CA/CS/CMA

A comprehensive AI-powered exam evaluation platform designed for students preparing for Chartered Accountant (CA), Company Secretary (CS), and Cost & Management Accountant (CMA) exams.

**Not just an "answer correction app" — a complete Score Improvement System.**

---

## Features

### Student Features
- **Upload Answer Scripts** — Upload PDF/image answer scripts for AI evaluation
- **AI Auto-Review** — Step-wise marking against the official marking scheme
- **ICAI Presentation Score** — Separate score for format, headings, working notes, neatness (out of 20)
- **Detailed Evaluation Reports** — Question-wise analysis with categorized feedback
- **Mistake Library** — Personal mistake notebook that tracks every error across attempts
- **Weak Area Detection** — Auto-tracks chapters and mistake types where marks are lost
- **Revision Mode** — Consolidated view of top mistakes and weak chapters before exams
- **Progress Tracking** — Score journey with improvement analytics
- **Ranking & Benchmarking** — Compare with top performers and averages
- **Gamification** — Streaks, achievements, level progression

### Admin/Faculty Features
- **Upload Question Papers** — With subjects, chapters, and metadata
- **Create Marking Schemes** — Step-wise marking with concept/format/calculation/working note categories
- **Manage Evaluations** — Approve AI evaluations or manually override scores
- **Student Analytics** — View aggregate performance data

### AI Evaluation Engine
- Text extraction from PDFs and scanned images (OCR)
- Answer segmentation by question number
- Step-wise marking against the marking scheme
- Mistake detection and categorization (conceptual, presentation, calculation, step loss)
- ICAI-style presentation scoring
- Personalized feedback and action plans

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Axios, Recharts |
| Backend | Django 4.2, Django REST Framework |
| Auth | JWT (SimpleJWT) |
| AI | OpenAI GPT-4o (configurable) |
| OCR | Tesseract, pdf2image |
| Database | SQLite (dev) / PostgreSQL (prod) |

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
exam-review-app/
├── backend/
│   ├── exam_review/          # Django project settings
│   ├── accounts/             # User auth, profiles, roles
│   ├── exams/                # Papers, questions, submissions, evaluations
│   ├── evaluator/            # AI engine, mistake tracking, analytics
│   ├── media/                # Uploaded files
│   ├── seed_data.py          # Database seeder
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API service layer
│   │   ├── context/          # Auth context
│   │   └── styles/           # Global CSS
│   └── package.json
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register/ | Register new user |
| POST | /api/auth/login/ | Login (get JWT) |
| POST | /api/auth/refresh/ | Refresh token |
| GET | /api/auth/profile/ | Get profile |
| GET | /api/auth/dashboard/ | Dashboard stats |

### Exams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/exams/subjects/ | List subjects |
| GET/POST | /api/exams/papers/ | List/create papers |
| POST | /api/exams/papers/{id}/add_question/ | Add question |
| GET | /api/exams/papers/{id}/statistics/ | Paper stats |
| GET/POST | /api/exams/submissions/ | List/create submissions |
| GET | /api/exams/submissions/{id}/report/ | Full report |
| GET | /api/exams/evaluations/ | List evaluations |
| POST | /api/exams/evaluations/{id}/approve/ | Approve evaluation |
| GET | /api/exams/evaluations/ranking/ | Rankings |

### Evaluator
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/evaluate/mistakes/ | Mistake library |
| GET | /api/evaluate/mistakes/summary/ | Mistake summary |
| GET | /api/evaluate/mistakes/recurring/ | Recurring mistakes |
| GET | /api/evaluate/analytics/overview/ | Analytics overview |
| GET | /api/evaluate/analytics/weak_areas/ | Weak areas |
| GET | /api/evaluate/revision/ | Revision mode data |
| GET | /api/evaluate/gamification/ | Gamification data |

---

## Business Model (Tiers)

### Free Tier
- Basic evaluation with score and summary
- Limited submissions per month

### Paid Tier
- Detailed ICAI-style reports
- AI insights and suggestions
- Model answer comparison
- Unlimited submissions

### Premium Tier
- Faculty video feedback
- 1-on-1 mentorship sessions
- Priority evaluation

---

## Environment Variables

### Backend (.env)
```
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
OPENAI_API_KEY=sk-your-key    # Required for AI evaluation
AI_MODEL=gpt-4o               # AI model to use
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000/api
```

---

## Production Deployment

1. Set `DJANGO_DEBUG=False`
2. Use PostgreSQL instead of SQLite
3. Configure proper `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`
4. Run `python manage.py collectstatic`
5. Use Gunicorn + Nginx for the backend
6. Build React with `npm run build` and serve via Nginx
7. Set up Celery + Redis for async evaluation processing
8. Install Tesseract OCR on the server for scanned documents

---

## License

Built by ArivuPro. All rights reserved.
