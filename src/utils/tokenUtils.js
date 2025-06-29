// Utility functions for token management

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} - True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
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

/**
 * Get token expiration time
 * @param {string} token - The JWT token
 * @returns {Date|null} - Expiration date or null if invalid
 */
export const getTokenExpiration = (token) => {
  if (!token) return null;
  
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Get time until token expires
 * @param {string} token - The JWT token
 * @returns {number|null} - Milliseconds until expiration or null if invalid
 */
export const getTimeUntilExpiration = (token) => {
  if (!token) return null;
  
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const timeUntilExpiration = (decoded.exp - currentTime) * 1000;
    return Math.max(0, timeUntilExpiration);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Format time until expiration for display
 * @param {number} milliseconds - Milliseconds until expiration
 * @returns {string} - Formatted string
 */
export const formatTimeUntilExpiration = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return 'Expired';
  
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * Manually trigger token expiration for testing
 * This function can be called from the browser console for testing
 */
export const triggerTokenExpiration = () => {
  console.log('Manually triggering token expiration...');
  window.dispatchEvent(new CustomEvent('tokenExpired', {
    detail: { message: 'Token expiration triggered manually for testing.' }
  }));
};

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  window.tokenUtils = {
    isTokenExpired,
    getTokenExpiration,
    getTimeUntilExpiration,
    formatTimeUntilExpiration,
    triggerTokenExpiration
  };
} 