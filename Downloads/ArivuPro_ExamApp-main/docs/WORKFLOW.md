# ArivuPro ExamApp — Technical Workflow

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (React 18)                                  │
│                                                                              │
│  Student Pages          Admin Pages            Shared                        │
│  /dashboard             /admin/dashboard       Layout.js                     │
│  /papers                /admin/papers          AuthContext.js                │
│  /upload                /admin/submissions     Firebase                      │
│  /report/:id            /admin/evaluations     Firestore                     │
│  /mistakes              /admin/users                                         │
│  /progress              /admin/settings                                      │
│  /study-ai              /admin/ai-chat                                       │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ HTTP (JWT Bearer Token)
                               │ Axios + Auto-refresh on 401
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DJANGO REST FRAMEWORK API                                │
│                      http://localhost:8000/api                               │
│                                                                              │
│  /auth/        → accounts app  (login, register, OTP, profile)              │
│  /exams/       → exams app     (papers, questions, submissions, evals)       │
│  /evaluate/    → evaluator app (analytics, revision, gamification)           │
│  /admin/       → accounts app  (user management, stats)                     │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ ORM
                               ▼
┌──────────────────┐    ┌─────────────────┐    ┌───────────────────────────┐
│   PostgreSQL DB  │    │  Media Storage  │    │    Firebase Firestore     │
│                  │    │  /media/        │    │    - users                │
│  10 core models  │    │  question_papers│    │    - notifications        │
│  JWT sessions    │    │  answer_scripts │    │    - submissions          │
│  User profiles   │    │  student_pdfs   │    │    - evaluations          │
└──────────────────┘    └─────────────────┘    └───────────────────────────┘
```

---

## 2. Authentication Flow

```
STUDENT LOGIN
─────────────
POST /api/auth/login/
  │  { username, password }
  ▼
Django validates credentials
  │
  ▼
Returns { access, refresh } JWT tokens
  │
  ▼
Frontend stores in localStorage
  │
  ├── GET /api/auth/profile/   → load user object
  └── syncUserToFirestore()    → mirror to Firestore (background)

─────────────────────────────────────────────

TOKEN REFRESH (automatic)
──────────────────────────
Any API call returns 401
  │
  ▼
Axios interceptor triggers
  │
  ▼
POST /api/auth/refresh/
  │
  ▼
New access token stored
  │
  ▼
Original request retried

─────────────────────────────────────────────

ADMIN REGISTRATION
───────────────────
POST /api/auth/register-admin/
  │  { username, email, password, admin_code }
  ▼
Validates admin_code vs SystemConfig DB value
  │
  ▼
Creates User with:
  role = 'admin'
  is_staff = True     ← needed for full permissions
```

---

## 3. Question Paper Upload Flow (Admin)

```
Admin opens /admin/papers/new
            │
            ▼
Fills: Title, Subject, Type, Session, Marks, Duration
            │
Drags PDF   │
onto zone   ▼
        FormData created
            │
            ▼
POST /api/exams/papers/ (multipart/form-data)
            │
            ▼
Django creates ExamPaper record
            │
            ├── question_paper_file   → saved to /media/question_papers/
            └── suggested_answer_file → saved to /media/suggested_answers/
            │
            ▼
is_published = False (draft)
            │
            ▼
Admin toggles Publish in /admin/papers
            │
            ▼
PATCH /api/exams/papers/{id}/ { is_published: true }
            │
            ▼
Paper visible to all students at /papers
```

---

## 4. Answer Script Submission Flow (Student)

```
Student clicks "Attempt This Paper"
            │
            ▼
/upload?paper={id}   ← paper pre-selected

Step 1: Paper selected (or search + select)
Step 2: Upload answer script (PDF / JPG / PNG)
Step 3: Add notes, mark as timed attempt
            │
            ▼
POST /api/exams/submissions/ (multipart/form-data)
  {
    exam_paper: UUID,
    answer_script_file: File,
    is_timed_attempt: bool,
    time_taken_minutes: int,
    notes: string
  }
            │
            ▼
Django creates Submission record
  status = 'pending'
            │
            ▼ (immediately, in background thread)
trigger_evaluation(submission.id)
            │
            ▼
HTTP response returns 201 Created to browser
```

---

## 5. AI Evaluation Pipeline

```
trigger_evaluation(submission_id)
            │
            ▼
Load Submission from DB
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  TEXT EXTRACTION                                             │
│                                                              │
│  file = submission.answer_script_file.path                   │
│                                                              │
│  if PDF:                                                     │
│    try PyPDF2 → extract text                                 │
│    if < 50 chars → fallback to Tesseract OCR                 │
│  if image (JPG/PNG):                                         │
│    Tesseract OCR → extract text                              │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  ANSWER SEGMENTATION                                         │
│                                                              │
│  Split extracted text by question numbers                    │
│  (regex: "Q1", "Question 1", "1.", "1a" etc.)               │
│                                                              │
│  Result: { "1": "student answer text...",                    │
│            "2": "student answer text...", ... }              │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼  For each question:
┌─────────────────────────────────────────────────────────────┐
│  STEP-WISE MARKING                                           │
│                                                              │
│  Load MarkingScheme steps for this question from DB          │
│                                                              │
│  For each step:                                              │
│    Check if student answer contains expected content         │
│    Award marks: concept / calculation / format / working     │
│                                                              │
│  Build step_scores JSON:                                     │
│  { step_1: { marks: 1, max: 2, feedback: "..." }, ... }     │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  MISTAKE DETECTION                                           │
│                                                              │
│  For each question where marks were lost:                    │
│    Categorize: conceptual / calculation / presentation /     │
│                step_loss / keyword / format / time           │
│    Severity: minor / moderate / major                        │
│    is_recurring: check MistakeLog history                    │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  AI FEEDBACK GENERATION                                      │
│                                                              │
│  Provider priority:                                          │
│  1. Anthropic Claude (ANTHROPIC_API_KEY in .env)            │
│  2. OpenAI GPT-4o  (OPENAI_API_KEY in .env)                 │
│  3. Smart Text Analysis (no API key needed)                  │
│                                                              │
│  Generates:                                                  │
│    • overall_feedback (summary paragraph)                    │
│    • strengths[] (list)                                      │
│    • areas_to_improve[] (list)                               │
│    • action_plan[] (list)                                    │
│    • ai_suggestions[] (list)                                 │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION SCORING (ICAI style, out of 20)               │
│                                                              │
│  format_score       (0-5)  Proper formatting used           │
│  heading_score      (0-5)  Headings and subpoints           │
│  working_notes_score(0-5)  Working notes included           │
│  neatness_score     (0-5)  Clean, readable writing          │
│  presentation_score = sum of above                           │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  SAVE TO DATABASE                                            │
│                                                              │
│  Evaluation:          total_marks, percentage, feedback      │
│  QuestionEvaluation:  per-question scores and feedback       │
│  MistakeLog:          individual mistakes                    │
│  StudentAnalytics:    update avg_score, weak_chapters        │
│                                                              │
│  Submission.status → "evaluated"                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Report Viewing Flow

```
Student opens /report/{submissionId}
            │
            ▼
GET /api/exams/submissions/{id}/report/
            │
            ├── 200 OK → render report
            ├── 404    → evaluation not ready yet
            │          → start countdown timer
            │          → auto-retry schedule: 15s, 20s, 30s, 30s, 45s, 60s...
            │          → max 10 retries
            │          → show 4-step progress tracker
            └── 403    → permission denied
```

---

## 7. Firebase Real-time Flow

```
User logs in
    │
    ▼
AuthContext.loadUser() called
    │
    ├── GET /api/auth/profile/ → loads user from Django
    └── syncUserToFirestore(user) → mirrors to Firestore users/{id}

Layout.js renders
    │
    ▼
subscribeToNotifications(user.id, callback)
    │   (Firebase onSnapshot listener)
    ▼
Firestore query: notifications WHERE userId == user.id AND read == false
    │
    ▼ (real-time, fires on every new notification)
setNotifications([...]) → bell badge updates instantly

User clicks notification
    │
    ▼
markNotificationRead(notificationId)
    │
    ▼
Firestore updateDoc: { read: true }
    │
    ▼
onSnapshot fires → notification removed from list
```

---

## 8. Admin Evaluation Approval Flow

```
Admin opens /admin/evaluations
            │
            ▼
GET /api/exams/evaluations/  (filter: status=completed)
            │
            ▼
List shows: student_name, exam_paper_title, marks, percentage
            │
Admin clicks "Approve"
            │
            ▼
Modal opens:
  - Override marks (optional)
  - Admin remarks textarea
            │
Admin clicks "Confirm Approve"
            │
            ▼
POST /api/exams/evaluations/{id}/approve/
  {
    status: 'approved',
    remarks: '...',
    total_marks_obtained: X  (optional override)
  }
            │
            ▼
Evaluation.status → 'approved'
Evaluation.evaluated_by → admin user
Evaluation.admin_remarks → saved
Evaluation.percentage → recalculated if marks overridden
            │
            ▼
Firebase notification sent to student:
  "Your evaluation has been approved!"
```

---

## 9. API Endpoint Reference

### Auth (`/api/auth/`)
```
POST   /register/           Register student
POST   /login/              JWT login
POST   /refresh/            Refresh access token
GET    /profile/            Get current user
PATCH  /profile/            Update profile
POST   /send-otp/           Send OTP to email
POST   /verify-otp/         Verify OTP
POST   /register-admin/     Admin registration (requires admin_code)
GET    /dashboard/          Student dashboard stats
POST   /promote-me/         Promote self to admin (DEBUG only)
```

### Exams (`/api/exams/`)
```
GET    /subjects/           List subjects
POST   /subjects/           Create subject (admin)
GET    /papers/             List papers (published only for students)
POST   /papers/             Create paper (admin, multipart/form-data)
PATCH  /papers/{id}/        Update paper (admin, multipart/form-data)
DELETE /papers/{id}/        Delete paper (admin)
GET    /papers/{id}/questions/       List questions
POST   /papers/{id}/add_question/   Add question (admin)
GET    /papers/{id}/statistics/     Paper stats (admin)
GET    /submissions/        List submissions (own for students, all for admin)
POST   /submissions/        Submit answer script (multipart/form-data)
GET    /submissions/{id}/report/    Full evaluation report
GET    /evaluations/        List evaluations
POST   /evaluations/{id}/approve/   Approve evaluation (admin)
GET    /evaluations/my_history/     Student evaluation history
POST   /pdf-documents/      Upload study PDF
POST   /pdf-documents/{id}/chat/    Chat about PDF
```

### Admin (`/api/admin/`)
```
GET    /users/              List users
POST   /users/              Create user
PATCH  /users/{id}/         Update user
DELETE /users/{id}/         Delete user
GET    /stats/              User count stats
```

### Evaluate (`/api/evaluate/`)
```
GET    /mistakes/           Mistake library
GET    /analytics/overview/ Progress overview
GET    /analytics/weak_areas/ Weak chapters
GET    /revision/           Revision data
GET    /gamification/       Level + achievements
```

---

## 10. Permission Matrix

| Action | Student | Evaluator | Admin |
|--------|---------|-----------|-------|
| View published papers | ✅ | ✅ | ✅ |
| Upload answer scripts | ✅ | ✅ | ✅ |
| View own evaluations | ✅ | ✅ | ✅ |
| Create/edit papers | ❌ | ❌ | ✅ |
| View all submissions | ❌ | ✅ | ✅ |
| Approve evaluations | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View admin stats | ❌ | ✅ | ✅ |
| AI Chat (admin) | ❌ | ✅ | ✅ |
| System settings | ❌ | ❌ | ✅ |

---

*ArivuPro ExamApp — tech@arivupro.com*
