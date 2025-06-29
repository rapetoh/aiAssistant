import React, { useState, useEffect } from 'react';
import './SessionExpiredModal.css';

const SessionExpiredModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleTokenExpiration = (event) => {
      setMessage(event.detail?.message || 'Your session has expired. Please log in again.');
      setIsVisible(true);
    };

    window.addEventListener('tokenExpired', handleTokenExpiration);
    
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpiration);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Redirect to login after a short delay to show the message
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <div className="session-expired-overlay">
      <div className="session-expired-modal">
        <div className="session-expired-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h2>Session Expired</h2>
        <p>{message}</p>
        <button onClick={handleClose} className="session-expired-button">
          Continue to Login
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal; 