// src/pages/LoginPage.tsx

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn, Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import { loginUser, mapSupabaseUser } from '../data/auth';

const ROUTES = {
  REGISTER: '/register',
  HOME: '/',
} as const;

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await loginUser(email, password);
      const user = mapSupabaseUser(result.user);

      signIn({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        idNumber: user.studentId,
        organization: 'SJCM General',
      } as any);

      toast(`Welcome back, ${user.name}.`, 'success');
      navigate(ROUTES.HOME, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast(
        error instanceof Error ? error.message : 'Login failed. Please try again.',
        'danger',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <main className="page-shell auth-shell">
      <section className="auth-panel" aria-labelledby="login-title">
        <header className="auth-panel__header">
          <div className="auth-icon">
            <LogIn className="react-icon" aria-hidden="true" />
          </div>
          <h1 id="login-title" className="auth-panel__title">
            Welcome back
          </h1>
          <p className="auth-panel__description">
            Sign in to reserve merchandise and track pickup.
          </p>
        </header>

        <form
          className="auth-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="field">
            <label className="field-label" htmlFor="login-email">
              Student email address
            </label>
            <div className="field-control--icon">
              <Mail className="react-icon" aria-hidden="true" />
              <input
                type="email"
                id="login-email"
                className="field-control"
                required
                autoComplete="email"
                placeholder="student@phinmaed.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="login-password">
              Password
            </label>
            <div className="field-control--icon">
              <Lock className="react-icon" aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                className="field-control"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="react-icon" aria-hidden="true" />
                ) : (
                  <Eye className="react-icon" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="button button--primary button--block"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
            <ArrowRight className="react-icon" aria-hidden="true" />
          </button>
        </form>

        <footer className="auth-footer">
          Don't have an account? <Link to={ROUTES.REGISTER}>Register here</Link>
        </footer>
      </section>
    </main>
  );
}