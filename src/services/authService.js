import api from './api';

export const authService = {
  register: async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      return response.data;
    } catch (error) {
      console.error('Error during registration:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  login: async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      return response.data;
    } catch (error) {
      console.error('Error during login:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // You can add a logout function later if needed, typically by clearing client-side token
}; 