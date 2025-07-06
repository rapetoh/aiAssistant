import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AuthForm.css';

const AuthForm = ({ title, fields, onSubmit, loading, error, linkText, linkTo, rememberMe, onRememberMeChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const firstInvalidRef = useRef(null);

  // Focus the first invalid field on error
  useEffect(() => {
    if (error && firstInvalidRef.current) {
      firstInvalidRef.current.focus();
    }
  }, [error]);

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <h2 className="auth-form-title">{title}</h2>
      {error && (
        <p className="auth-form-error" role="alert" aria-live="assertive">{error}</p>
      )}
      {fields.map((field, index) => {
        const isPassword = field.type === 'password';
        const inputId = `auth-input-${field.label.replace(/\s+/g, '').toLowerCase()}`;
        return (
          <div className="form-group" key={index}>
            <label htmlFor={inputId}>{field.label}</label>
            <div className="auth-input-wrapper">
              <input
                type={isPassword && showPassword ? 'text' : field.type}
                id={inputId}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                required={field.required}
                placeholder={`Enter your ${field.label.toLowerCase()}...`}
                aria-invalid={!!error}
                aria-describedby={error ? 'auth-form-error' : undefined}
                ref={index === 0 && error ? firstInvalidRef : null}
                autoComplete={isPassword ? 'current-password' : undefined}
              />
              {isPassword && (
                <button
                  type="button"
                  className="show-password-toggle"
                  tabIndex={0}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              )}
            </div>
          </div>
        );
      })}
      {/* Remember Me Checkbox */}
      {typeof rememberMe !== 'undefined' && typeof onRememberMeChange === 'function' && (
        <div className="remember-me-group">
          <label className="remember-me-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => onRememberMeChange(e.target.checked)}
              className="remember-me-checkbox"
            />
            Remember Me
          </label>
        </div>
      )}
      <button type="submit" className="auth-submit-button" disabled={loading}>
        {loading ? 'Loading...' : title}
      </button>
      {linkText && linkTo && (
        <p className="auth-form-link">
          <Link to={linkTo}>{linkText}</Link>
        </p>
      )}
    </form>
  );
};

export default AuthForm; 