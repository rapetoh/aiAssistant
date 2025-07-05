import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, loading, authError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(username, email, password);
      // Redirect to the page they were trying to access, or home if no specific page
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      // Error handled by AuthContext, can display generic message here if needed
      console.error('Register page error:', error);
    }
  };

  return (
    <div className="auth-page-container">
      <AuthForm
        title="Register"
        fields={[
          { label: 'Username', type: 'text', value: username, onChange: setUsername, required: true },
          { label: 'Email', type: 'email', value: email, onChange: setEmail, required: true },
          { label: 'Password', type: 'password', value: password, onChange: setPassword, required: true },
        ]}
        onSubmit={handleSubmit}
        loading={loading}
        error={authError}
        linkText="Already have an account? Login here."
        linkTo="/login"
      />
    </div>
  );
};

export default RegisterPage; 