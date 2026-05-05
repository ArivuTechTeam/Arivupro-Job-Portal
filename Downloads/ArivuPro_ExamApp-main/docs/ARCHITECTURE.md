# Architecture & API Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│              Port: 3000 (Development)                   │
└────────────────────────────┬────────────────────────────┘
                             │
                    API Calls via Axios
                             │
┌────────────────────────────▼────────────────────────────┐
│              Backend (Django REST)                       │
│              Port: 8000 (Development)                   │
│                                                         │
│  ├─ Accounts App    (User management)                 │
│  ├─ Exams App       (Paper management)                │
│  └─ Evaluator App   (AI evaluation engine)            │
└────────────────────────────┬────────────────────────────┘
                             │
                  Database Queries
                             │
┌────────────────────────────▼────────────────────────────┐
│                PostgreSQL Database                       │
│                  Port: 5432                             │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

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

### Submissions
- `POST /api/exams/submit/` - Submit answer script
- `GET /api/submissions/` - Get user submissions
- `GET /api/submissions/{id}/` - Get submission details

### Evaluation
- `POST /api/evaluator/evaluate/` - Evaluate answer script
- `GET /api/evaluations/` - Get evaluations
- `GET /api/evaluations/{id}/` - Get evaluation report

## Backend Structure

### Apps Organization

#### Accounts App
Handles user authentication and profile management
```
accounts/
├── models.py       # User model extensions
├── serializers.py  # User serializers
├── views.py        # Authentication views
├── urls.py         # Auth routes
└── admin.py        # Admin configuration
```

#### Exams App
Manages exam papers and questions
```
exams/
├── models.py       # Paper, Question, Section models
├── serializers.py  # Exam serializers
├── views.py        # Exam views
├── urls.py         # Exam routes
└── admin.py        # Admin configuration
```

#### Evaluator App
AI-powered answer evaluation
```
evaluator/
├── models.py       # Evaluation, Grade models
├── serializers.py  # Evaluation serializers
├── engine.py       # AI evaluation logic
├── views.py        # Evaluation views
├── urls.py         # Evaluation routes
└── admin.py        # Admin configuration
```

## Database Schema

### Key Models

**User**
- id, email, password, full_name, is_student, is_teacher, created_at

**ExamPaper**
- id, title, subject, created_by, total_marks, duration, created_at, updated_at

**Question**
- id, paper_id, content, marks, question_type, image

**AnswerSubmission**
- id, paper_id, student_id, document, submitted_at, status

**Evaluation**
- id, submission_id, evaluator_id, score, feedback, ai_feedback, created_at

## Frontend Structure

### Component Organization

```
components/
├── common/
│   └── Layout.js          # Main layout wrapper
├── auth/                  # Authentication components
├── admin/                 # Admin dashboard components
└── student/               # Student components
```

### Context API Setup

```
context/
└── AuthContext.js         # User authentication state
```

### Page Routes

- `/` - Dashboard
- `/login` - Login page
- `/register` - Registration page
- `/exams` - List exams (student view)
- `/admin/papers` - Admin: Manage papers
- `/admin/evaluations` - Admin: View evaluations
- `/exam/:id` - Take exam
- `/submission/:id` - View submission
- `/progress` - Student progress

## Environment Configuration

See `.env.example` for available settings.

Key settings:
- `DEBUG` - Development mode flag
- `SECRET_KEY` - Django secret
- `DATABASE_URL` - PostgreSQL connection
- `CORS_ALLOWED_ORIGINS` - Frontend URL
- `OPENAI_API_KEY` - AI evaluation API key

## Security Considerations

1. **Authentication**: JWT tokens with 24-hour expiry
2. **CORS**: Configured for frontend domain only
3. **Database**: Use strong passwords, enable SSL
4. **Secrets**: Never commit `.env` file, use `.env.example`
5. **API Rate Limiting**: Implement for production
6. **HTTPS**: Required for production deployment

## Performance Optimization

1. **Database Indexing**: Applied on frequently queried fields
2. **API Pagination**: Implemented for large datasets
3. **Caching**: Use Redis for session and data caching
4. **CDN**: Serve static files from CloudFront/CDN
5. **Database Queries**: Use select_related() and prefetch_related()
