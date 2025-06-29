import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// This interceptor runs before every request
api.interceptors.request.use(
  (config) => {
    // The token is stored directly under the 'authToken' key
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// This interceptor runs after every response
api.interceptors.response.use(
  (response) => {
    // If the response is successful, just return it
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      console.log('Token expired or invalid, redirecting to login...');
      
      // Clear the invalid token
      localStorage.removeItem('authToken');
      
      // Dispatch a custom event to notify AuthContext
      window.dispatchEvent(new CustomEvent('tokenExpired', {
        detail: { message: 'Your session has expired. Please log in again.' }
      }));
      
      // Redirect to login page
      // Note: We can't use useNavigate here since this is not a React component
      // Instead, we'll use window.location or dispatch a custom event
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    // Return the error so the calling code can still handle it if needed
    return Promise.reject(error);
  }
);

export default api; 