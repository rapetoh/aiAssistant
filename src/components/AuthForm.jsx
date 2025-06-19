import React from 'react';
import { Link } from 'react-router-dom';
import './AuthForm.css';

const AuthForm = ({ title, fields, onSubmit, loading, error, linkText, linkTo }) => {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2 className="auth-form-title">{title}</h2>
      {error && <p className="auth-form-error">{error}</p>}
      {fields.map((field, index) => (
        <div className="form-group" key={index}>
          <label htmlFor={field.label}>{field.label}</label>
          <input
            type={field.type}
            id={field.label}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            required={field.required}
            placeholder={`Enter your ${field.label.toLowerCase()}...`}
          />
        </div>
      ))}
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