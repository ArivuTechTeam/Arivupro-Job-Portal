/**
 * ArivuPro - Score Improvement System for CA/CS/CMA
 * Main App with routing
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import AdminEvaluations from './pages/AdminEvaluations';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Student Routes */}
      <Route path="/dashboard" element={
        <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
      } />
      <Route path="/papers" element={
        <PrivateRoute><Layout><ExamPapers /></Layout></PrivateRoute>
      } />
      <Route path="/upload" element={
        <PrivateRoute><Layout><UploadAnswer /></Layout></PrivateRoute>
      } />
      <Route path="/submissions" element={
        <PrivateRoute><Layout><MySubmissions /></Layout></PrivateRoute>
      } />
      <Route path="/report/:submissionId" element={
        <PrivateRoute><Layout><EvaluationReport /></Layout></PrivateRoute>
      } />
      <Route path="/mistakes" element={
        <PrivateRoute><Layout><MistakeLibrary /></Layout></PrivateRoute>
      } />
      <Route path="/revision" element={
        <PrivateRoute><Layout><RevisionMode /></Layout></PrivateRoute>
      } />
      <Route path="/progress" element={
        <PrivateRoute><Layout><Progress /></Layout></PrivateRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/papers" element={
        <PrivateRoute adminOnly><Layout><AdminPapers /></Layout></PrivateRoute>
      } />
      <Route path="/admin/papers/new" element={
        <PrivateRoute adminOnly><Layout><AdminCreatePaper /></Layout></PrivateRoute>
      } />
      <Route path="/admin/evaluations" element={
        <PrivateRoute adminOnly><Layout><AdminEvaluations /></Layout></PrivateRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
