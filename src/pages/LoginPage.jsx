import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/'); // Redirect to home on successful login
    } catch (error) {
      // Error handled by AuthContext, can display generic message here if needed
      console.error('Login page error:', error);
    }
  };

  return (
    <div className="auth-page-container">
      <AuthForm
        title="Login"
        fields={[
          { label: 'Email', type: 'email', value: email, onChange: setEmail, required: true },
          { label: 'Password', type: 'password', value: password, onChange: setPassword, required: true },
        ]}
        onSubmit={handleSubmit}
        loading={loading}
        error={authError}
        linkText="Don't have an account? Register here."
        linkTo="/register"
      />
    </div>
  );
};

export default LoginPage; 