# ArivuPro ExamApp — Project Overview

---

## 🎯 What is ArivuPro?

**ArivuPro** is a full-stack AI-powered **Score Improvement System** built specifically for students preparing for India's toughest professional examinations:

| Exam Body | Exams Covered |
|-----------|--------------|
| **ICAI** | CA Foundation, Intermediate, Final |
| **ICSI** | CS Foundation, Executive, Professional |
| **ICMAI** | CMA Foundation, Intermediate, Final |

> ArivuPro is **not just an answer correction app** — it is a complete learning ecosystem that helps students understand *why* they lost marks and *how* to improve.

---

## 🏗️ Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | Django 4.2 + Django REST Framework |
| Database | PostgreSQL (production) / SQLite (dev) |
| Auth | JWT via SimpleJWT |
| AI Evaluation | Claude (Anthropic) → OpenAI GPT-4o → Smart Text Fallback |
| OCR | PyPDF2 + Tesseract |
| Task Processing | Python threading (background AI evaluation) |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Real-time | Firebase Firestore |
| Storage | Supabase / Django Media |
| Styling | Inline styles + CSS modules |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Firebase Firestore | Real-time notifications, user sync |
| Supabase | File storage (optional) |
| Docker | Containerization |
| GitHub | Source control (`ArivuPro914/ArivuPro_ExamApp`) |

---

## 🗂️ Project Structure

```
ArivuPro_ExamApp/
│
├── backend/                        # Django REST API
│   ├── apps/
│   │   ├── accounts/               # Users, auth, OTP, admin registration
│   │   ├── exams/                  # Papers, questions, submissions, evaluations
│   │   └── evaluator/              # AI engine, analytics, revision, gamification
│   ├── config/exam_review/         # Django settings, URLs, WSGI
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                       # React 18 app
│   ├── src/
│   │   ├── pages/                  # 28 route pages (15 student + 13 admin)
│   │   ├── components/             # Shared + admin components
│   │   ├── services/               # API client, Firestore helpers
│   │   ├── context/                # Auth context
│   │   └── styles/                 # Global CSS
│   └── package.json
│
├── docs/                           # All documentation
│   ├── PROJECT_OVERVIEW.md         ← You are here
│   ├── FEATURES.md
│   ├── USER_JOURNEY.md
│   └── WORKFLOW.md
│
├── .env.example                    # Environment variable template
├── docker-compose.yml              # Multi-container setup
└── README.md
```

---

## 🔑 Core Concepts

### 1. Exam Paper System
- Admin uploads **Question Paper PDFs** with metadata (subject, marks, duration, session)
- Papers are published/unpublished — only published papers are visible to students
- Papers support 5 types: Mock Test, Practice, Past Paper, RTP, MTP (ICAI)

### 2. Answer Script Submission
- Students upload their **handwritten or typed answer scripts** as PDF/image
- Scripts are linked to a specific question paper
- Timed mode is supported (exam simulation)

### 3. AI Evaluation Pipeline
- Fully automated — runs in background on submission
- Extracts text via OCR → segments by question → scores each step → generates feedback
- Falls back gracefully: Claude API → OpenAI API → Smart text analysis (no API needed)

### 4. Evaluation Report
- ICAI-style comprehensive report with score ring, presentation scores, per-question analysis
- Mistake categorization: Conceptual, Calculation, Format, Step Loss, Keyword, Time Management
- Strengths, Areas to Improve, Action Plan, AI Suggestions

### 5. Learning Tools
- **Mistake Library** — every mistake tracked and categorized across all attempts
- **Revision Mode** — focused review of weak areas before exam
- **Progress Analytics** — score trend, activity heatmap, level progression
- **Study AI** — upload any PDF → instant summary, flashcards, and Q&A chat

### 6. Firebase Real-time Layer
- User profiles synced to Firestore on every login
- Real-time notification bell in topbar
- Evaluation status updates pushed without page refresh

---

## 👥 User Roles

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ROLES                               │
├───────────────┬─────────────────────────────────────────────┤
│   STUDENT     │ Register → Browse Papers → Upload Answers   │
│               │ → View Reports → Track Progress             │
├───────────────┼─────────────────────────────────────────────┤
│   ADMIN       │ Create Papers → Manage Users → Approve      │
│               │ Evaluations → View Analytics                │
├───────────────┼─────────────────────────────────────────────┤
│   EVALUATOR   │ Review AI Evaluations → Approve Scores      │
│               │ (subset of admin privileges)                │
└───────────────┴─────────────────────────────────────────────┘
```

---

## 📊 Database Models (10 Core Models)

| Model | Purpose |
|-------|---------|
| `User` | Custom user with role, exam type, level |
| `Subject` | CA/CS/CMA subjects with exam level |
| `Chapter` | Topics within a subject with weightage |
| `ExamPaper` | Question papers with PDF files |
| `Question` | Individual questions per paper |
| `MarkingScheme` | Step-wise marking criteria |
| `Submission` | Student answer script upload |
| `Evaluation` | Overall AI evaluation result |
| `QuestionEvaluation` | Per-question scores and feedback |
| `MistakeLog` | Individual mistakes with category & severity |

---

## 🌐 Live Repository

**GitHub:** [https://github.com/ArivuPro914/ArivuPro_ExamApp](https://github.com/ArivuPro914/ArivuPro_ExamApp)

**Contact:** tech@arivupro.com

---

*ArivuPro ExamApp — Helping CA/CS/CMA students score better, one attempt at a time.*
