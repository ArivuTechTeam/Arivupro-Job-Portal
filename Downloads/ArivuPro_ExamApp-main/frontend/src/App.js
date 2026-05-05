/**
 * ArivuPro - Score Improvement System for CA/CS/CMA
 * Main App with routing
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AdminAuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { authAPI } from './services/api';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadAnswer from './pages/UploadAnswer';
import MySubmissions from './pages/MySubmissions';
import EvaluationReport from './pages/EvaluationReport';
import MistakeLibrary from './pages/MistakeLibrary';
import RevisionMode from './pages/RevisionMode';
import Progress from './pages/Progress';
import ExamPapers from './pages/ExamPapers';
import AdminPapers from './pages/AdminPapers';
import AdminCreatePaper from './pages/AdminCreatePaper';
import AdminEditPaper from './pages/AdminEditPaper';
import AdminEvaluations from './pages/AdminEvaluations';
import AdminAIFeedback from './pages/AdminAIFeedback';
import AdminSubmissions from './pages/AdminSubmissions';
import AdminLogin from './pages/AdminLogin';
import AdminValidationRequests from './pages/AdminValidationRequests';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import SubjectManagement from './components/admin/SubjectManagement';
import AdminCourses from './components/admin/AdminCourses';
import Statistics from './components/admin/Statistics';
import Settings from './components/admin/Settings';
import Profile from './pages/Profile';

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{ fontSize: '6rem', fontWeight: 900, color: '#e2e8f0', lineHeight: 1, marginBottom: '1rem' }}>404</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Page Not Found</h2>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
      <a href="/dashboard" style={{
        background: '#16a34a', color: '#fff', padding: '0.6rem 1.75rem',
        borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
      }}>Go to Dashboard</a>
    </div>
  );
}

// Shown when a logged-in user lacks the admin role
function AccessDenied() {
  const { user, logout } = useAuth();
  const [promoting, setPromoting] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleFix = async () => {
    try {
      setPromoting(true);
      setErr('');
      await authAPI.promoteMe();
      setMsg('✓ Account promoted to Admin! Redirecting...');
      setTimeout(() => window.location.href = '/admin/dashboard', 1500);
    } catch (e) {
      setErr(e.response?.data?.error || 'Server not restarted yet. Run: python manage.py runserver');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#f8fafc,#eef2ff)', padding: '2rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '2.5rem',
        maxWidth: 480, width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
          background: 'linear-gradient(135deg,#f97316,#ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', boxShadow: '0 8px 24px rgba(249,115,22,0.35)',
        }}>🔐</div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Admin Access Required
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          Logged in as <strong style={{ color: '#1e293b' }}>{user?.username}</strong>
          {' '}· Role: <strong style={{ color: '#dc2626' }}>{user?.role || 'student'}</strong>
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.75rem' }}>
          Your account needs the <strong>admin</strong> role to access this page.
        </p>

        {msg && <div style={{ background: '#dcfce7', color: '#166534', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>{msg}</div>}
        {err && <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem' }}>{err}</div>}

        <button
          onClick={handleFix}
          disabled={promoting}
          style={{
            width: '100%', padding: '0.75rem', borderRadius: 12, border: 'none',
            background: promoting ? '#94a3b8' : 'linear-gradient(135deg,#4f46e5,#6366f1)',
            color: '#fff', fontWeight: 700, fontSize: '1rem',
            cursor: promoting ? 'not-allowed' : 'pointer',
            boxShadow: promoting ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
            marginBottom: '0.75rem', transition: 'all 0.2s',
          }}
        >
          {promoting ? '⏳ Promoting...' : '🚀 Fix Admin Access — One Click'}
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/admin" style={{
            flex: 1, padding: '0.6rem', borderRadius: 10, border: '1px solid #e2e8f0',
            textDecoration: 'none', color: '#475569', fontWeight: 600,
            fontSize: '0.82rem', background: '#f8fafc',
          }}>← Admin Login</a>
          <button onClick={logout} style={{
            flex: 1, padding: '0.6rem', borderRadius: 10,
            border: '1px solid #fecaca', background: '#fef2f2',
            color: '#dc2626', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
          }}>Logout</button>
        </div>
      </div>
    </div>
  );
}

// ── Student route guard ─────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ── Admin section: wraps all /admin/* routes with AdminAuthProvider ─────────
// useAuth() inside here reads the ADMIN session, not the student session.
function AdminAuthWrapper() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}

// Login page inside admin context — redirects to dashboard if already logged in as admin
function AdminLoginRoute() {
  const { user, loading } = useAuth(); // admin context
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );
  if (user) return <Navigate to="/admin/dashboard" replace />;
  return <AdminLogin />;
}

// Admin route guard — redirects to /admin (login) when no admin session
function AdminPrivateRoute({ children }) {
  const { user, loading, isAdmin } = useAuth(); // admin context
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/admin" replace />;
  if (!isAdmin) return <AccessDenied />;
  return children;
}

// Smart redirect: admins → admin dashboard, students → student dashboard
function SmartHome() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );
  if (!user)    return <Navigate to="/login"           replace />;
  if (isAdmin)  return <Navigate to="/admin/dashboard" replace />;
  return                <Navigate to="/dashboard"      replace />;
}

function AppRoutes() {
  const { user } = useAuth(); // student context

  return (
    <Routes>
      {/* Public student routes */}
      <Route path="/login"    element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

      {/* ── Admin section ─────────────────────────────────────────────────── */}
      {/* All /admin/* routes are wrapped by AdminAuthWrapper which mounts    */}
      {/* AdminAuthProvider. useAuth() inside here → admin session.           */}
      <Route path="/admin" element={<AdminAuthWrapper />}>
        <Route index element={<AdminLoginRoute />} />

        <Route path="dashboard"   element={<AdminPrivateRoute><Layout><AdminDashboard /></Layout></AdminPrivateRoute>} />
        <Route path="users"       element={<AdminPrivateRoute><Layout><UserManagement /></Layout></AdminPrivateRoute>} />
        <Route path="subjects"    element={<AdminPrivateRoute><Layout><SubjectManagement /></Layout></AdminPrivateRoute>} />
        <Route path="courses"     element={<AdminPrivateRoute><Layout><AdminCourses /></Layout></AdminPrivateRoute>} />
        <Route path="stats"       element={<AdminPrivateRoute><Layout><Statistics /></Layout></AdminPrivateRoute>} />
        <Route path="settings"    element={<AdminPrivateRoute><Layout><Settings /></Layout></AdminPrivateRoute>} />
        <Route path="papers"      element={<AdminPrivateRoute><Layout><AdminPapers /></Layout></AdminPrivateRoute>} />
        <Route path="papers/new"  element={<AdminPrivateRoute><Layout><AdminCreatePaper /></Layout></AdminPrivateRoute>} />
        <Route path="papers/:id"  element={<AdminPrivateRoute><Layout><AdminEditPaper /></Layout></AdminPrivateRoute>} />
        <Route path="evaluations" element={<Navigate to="/admin/submissions" replace />} />
        <Route path="submissions" element={<AdminPrivateRoute><Layout><AdminSubmissions /></Layout></AdminPrivateRoute>} />
        <Route path="ai-feedback"  element={<AdminPrivateRoute><Layout><AdminAIFeedback /></Layout></AdminPrivateRoute>} />
        <Route path="validations"  element={<AdminPrivateRoute><Layout><AdminValidationRequests /></Layout></AdminPrivateRoute>} />
      </Route>

      {/* ── Student routes ─────────────────────────────────────────────────── */}
      <Route path="/dashboard"               element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/papers"                  element={<PrivateRoute><Layout><ExamPapers /></Layout></PrivateRoute>} />
      <Route path="/upload"                  element={<PrivateRoute><Layout><UploadAnswer /></Layout></PrivateRoute>} />
      <Route path="/submissions"             element={<PrivateRoute><Layout><MySubmissions /></Layout></PrivateRoute>} />
      <Route path="/report/:submissionId"    element={<PrivateRoute><Layout><EvaluationReport /></Layout></PrivateRoute>} />
      <Route path="/mistakes"                element={<PrivateRoute><Layout><MistakeLibrary /></Layout></PrivateRoute>} />
      <Route path="/revision"                element={<PrivateRoute><Layout><RevisionMode /></Layout></PrivateRoute>} />
      <Route path="/progress"                element={<PrivateRoute><Layout><Progress /></Layout></PrivateRoute>} />

      <Route path="/profile"                 element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
