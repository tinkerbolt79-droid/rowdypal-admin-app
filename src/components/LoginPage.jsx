import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminSignInWithEmailAndPassword, googleSignIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await adminSignInWithEmailAndPassword(email, password);
      navigate('/events');
    } catch (err) {
      console.error('Login error:', err);
      setError(`Failed to sign in: ${err.message || 'Unknown error'}`);
    }

    setLoading(false);
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await googleSignIn();
      navigate('/events');
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(`Failed to sign in with Google: ${err.message || 'Unknown error'}`);
    }

    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Dear Friend</h1>
        <h5>Admin console</h5>
        <div className="divider"></div>
        <h2>Sign In</h2>
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="User ID"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            Sign In
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn-google">
          <i className="fab fa-google"></i> Sign in with Google
        </button>
      </div>
    </div>
  );
}