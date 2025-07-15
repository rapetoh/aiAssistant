import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  // Enhanced logout function that can be called from anywhere
  const logout = (redirectToLogin = true) => {
    console.log('Logging out user...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
    setAuthError(null);
    
    if (redirectToLogin && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
  };

  // Function to validate and refresh token if needed
  const validateToken = async () => {
    const storedToken = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (!storedToken) {
      setLoading(false);
      return;
    }

    // Check if token is expired
    if (isTokenExpired(storedToken)) {
      console.log('Token is expired, logging out...');
      logout();
      setLoading(false);
      return;
    }

      try {
      // Set the token
      setToken(storedToken);
      
      // Restore user data from localStorage
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        setUser(userData);
      } else {
        // Fallback: try to decode user info from token (now includes username)
        const decodedUser = JSON.parse(atob(storedToken.split('.')[1]));
        setUser({ 
          id: decodedUser.id, 
          username: decodedUser.username || 'User', // Now username is in token
          email: decodedUser.email || 'user@example.com'
        });
      }
    } catch (error) {
      console.error('Failed to decode token or token invalid:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateToken();
  }, []);

  // Listen for token expiration events from API interceptor
  useEffect(() => {
    const handleTokenExpiration = () => {
      console.log('Token expiration event received');
      logout(false); // Don't redirect immediately, let the API interceptor handle it
    };

    // Listen for custom events that might be dispatched from API interceptor
    window.addEventListener('tokenExpired', handleTokenExpiration);
    
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpiration);
    };
  }, []);

  // Periodic token validation (check every 5 minutes)
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      if (isTokenExpired(token)) {
        console.log('Token expired during periodic check, logging out...');
        window.dispatchEvent(new CustomEvent('tokenExpired', {
          detail: { message: 'Your session has expired due to inactivity. Please log in again.' }
        }));
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Set up periodic check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [token, isTokenExpired]);

  const login = async (email, password) => {
    setAuthError(null);
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
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
      localStorage.setItem('userData', JSON.stringify(data.user));
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

  // Function to check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user && !isTokenExpired(token);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      authError, 
      login, 
      register, 
      logout,
      isTokenExpired,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 