/**
 * Mock API Service - returns fake data without any backend
 * Simulates axios response format: { data: ... }
 */

import {
  MOCK_DASHBOARD_STATS,
  MOCK_GAMIFICATION,
  MOCK_SUBJECTS,
  MOCK_PAPERS,
  MOCK_SUBMISSIONS,
  MOCK_EVALUATION_HISTORY,
  MOCK_REPORT,
  MOCK_RANKING,
  MOCK_EVALUATIONS_ADMIN,
  MOCK_MISTAKES,
  MOCK_MISTAKE_SUMMARY,
  MOCK_OVERVIEW,
  MOCK_WEAK_AREAS,
  MOCK_REVISION_DATA,
} from './mockData';

// Simulate async delay
const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

// Wrap data in axios-like response
const ok = (data) => ({ data });

// Auth
export const authAPI = {
  register: async (data) => {
    await delay();
    return ok({ message: 'Registration successful' });
  },
  login: async (data) => {
    await delay(500);
    return ok({ access: 'mock_access_token', refresh: 'mock_refresh_token' });
  },
  getProfile: async () => {
    await delay();
    // Return profile from localStorage if set, else default student
    const stored = localStorage.getItem('mock_user');
    if (stored) return ok(JSON.parse(stored));
    return ok({
      id: 1,
      username: 'raj_sharma',
      first_name: 'Raj',
      last_name: 'Sharma',
      email: 'raj@example.com',
      role: 'student',
      exam_type: 'CA',
      exam_level: 'Final',
    });
  },
  updateProfile: async (data) => {
    await delay();
    return ok(data);
  },
  getDashboardStats: async () => {
    await delay();
    return ok(MOCK_DASHBOARD_STATS);
  },
};

// Exams
export const examsAPI = {
  getSubjects: async (params) => {
    await delay();
    return ok(MOCK_SUBJECTS);
  },
  getSubject: async (id) => {
    await delay();
    const subject = MOCK_SUBJECTS.find((s) => s.id === parseInt(id)) || MOCK_SUBJECTS[0];
    return ok(subject);
  },

  getPapers: async (params) => {
    await delay();
    let papers = [...MOCK_PAPERS];
    // Filter by subject if provided
    if (params && params.subject) {
      papers = papers.filter((p) => p.subject.id === parseInt(params.subject));
    }
    // Filter by attempt_type if provided
    if (params && params.attempt_type) {
      papers = papers.filter((p) => p.attempt_type === params.attempt_type);
    }
    return ok(papers);
  },
  getPaper: async (id) => {
    await delay();
    const paper = MOCK_PAPERS.find((p) => p.id === parseInt(id)) || MOCK_PAPERS[0];
    return ok(paper);
  },
  createPaper: async (data) => {
    await delay(800);
    return ok({ id: 99, message: 'Paper created (mock)', ...Object.fromEntries(data) });
  },
  updatePaper: async (id, data) => {
    await delay();
    return ok({ id, ...data });
  },
  getPaperQuestions: async (id) => {
    await delay();
    return ok([
      { id: 1, question_number: 1, question_text: 'Sample Question 1', marks: 20, question_type: 'theory' },
      { id: 2, question_number: 2, question_text: 'Sample Question 2', marks: 20, question_type: 'problem' },
    ]);
  },
  addQuestion: async (paperId, data) => {
    await delay();
    return ok({ id: Math.floor(Math.random() * 1000), paper: paperId, ...data });
  },
  getPaperStats: async (id) => {
    await delay();
    return ok({
      total_submissions: 24,
      average_score: 67,
      pass_percentage: 75,
      top_score: 91,
    });
  },

  getQuestions: async (params) => {
    await delay();
    return ok([]);
  },
  addMarkingStep: async (questionId, data) => {
    await delay();
    return ok({ id: Math.floor(Math.random() * 1000), question: questionId, ...data });
  },
};

// Submissions
export const submissionsAPI = {
  list: async (params) => {
    await delay();
    let submissions = [...MOCK_SUBMISSIONS];
    if (params && params.status) {
      submissions = submissions.filter((s) => s.status === params.status);
    }
    return ok({ results: submissions, count: submissions.length, next: null });
  },
  create: async (data) => {
    await delay(1000);
    return ok({ id: 99, status: 'pending', message: 'Submission received (mock)' });
  },
  get: async (id) => {
    await delay();
    const submission = MOCK_SUBMISSIONS.find((s) => s.id === parseInt(id)) || MOCK_SUBMISSIONS[0];
    return ok(submission);
  },
  getEvaluation: async (id) => {
    await delay();
    return ok(MOCK_REPORT);
  },
  getReport: async (id) => {
    await delay();
    return ok(MOCK_REPORT);
  },
};

// Evaluations
export const evaluationsAPI = {
  list: async (params) => {
    await delay();
    let evals = [...MOCK_EVALUATIONS_ADMIN];
    if (params && params.status) {
      evals = evals.filter((e) => e.status === params.status);
    }
    return ok(evals);
  },
  get: async (id) => {
    await delay();
    const ev = MOCK_EVALUATIONS_ADMIN.find((e) => e.id === parseInt(id)) || MOCK_EVALUATIONS_ADMIN[0];
    return ok(ev);
  },
  approve: async (id, data) => {
    await delay(500);
    return ok({ id, status: 'approved', ...data });
  },
  getHistory: async () => {
    await delay();
    return ok({ results: MOCK_EVALUATION_HISTORY, count: MOCK_EVALUATION_HISTORY.length });
  },
  getRanking: async (paperId) => {
    await delay();
    return ok(MOCK_RANKING);
  },
};

// Analytics / Evaluator
export const analyticsAPI = {
  getMistakes: async (params) => {
    await delay();
    let mistakes = [...MOCK_MISTAKES];
    if (params && params.category && params.category !== 'all') {
      mistakes = mistakes.filter((m) => m.category === params.category);
    }
    return ok(mistakes);
  },
  getMistakeSummary: async () => {
    await delay();
    return ok(MOCK_MISTAKE_SUMMARY);
  },
  getTopMistakes: async (limit) => {
    await delay();
    return ok(MOCK_MISTAKES.slice(0, limit || 5));
  },
  getRecurringMistakes: async () => {
    await delay();
    return ok(MOCK_MISTAKES.filter((m) => m.isRecurring));
  },

  getAnalytics: async () => {
    await delay();
    return ok(MOCK_OVERVIEW);
  },
  getOverview: async () => {
    await delay();
    return ok(MOCK_OVERVIEW);
  },
  getWeakAreas: async () => {
    await delay();
    return ok(MOCK_WEAK_AREAS);
  },
  getProgressChart: async (subjectId) => {
    await delay();
    return ok({ subject: subjectId, data: [] });
  },

  getRevisionData: async (subjectId) => {
    await delay();
    return ok(MOCK_REVISION_DATA);
  },
  resolveRevisionItems: async (itemIds) => {
    await delay();
    return ok({ resolved: itemIds });
  },

  getGamification: async () => {
    await delay();
    return ok(MOCK_GAMIFICATION);
  },
};

export default { authAPI, examsAPI, submissionsAPI, evaluationsAPI, analyticsAPI };
