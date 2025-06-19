import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Try to load user from token if it exists
    if (token) {
      // In a real app, you might want to verify the token with the backend
      // or decode it to get user info. For now, we'll just set a dummy user
      // if a token exists, or fetch user profile from backend.
      // For simplicity, let's assume if token exists, user is logged in.
      // A more robust solution would involve a /profile endpoint to fetch user details.
      try {
        // Example: Decode JWT to get user details (client-side decode, not verification)
        const decodedUser = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: decodedUser.id, username: decodedUser.username || 'User', email: decodedUser.email });
      } catch (e) {
        console.error("Failed to decode token or token invalid:", e);
        logout(); // Logout if token is invalid
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    setAuthError(null);
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser(data.user);
      setLoading(false);
      return data;
    } catch (error) {
      setAuthError(error.message || 'Login failed');
      setLoading(false);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    setAuthError(null);
    setLoading(true);
    try {
      const data = await authService.register(username, email, password);
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser(data.user);
      setLoading(false);
      return data;
    } catch (error) {
      setAuthError(error.message || 'Registration failed');
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, authError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 