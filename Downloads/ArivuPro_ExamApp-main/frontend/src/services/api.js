/**
 * API Service - Axios instance and all API calls
 *
 * Token strategy:
 *   Student pages (/dashboard, /papers, …)  → reads student_access_token
 *   Admin pages   (/admin/…)                → reads admin_access_token
 * Each browser tab has its own window.location, so two tabs can hold
 * independent sessions simultaneously.
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function getSessionKeys() {
  const isAdmin = window.location.pathname.startsWith('/admin');
  return {
    accessKey:  isAdmin ? 'admin_access_token'  : 'student_access_token',
    refreshKey: isAdmin ? 'admin_refresh_token'  : 'student_refresh_token',
    loginPath:  isAdmin ? '/admin'               : '/login',
  };
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the right bearer token based on current route context
api.interceptors.request.use((config) => {
  const { accessKey } = getSessionKeys();
  const token = localStorage.getItem(accessKey);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401; redirect to appropriate login on hard failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login/') ||
                           originalRequest.url?.includes('/auth/refresh/') ||
                           originalRequest.url?.includes('/auth/register/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const { accessKey, refreshKey } = getSessionKeys();
        const refreshToken = localStorage.getItem(refreshKey);
        const { data } = await axios.post(`${API_BASE}/auth/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem(accessKey, data.access);
        if (data.refresh) localStorage.setItem(refreshKey, data.refresh);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        const { accessKey, refreshKey, loginPath } = getSessionKeys();
        localStorage.removeItem(accessKey);
        localStorage.removeItem(refreshKey);
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register:       (data) => api.post('/auth/register/', data),
  login:          (data) => api.post('/auth/login/', data),
  getProfile:     ()     => api.get('/auth/profile/'),
  updateProfile:  (data) => api.patch('/auth/profile/', data),
  getDashboardStats: ()  => api.get('/auth/dashboard/'),
  sendOTP:        (email)       => api.post('/auth/send-otp/', { email }),
  verifyOTP:      (email, otp)  => api.post('/auth/verify-otp/', { email, otp }),
  aiChat:         (messages, system_prompt) =>
    api.post('/auth/ai-chat/', { messages, system_prompt }),
  registerAdmin:  (data) => api.post('/auth/register-admin/', data),
  getAdminCode:   ()     => api.get('/auth/admin-code/'),
  updateAdminCode:(code) => api.post('/auth/admin-code/', { code }),
  promoteMe:      ()     => api.post('/auth/promote-me/'),
};

// Exams
export const examsAPI = {
  getSubjects:  (params) => api.get('/exams/subjects/', { params }),
  getSubject:   (id)     => api.get(`/exams/subjects/${id}/`),
  createSubject:(data)   => api.post('/exams/subjects/', data),
  updateSubject:(id, data) => api.patch(`/exams/subjects/${id}/`, data),
  deleteSubject:(id)     => api.delete(`/exams/subjects/${id}/`),

  getPapers:    (params) => api.get('/exams/papers/', { params }),
  getPaper:     (id)     => api.get(`/exams/papers/${id}/`),
  createPaper:  (data)   => api.post('/exams/papers/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updatePaper:  (id, data) => {
    const isFormData = data instanceof FormData;
    return api.patch(`/exams/papers/${id}/`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
  deletePaper:      (id)          => api.delete(`/exams/papers/${id}/`),
  getPaperQuestions:(id)          => api.get(`/exams/papers/${id}/questions/`),
  addQuestion:      (paperId, data) => api.post(`/exams/papers/${paperId}/add_question/`, data),
  getPaperStats:    (id)          => api.get(`/exams/papers/${id}/statistics/`),

  getQuestions:   (params)   => api.get('/exams/questions/', { params }),
  deleteQuestion: (id)       => api.delete(`/exams/questions/${id}/`),
  updateQuestion: (id, data) => api.patch(`/exams/questions/${id}/`, data),
  addMarkingStep: (questionId, data) =>
    api.post(`/exams/questions/${questionId}/add_marking_step/`, data),
};

// Submissions
export const submissionsAPI = {
  list:          (params) => api.get('/exams/submissions/', { params }),
  create:        (data)   => api.post('/exams/submissions/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  get:           (id) => api.get(`/exams/submissions/${id}/`),
  getEvaluation: (id) => api.get(`/exams/submissions/${id}/evaluation/`),
  getReport:     (id) => api.get(`/exams/submissions/${id}/report/`),
  retrigger:     (id) => api.post(`/exams/submissions/${id}/retrigger/`),
};

// Evaluations
export const evaluationsAPI = {
  list:       (params) => api.get('/exams/evaluations/', { params }),
  get:        (id)     => api.get(`/exams/evaluations/${id}/`),
  approve:    (id, data) => api.post(`/exams/evaluations/${id}/approve/`, data),
  getHistory: ()       => api.get('/exams/evaluations/my_history/'),
  getRanking: (paperId) => api.get('/exams/evaluations/ranking/', {
    params: { exam_paper: paperId },
  }),
};

// Evaluator / Analytics
export const analyticsAPI = {
  getMistakes:       (params) => api.get('/evaluate/mistakes/', { params }),
  getMistakeSummary: ()       => api.get('/evaluate/mistakes/summary/'),
  getTopMistakes:    (limit)  => api.get('/evaluate/mistakes/top_mistakes/', { params: { limit } }),
  getRecurringMistakes: ()    => api.get('/evaluate/mistakes/recurring/'),

  getAnalytics:    () => api.get('/evaluate/analytics/'),
  getOverview:     () => api.get('/evaluate/analytics/overview/'),
  getWeakAreas:    () => api.get('/evaluate/analytics/weak_areas/'),
  getProgressChart:(subjectId) => api.get('/evaluate/analytics/progress_chart/', {
    params: { subject: subjectId },
  }),

  getRevisionData:    (subjectId) => api.get('/evaluate/revision/', { params: { subject: subjectId } }),
  resolveRevisionItems:(itemIds)  => api.patch('/evaluate/revision/', { item_ids: itemIds }),

  getGamification: () => api.get('/evaluate/gamification/'),
};

// Study AI
export const studyAI = {
  list:   ()         => api.get('/exams/pdf-documents/'),
  upload: (formData) => api.post('/exams/pdf-documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  get:    (id)       => api.get(`/exams/pdf-documents/${id}/`),
  delete: (id)       => api.delete(`/exams/pdf-documents/${id}/`),
  chat:   (id, question) => api.post(`/exams/pdf-documents/${id}/chat/`, { question }),
};

// Faculty Validation Requests
export const validationAPI = {
  // Student: request faculty validation for their submission
  request:       (submissionId, note = '') =>
    api.post(`/exams/submissions/${submissionId}/request_validation/`, { note }),

  // Admin: list all requests (optionally filter by status)
  list:          (params) => api.get('/exams/validation-requests/', { params }),
  get:           (id)     => api.get(`/exams/validation-requests/${id}/`),
  markReviewed:  (id, facultyName = '', adminRemarks = '') =>
    api.post(`/exams/validation-requests/${id}/mark_reviewed/`, {
      faculty_name: facultyName, admin_remarks: adminRemarks,
    }),
  updateReview:  (id, facultyName, adminRemarks) =>
    api.patch(`/exams/validation-requests/${id}/update_review/`, {
      faculty_name: facultyName, admin_remarks: adminRemarks,
    }),
};

// Admin API
export const adminAPI = {
  getUsers:    (params)   => api.get('/admin/users/', { params }),
  createUser:  (data)     => api.post('/admin/users/', data),
  updateUser:  (id, data) => api.patch(`/admin/users/${id}/`, data),
  deleteUser:  (id)       => api.delete(`/admin/users/${id}/`),

  getSubjects:   (params)   => api.get('/exams/subjects/', { params }),
  createSubject: (data)     => api.post('/exams/subjects/', data),
  updateSubject: (id, data) => api.patch(`/exams/subjects/${id}/`, data),
  deleteSubject: (id)       => api.delete(`/exams/subjects/${id}/`),

  getStats:       ()     => api.get('/admin/stats/'),
  bulkActions:    (data) => api.post('/admin/bulk-actions/', data),
  getSettings:    ()     => api.get('/admin/settings/'),
  updateSettings: (data) => api.post('/admin/settings/', data),
};

export default api;
