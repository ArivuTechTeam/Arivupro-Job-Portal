import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EXAM_LEVELS = {
  CA: ['Foundation', 'Intermediate', 'Final'],
  CS: ['Foundation', 'Executive', 'Professional'],
  CMA: ['Foundation', 'Intermediate', 'Final'],
};

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    role: 'student',
    exam_type: 'CA',
    exam_level: 'Foundation',
    phone: '',
    institute: '',
    registration_number: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Reset exam_level when exam_type changes
      if (name === 'exam_type') {
        updated.exam_level = EXAM_LEVELS[value][0];
      }
      return updated;
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Prepare data - only include student-specific fields when role is student
      const submitData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        role: formData.role,
      };

      // Add student-specific fields only if role is student
      if (formData.role === 'student') {
        submitData.exam_type = formData.exam_type;
        submitData.exam_level = formData.exam_level;
        submitData.phone = formData.phone;
        submitData.institute = formData.institute;
        submitData.registration_number = formData.registration_number;
      }

      await register(submitData);
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      const errorMsg = err.response?.data;
      if (typeof errorMsg === 'object') {
        const firstError = Object.values(errorMsg)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(errorMsg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isStudent = formData.role === 'student';
  const examLevels = EXAM_LEVELS[formData.exam_type];

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '550px' }}>
        <h2>Create Account</h2>
        <p className="subtitle">Join ArivuPro - Score Improvement System for CA/CS/CMA Exams</p>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="first_name">
                First Name *
              </label>
              <input
                className="form-input"
                id="first_name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="last_name">
                Last Name *
              </label>
              <input
                className="form-input"
                id="last_name"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Username and Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username *
            </label>
            <input
              className="form-input"
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email *
            </label>
            <input
              className="form-input"
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          {/* Password Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password *
              </label>
              <input
                className="form-input"
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 characters"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password_confirm">
                Confirm Password *
              </label>
              <input
                className="form-input"
                id="password_confirm"
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="Confirm password"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Role Selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="role">
              Role *
            </label>
            <select
              className="form-select"
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Student-specific fields */}
          {isStudent && (
            <>
              {/* Exam Type Selector */}
              <div className="form-group">
                <label className="form-label" htmlFor="exam_type">
                  Exam Type *
                </label>
                <select
                  className="form-select"
                  id="exam_type"
                  name="exam_type"
                  value={formData.exam_type}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="CA">Chartered Accountant (CA)</option>
                  <option value="CS">Company Secretary (CS)</option>
                  <option value="CMA">Cost Management Accountant (CMA)</option>
                </select>
              </div>

              {/* Exam Level Selector */}
              <div className="form-group">
                <label className="form-label" htmlFor="exam_level">
                  Exam Level *
                </label>
                <select
                  className="form-select"
                  id="exam_level"
                  name="exam_level"
                  value={formData.exam_level}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {examLevels.map(level => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Student Fields */}
              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  className="form-input"
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Your phone number"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="institute">
                  Institute/College
                </label>
                <input
                  className="form-input"
                  id="institute"
                  type="text"
                  name="institute"
                  value={formData.institute}
                  onChange={handleChange}
                  placeholder="Your institute name"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="registration_number">
                  Registration Number
                </label>
                <input
                  className="form-input"
                  id="registration_number"
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  placeholder="Your registration number"
                  disabled={loading}
                />
              </div>
            </>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: '#64748b',
          fontSize: '0.875rem'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: '#1e40af',
            textDecoration: 'none',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
