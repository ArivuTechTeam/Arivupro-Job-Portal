# ArivuPro ExamApp — User Journey & Flow

> **Platform:** CA / CS / CMA Exam Score Improvement System
> **Version:** 1.0 | **Date:** May 2026

---

## 📋 Table of Contents

1. [Student Journey](#student-journey)
2. [Admin Journey](#admin-journey)
3. [Complete End-to-End Flow](#complete-end-to-end-flow)
4. [Page Navigation Map](#page-navigation-map)

---

## STUDENT JOURNEY

### Step 1 — Registration

```
Visit /register
       │
       ▼
┌────────────────────────────────────────────┐
│  Fill Registration Form                    │
│                                            │
│  • Full Name                               │
│  • Email Address                           │
│  • Password                                │
│  • Phone Number                            │
│  • Exam Type  → CA / CS / CMA              │
│  • Exam Level → Foundation / Inter / Final │
│  • Institute (optional)                    │
└────────────────┬───────────────────────────┘
                 │
                 ▼
         OTP sent to email
                 │
                 ▼
      Enter 6-digit OTP code
                 │
                 ▼ ✓ Verified
      Account Created (role = student)
                 │
                 ▼
         → /dashboard
```

---

### Step 2 — Login

```
Visit /login
       │
       ▼
Enter username + password
       │
       ▼
JWT tokens saved to localStorage
       │
       ├── User profile loaded
       └── Profile synced to Firebase Firestore
       │
       ▼
→ /dashboard
```

---

### Step 3 — Student Dashboard

```
/dashboard — What the student sees:
┌──────────────────────────────────────────────────────────────────────┐
│  🎓 HERO BANNER                                                      │
│  "Good evening, Aman!"    CA · Foundation badge    🔥 3 streak       │
│  📅 Nov 2026 Attempt Countdown  →  [ 179 ] : [ 14 ] : [ 32 ] : [09] │
│  [📤 Upload Answer]  [📄 View Papers]                                │
├──────────────────────────────────────────────────────────────────────┤
│  📊 STATS (3 cards)                                                  │
│  Tests Attempted: 6   |   Avg Score: 0%   |   Best Score: 0%        │
├─────────────────────────────────┬────────────────────────────────────┤
│  📈 SCORE TREND (SVG chart)     │  ⚡ QUICK ACTIONS                 │
│  📅 ACTIVITY HEATMAP            │  ⚡ Level + XP bar                │
├─────────────────────────────────┴────────────────────────────────────┤
│  📄 QUESTION PAPERS (latest published, View + Download PDF)          │
│  🎓 SUBJECT PROGRESS (4-subject grid, Attempted / Not Attempted)     │
│  🎯 RECENT EVALUATIONS (score table with status)                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Step 4 — Browse Exam Papers

```
/papers
       │
       ▼
┌─────────────────────────────────────────────┐
│  Hero Search Bar: "Search papers..."        │
│  Type Pills: All | Mock | Practice | Past   │
│              Paper | RTP | MTP              │
│  Subject Dropdown: All Subjects             │
└─────────────────────────────────────────────┘
       │
       ▼
Paper Cards show:
  ┌──────────────────────────────┐
  │  [MOCK TEST]     [CA - GST]  │
  │                              │
  │  GST Chapter 2 Supply Test   │
  │  🗓 May 2026                  │
  │  📝 30m   ⏱ 3hr              │
  │  [👁 View PDF] [⬇ Download]  │
  │  [📤 Attempt This Paper]  ─┐ │
  └──────────────────────────┘ │
                               │
                               ▼
                         /upload?paper={id}
```

---

### Step 5 — Upload Answer Script

```
/upload?paper={id}
       │
       ▼
STEP 1: Paper selected (auto-filled from URL)
       │
       ▼
STEP 2: Upload Answer Script
  ┌─────────────────────────────────────────┐
  │  Drag & Drop or Browse                  │
  │  📄 CA_Foundation_Answers.pdf           │
  │  Accepts: PDF, JPG, PNG (max 50MB)     │
  └─────────────────────────────────────────┘
       │
       ▼
STEP 3: Optional details
  • Notes about this attempt
  • Mark as timed attempt (record time taken)
  • Upload additional pages
       │
       ▼
Click Submit
       │
       ▼
POST /api/exams/submissions/
       │
       ▼
Submission created (status: "pending")
       │
       └── AI Evaluation starts in background →
```

---

### Step 6 — Wait for AI Evaluation

```
/report/{submissionId}
       │
       ▼
┌──────────────────────────────────────────────┐
│        🤖 AI Evaluation In Progress           │
│                                               │
│  [⭕ Countdown Ring: 15s]                     │
│                                               │
│  ✅ Script Received                           │
│  🔍 OCR Processing          ← In Progress    │
│  🤖 AI Evaluating           (spinner)        │
│  ✅ Report Ready                              │
│                                               │
│  ⏱ Typically takes 1–3 minutes               │
│  Checked 1 time                               │
│                                               │
│  [🔄 Check Now]  [← Back]                    │
└──────────────────────────────────────────────┘
       │
       │ Auto-retries: 15s → 20s → 30s → 45s → 60s
       ▼ (on 200 OK)
View Evaluation Report
```

---

### Step 7 — View Evaluation Report

```
/report/{submissionId}
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  TOP BAR: ← Back | "GST Chapter 2 Supply Test" | 12/30 (40%) | 🖨 Print │
│  STRIP: [Overview] [Q1 · 3/5] [Q2 · 2/5] [Q3 · 4/5]... │
├──────────────────────────────────────┬──────────────────┤
│  LEFT SIDEBAR                        │  MAIN CONTENT    │
│  ┌──────────────────┐                │                  │
│  │ Overview  12/30  │←active         │  Overview Panel: │
│  │ ████░░░░░░       │                │                  │
│  ├──────────────────┤                │  Score Ring (40%)│
│  │ Q1        3/5   │                │  Passed/Failed   │
│  │ ██████░░░░       │                │                  │
│  ├──────────────────┤                │  Presentation    │
│  │ Q2        2/5   │                │  bars (Format,   │
│  │ ████░░░░░░       │                │  Headings, Notes │
│  ├──────────────────┤                │  Neatness)       │
│  │ Q3        4/5   │                │                  │
│  │ ████████░░       │                │  ✅ Strengths    │
│  └──────────────────┘                │  ⚠️  Improve    │
│                                      │  💡 Suggestions  │
└──────────────────────────────────────┴──────────────────┘

Click Q1 in sidebar:
  ┌────────────────────────────────────────────────────────┐
  │  [Q1] [Descriptive] [Fair]              [Ring: 60%]   │
  │  Explain the concept of "Supply" under GST...          │
  │  ──────────────────────────────────────────────        │
  │  Student wrote: "Supply under GST means..."            │
  │                                                        │
  │  📐 Step-wise Marks:                                   │
  │  ┌──────────────────────────────┬───────┬──────────┐  │
  │  │ Definition of Supply (Sec 7)  │ 1/2   │ Partial  │  │
  │  │ Components — Goods/Services   │ 1/1   │ Correct  │  │
  │  │ Schedule I activities         │ 0/1   │ Missing  │  │
  │  │ Examples                      │ 1/1   │ Good     │  │
  │  └──────────────────────────────┴───────┴──────────┘  │
  │                                                        │
  │  🧠 Concept     ⚠️  Format     🔢 Calculation          │
  │  💡 How to Improve                                     │
  │                                                        │
  │  📖 Model Answer  ▼ (expandable)                       │
  └────────────────────────────────────────────────────────┘
```

---

### Step 8 — Learn from Mistakes

```
/mistakes
       │
       ▼
Mistake Library shows all mistakes across all attempts:

  Filter by: Category | Severity | Subject | Recurring only
  
  ┌────────────────────────────────────────────────────────┐
  │  🔴 [MAJOR] Section 7 Definition missing               │
  │  Subject: GST | Chapter: Supply | Marks lost: 2       │
  │  Suggestion: Revise Section 7 of CGST Act...          │
  │  [⚠️ Recurring — seen 3 times]                        │
  ├────────────────────────────────────────────────────────┤
  │  🟡 [MODERATE] No tabular comparison format            │
  │  Subject: GST | Chapter: Composite Supply              │
  │  Suggestion: Use comparison tables for...             │
  └────────────────────────────────────────────────────────┘
```

---

### Step 9 — Revision Mode

```
/revision
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  TOP MISTAKES TO REVISE                                │
│  • Sec 7 Definition missing  (3 times)                │
│  • Schedule I activities     (2 times)                │
│  • No tabular format         (2 times)                │
│                                                        │
│  WEAK CHAPTERS                                         │
│  • Chapter 2: Supply         (45% accuracy)           │
│  • Chapter 5: Time of Supply (52% accuracy)           │
│                                                        │
│  REVISION CHECKLIST                                    │
│  □ Revise Section 7 of CGST Act                       │
│  □ Practice composite vs mixed supply table            │
│  ✓ Understand RCM provisions (marked resolved)        │
└────────────────────────────────────────────────────────┘
```

---

### Step 10 — Track Progress

```
/progress
       │
       ▼
┌────────────────────────────────────────────────────────────────────┐
│  HERO: "Progress & Achievements" + 📈 badge + 🔥 streak badge     │
├─────────────────────────────────────────┬──────────────────────────┤
│  STATS (5 cards)                        │  LEVEL PROGRESSION       │
│  6 Attempts | 40% Avg | 52% Best       │  🌱 Beginner ← current   │
│  2 Subjects | 3 Streak                  │  📈 Improving            │
├─────────────────────────────────────────┤  ⚡ Proficient           │
│  📈 SCORE TREND CHART                   │  🚀 Advanced             │
│  (SVG line, colored dots per score)    │  🏆 Exam Ready           │
├─────────────────────────────────────────┤                          │
│  WEAK AREAS BARS                        │  🔥 STREAK CARD          │
│  GST Ch.2: 45% ████░░░░░               │  "3 in a row"            │
│  Accounts:  52% █████░░░░               ├──────────────────────────┤
│                                         │  🏅 ACHIEVEMENTS         │
│  📅 ACTIVITY HEATMAP                   │  (locked grid until       │
│  26-week contribution graph            │   milestones reached)    │
└─────────────────────────────────────────┴──────────────────────────┘
```

---

### Study AI (Optional)

```
/study-ai
       │
       ▼
Upload any study PDF
       │
       ▼
AI analyzes and generates:
  ┌───────────────────────────────────────────────┐
  │  [Summary] [Key Concepts] [Breakdown] [Cards] │
  ├───────────────────────────────────────────────┤
  │  Summary: This document covers GST supply     │
  │  provisions under Section 7 of CGST Act...   │
  ├───────────────────────────────────────────────┤
  │  Key Concepts:                                │
  │  🟢 Supply  🟢 Composite Supply  🟢 RCM...   │
  └───────────────────────────────────────────────┘
       │
       ▼
Chat: "What are the Schedule I activities?"
       │
       ▼
AI answers based on document content
```

---

## ADMIN JOURNEY

### Step 1 — Admin Login

```
Visit /admin
       │
       ▼
Enter username + password (admin account)
       │
       ▼  role = 'admin' or is_staff = True
→ /admin/dashboard
```

---

### Step 2 — Admin Dashboard

```
/admin/dashboard
┌──────────────────────────────────────────────────────────────────────┐
│  HERO: "Good evening, Admin!" | ⚙️ Admin Panel | 🔔 2 pending        │
│  [+ New Paper]  [🔄 Refresh]                                         │
├──────────────────────────────────────────────────────────────────────┤
│  5 METRIC CARDS                                                      │
│  [📄 3 Papers]  [📚 2 Subjects]  [🎓 14 Courses]                    │
│  [📥 6 Subs]    [⏳ 2 Pending ← red badge]                           │
├────────────────────────────────┬─────────────────────────────────────┤
│  📥 RECENT SUBMISSIONS         │  ⚡ QUICK ACTIONS                  │
│  AK  Aman Kumar  Accounting   │  ➕ Create New Paper               │
│      Evaluated   4 May 2026   │  📄 Manage Papers                  │
│                               │  📥 Answer Scripts                 │
│  📊 SYSTEM OVERVIEW           │  ✅ Evaluations                    │
│  Published: 100% ██████████   │  👥 Users                          │
│  Approved:   33% ███░░░░░░░   │  📊 Statistics                     │
│  Courses:    70% ███████░░░   │                                    │
└────────────────────────────────┴─────────────────────────────────────┘
```

---

### Step 3 — Create Subject

```
/admin/subjects
       │
       ▼
Click "+ Add Subject"
       │
       ▼
Fill: Name, Code, Exam Type (CA/CS/CMA), Level, Description
       │
       ▼
POST /api/exams/subjects/
       │
       ▼
Subject created → available in paper creation dropdown
```

---

### Step 4 — Upload Question Paper

```
/admin/papers/new
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  Paper Details                                         │
│                                                        │
│  Title: GST Chapter 2 Supply Test Paper               │
│  Subject: [CA — GST — Intermediate]                   │
│  Type: [Mock Exam]                                     │
│  Session: May 2026                                     │
│  Marks: 30   Duration: 180 min                         │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  📄 DRAG & DROP QUESTION PAPER PDF              │  │
│  │     GST_Chapter2_Supply.pdf · 2.3 MB           │  │
│  │     [Replace]  [✕]                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  📋 DRAG & DROP SUGGESTED ANSWERS (optional)    │  │
│  │     Drop PDF here or Browse                     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  [🌐 Publish immediately] ●                            │
│                                                        │
│  [Cancel]  [✓ Create Paper]                            │
└────────────────────────────────────────────────────────┘
       │
       ▼
POST /api/exams/papers/ (multipart/form-data)
       │
       ▼
Paper created + PDF saved to /media/question_papers/
       │
       ▼
→ /admin/papers
```

---

### Step 5 — Manage Papers

```
/admin/papers
       │
       ▼
┌────────────────────────────────────────────────────────────────────────┐
│  HERO: "Question Papers"  3 Total · 3 Published · 0 Drafts · 3 PDF   │
│                                                   [+ Create New Paper] │
│  🔍 Search...  [All Types ▼] [All Subjects ▼] [⊞ ☰]  3 papers        │
├─────────────────┬──────────────────┬──────────────────────────────────┤
│  ┌───────────┐  │  ┌────────────┐  │  ┌──────────────────┐            │
│  │ ▐▌ MOCK  │  │  │ ▐▌ MOCK  │  │  │ ▐▌ RTP           │            │
│  │           │  │  │           │  │  │                  │            │
│  │ Accounting│  │  │ mock      │  │  │ msfdkj           │            │
│  │ CA · 2026 │  │  │ CA · 2026 │  │  │ CMA              │            │
│  │           │  │  │           │  │  │                  │            │
│  │ 📝100m⏱3h│  │  │ 📝120m⏱3h│  │  │ 📝2181m ⏱44m    │            │
│  │           │  │  │           │  │  │                  │            │
│  │ 📄 Q PDF  │  │  │ 📄 Q PDF  │  │  │ 📄 Q PDF         │            │
│  │ 📋 Ans    │  │  │ 📋 Ans    │  │  │ 📋 Ans           │            │
│  │           │  │  │           │  │  │                  │            │
│  │[🌐 Unpub] │  │  │[🌐 Unpub] │  │  │[🌐 Unpub]        │            │
│  │[✏️ Edit]  │  │  │[✏️ Edit]  │  │  │[✏️ Edit]         │            │
│  │[🗑️]      │  │  │[🗑️]      │  │  │[🗑️]             │            │
│  └───────────┘  │  └────────────┘  │  └──────────────────┘            │
└─────────────────┴──────────────────┴──────────────────────────────────┘
```

---

### Step 6 — Review Submissions

```
/admin/submissions
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  [📋 3 Total] [⏳ 0 Pending] [✅ 3 Evaluated] [📄 3 Files]  │
│  [All (3)] [Pending (0)] [Evaluated (3)]  🔍 Search...      │
├────────┬──────────────────────┬────────────┬──────────────────┤
│ #      │ Student              │ Paper      │ Status   Actions │
├────────┼──────────────────────┼────────────┼──────────────────┤
│ 1  [AK]│ Aman Kumar           │ Accounting │ Evaluated        │
│        │ amanchotu109@gmail   │            │ [📄 View] [⬇]   │
│        │                      │            │ [📊 Report] [✅] │
└────────┴──────────────────────┴────────────┴──────────────────┘
```

---

### Step 7 — Approve Evaluations

```
/admin/evaluations
       │
       ▼
Tabs: [All] [Pending Review] [AI Evaluated] [Approved]
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Student    Paper          Score   %       Status       │
│  Aman Kumar Accounting     N/A     N/A     approved     │
│  Aman Kumar Accounting     N/A     N/A  [Approve] [Report]│
└─────────────────────────────────────────────────────────┘
       │
Click "Approve"
       │
       ▼
┌─────────────────────────────────────────────┐
│  Approve Evaluation                         │
│                                             │
│  Marks Override: [___] (optional)           │
│  Admin Remarks:  [________________________]  │
│                  [Any comments or feedback] │
│                                             │
│  [Cancel]  [✓ Confirm Approve]              │
└─────────────────────────────────────────────┘
       │
       ▼
POST /api/exams/evaluations/{id}/approve/
       │
       ▼
Status → "approved"
Firebase notification → student
```

---

## COMPLETE END-TO-END FLOW

```
ADMIN SIDE                              STUDENT SIDE
──────────                              ────────────

1. Create Subject                       1. Register with OTP
   └─► Subject DB                          └─► Login → Dashboard

2. Upload Question Paper PDF            2. Browse /papers
   └─► ExamPaper DB                        └─► Filter + Search
   └─► /media/question_papers/              └─► Download PDF

3. Publish Paper                        3. Upload Answer Script
   └─► is_published = true                 └─► POST /submissions/
                                           └─► AI Evaluation starts

4. Papers visible to students           4. Wait for Evaluation
                                           └─► Auto-retry (15s-60s)
                                           └─► 4-step progress UI

                                        5. View Full Report
                                           └─► Score ring
                                           └─► Per-question analysis
                                           └─► Feedback cards
                                           └─► Model answers

5. Review Submissions                   6. Learn & Improve
   └─► View answer scripts                 └─► Mistake Library
   └─► Open report                         └─► Revision Mode
                                           └─► Progress tracking

6. Approve Evaluations                  7. Study AI
   └─► Override marks                      └─► Upload PDFs
   └─► Add remarks                         └─► AI summaries
   └─► Firebase notification → student     └─► Flashcards + Chat
```

---

## PAGE NAVIGATION MAP

### Student Pages (15)

```
/login ──────────────────────────────────────────── /dashboard
                                                         │
         ┌────────────────────┬────────────────────────┬─┘
         ▼                    ▼                        ▼
      /papers              /upload                /submissions
         │                    │                        │
  Download PDF         Submit Answer           View Status
         │                    │                        │
         │                    ▼                        ▼
         └──────────── /report/{id} ◄──────── /evaluations
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
          /mistakes      /revision      /progress
                                            │
                                        /study-ai

/profile      ← from dropdown (all pages)
/mock-tests   ← browse mock tests
/exam         ← course selection
/exam/:id     ← timed exam interface
```

### Admin Pages (13)

```
/admin ──────────────────────────────── /admin/dashboard
                                               │
    ┌──────────────────────┬───────────────────┼────────────────────┐
    ▼                      ▼                   ▼                    ▼
/admin/papers        /admin/users       /admin/subjects      /admin/submissions
    │                                                               │
    ├── /admin/papers/new                                           ▼
    └── /admin/papers/:id                                  /admin/evaluations

/admin/stats      ← analytics
/admin/settings   ← config + Firebase test
/admin/ai-chat    ← AI assistant
/admin/courses    ← course management
```

---

## QUICK REFERENCE

| Who | Starting Point | Key Goal | Primary Route |
|-----|---------------|----------|---------------|
| New Student | `/register` | Create account | `/register → /dashboard` |
| Returning Student | `/login` | Check evaluations | `/login → /evaluations` |
| Student before exam | `/revision` | Quick review | `/revision → /progress` |
| Admin (new paper) | `/admin/papers/new` | Upload paper | `/admin/papers/new` |
| Admin (review) | `/admin/evaluations` | Approve scores | `/admin/evaluations` |
| Admin (analytics) | `/admin/stats` | View performance | `/admin/stats` |

---

*ArivuPro ExamApp — tech@arivupro.com*
