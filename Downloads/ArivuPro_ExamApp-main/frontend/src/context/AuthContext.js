import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const AuthContext = createContext(null);

// One-time migration: rename old un-prefixed tokens → student_ keys
(function migrate() {
  try {
    if (localStorage.getItem('access_token') && !localStorage.getItem('student_access_token')) {
      localStorage.setItem('student_access_token', localStorage.getItem('access_token'));
      localStorage.setItem('student_refresh_token', localStorage.getItem('refresh_token') || '');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  } catch (_) {}
})();

function createAuthProvider(storagePrefix) {
  const accessKey  = `${storagePrefix}_access_token`;
  const refreshKey = `${storagePrefix}_refresh_token`;

  // Dedicated axios instance per session scope — always uses the right token
  const authAxios = axios.create({ baseURL: API_BASE });
  authAxios.interceptors.request.use((cfg) => {
    const token = localStorage.getItem(accessKey);
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  });
  authAxios.interceptors.response.use(
    (res) => res,
    async (error) => {
      const orig = error.config;
      const isAuthEndpoint = orig.url?.includes('/auth/login/') ||
                             orig.url?.includes('/auth/refresh/') ||
                             orig.url?.includes('/auth/register/');
      if (error.response?.status === 401 && !orig._retry && !isAuthEndpoint) {
        orig._retry = true;
        try {
          const refresh = localStorage.getItem(refreshKey);
          const { data } = await axios.post(`${API_BASE}/auth/refresh/`, { refresh });
          localStorage.setItem(accessKey, data.access);
          if (data.refresh) localStorage.setItem(refreshKey, data.refresh);
          orig.headers.Authorization = `Bearer ${data.access}`;
          return authAxios(orig);
        } catch {
          localStorage.removeItem(accessKey);
          localStorage.removeItem(refreshKey);
        }
      }
      return Promise.reject(error);
    }
  );

  return function Provider({ children }) {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
      if (!localStorage.getItem(accessKey)) { setLoading(false); return null; }
      try {
        const { data } = await authAxios.get('/auth/profile/');
        setUser(data);
        setLoading(false);
        return data;
      } catch {
        localStorage.removeItem(accessKey);
        localStorage.removeItem(refreshKey);
        setLoading(false);
        return null;
      }
    }, []);

    useEffect(() => { loadUser(); }, [loadUser]);

    const login = async (username, password) => {
      const { data } = await authAxios.post('/auth/login/', { username, password });
      localStorage.setItem(accessKey, data.access);
      localStorage.setItem(refreshKey, data.refresh);
      return await loadUser(); // returns full user profile for role-based redirect
    };

    const register = async (formData) => {
      const { data } = await authAxios.post('/auth/register/', formData);
      return data;
    };

    const logout = () => {
      localStorage.removeItem(accessKey);
      localStorage.removeItem(refreshKey);
      setUser(null);
    };

    const updateProfile = async (profileData) => {
      const { data: updated } = await authAxios.patch('/auth/profile/', profileData);
      setUser((prev) => ({ ...prev, ...updated }));
      return updated;
    };

    return (
      <AuthContext.Provider value={{
        user, loading, login, register, logout, updateProfile,
        isAdmin:   user?.role === 'admin' || user?.role === 'evaluator',
        isStudent: user?.role === 'student',
        storagePrefix,
      }}>
        {children}
      </AuthContext.Provider>
    );
  };
}

// Student session — tokens stored as student_access_token / student_refresh_token
export const AuthProvider = createAuthProvider('student');

// Admin session  — tokens stored as admin_access_token  / admin_refresh_token
// Both providers write to the same AuthContext; nearest ancestor wins,
// so admin routes automatically get the admin user from useAuth().
export const AdminAuthProvider = createAuthProvider('admin');

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider or AdminAuthProvider');
  return ctx;
};
