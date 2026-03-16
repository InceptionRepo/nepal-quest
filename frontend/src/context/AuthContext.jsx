import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Always send cookies for API calls (needed if frontend and backend are on different origins)
axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load auth state from the server session (HttpOnly cookie)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await axios.get('/api/auth/me');
        if (!cancelled) {
          setUser(res.data?.user || null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { user: userData } = res.data;
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    try {
      const res = await axios.post('/api/auth/register', userData);
      const { user: newUser } = res.data;
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await axios.post('/api/auth/logout');
    } catch {
      // Even if the request fails, clear local state.
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    setError(null);
    try {
      const res = await axios.put('/api/auth/me', profileData);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      const message = err.response?.data?.error || 'Update failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isGuide: user?.role === 'guide',
    isUser: user?.role === 'user',
    login,
    register,
    logout,
    updateProfile,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
