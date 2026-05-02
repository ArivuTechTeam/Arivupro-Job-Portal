/**
 * Authentication Context - Mock version (no backend required)
 * Auto-logs in with a demo student account.
 * Login accepts any credentials.
 */

import React, { createContext, useContext, useState } from 'react';
import { MOCK_USER, MOCK_ADMIN_USER } from '../services/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Start logged in as demo student by default
  const [user, setUser] = useState(MOCK_USER);
  const [loading] = useState(false);

  const login = async (username, password) => {
    // Accept any credentials - use admin user if username is 'admin'
    const mockUser = username === 'admin' ? MOCK_ADMIN_USER : { ...MOCK_USER, username };
    setUser(mockUser);
    localStorage.setItem('access_token', 'mock_access_token');
    return mockUser;
  };

  const register = async (formData) => {
    const newUser = {
      ...MOCK_USER,
      username: formData.username || 'new_user',
      first_name: formData.first_name || 'New',
      last_name: formData.last_name || 'User',
      email: formData.email || 'user@example.com',
      exam_type: formData.exam_type || 'CA',
      exam_level: formData.exam_level || 'Foundation',
    };
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const updateProfile = async (data) => {
    setUser((prev) => ({ ...prev, ...data }));
    return { ...user, ...data };
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      isAdmin: user?.role === 'admin' || user?.role === 'evaluator',
      isStudent: user?.role === 'student',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
