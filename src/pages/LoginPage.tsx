// src/pages/LoginPage.tsx

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn, Mail, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import { loginUser, mapSupabaseUser } from '../data/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  formatLockoutTime,
  RATE_LIMIT_CONFIG,
} from '../data/rateLimit';

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

  // Rate limit state
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(
    RATE_LIMIT_CONFIG.MAX_ATTEMPTS,
  );

  // ============================================
  // LOCKOUT COUNTDOWN TIMER
  // ============================================
  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setSecondsLeft(0);
        setAttemptsRemaining(RATE_LIMIT_CONFIG.MAX_ATTEMPTS);
        clearRateLimit(email);
        return;
      }
      setSecondsLeft(remaining);
    };

    tick(); // initial call
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil, email]);

  // ============================================
  // CHECK RATE LIMIT WHEN EMAIL CHANGES
  // ============================================
  useEffect(() => {
    if (!email.trim()) return;
    const status = checkRateLimit(email);
    if (!status.allowed && status.lockedUntil) {
      setLockedUntil(status.lockedUntil);
      setSecondsLeft(status.secondsUntilUnlock);
    }
    setAttemptsRemaining(status.attemptsRemaining);
  }, [email]);

  const isLocked = lockedUntil !== null && secondsLeft > 0;

  // ============================================
  // SUBMIT
  // ============================================
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Check rate limit first
    const status = checkRateLimit(email);
    if (!status.allowed) {
      setLockedUntil(status.lockedUntil);
      setSecondsLeft(status.secondsUntilUnlock);
      toast(
        `Too many failed attempts. Please try again in ${formatLockoutTime(status.secondsUntilUnlock)}.`,
        'danger',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginUser(email, password);
      const user = mapSupabaseUser(result.user);

      // ✅ Successful login → clear rate limit
      clearRateLimit(email);

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
      // ❌ Failed login → record attempt
      const newStatus = recordFailedAttempt(email);
      setAttemptsRemaining(newStatus.attemptsRemaining);

      if (!newStatus.allowed && newStatus.lockedUntil) {
        setLockedUntil(newStatus.lockedUntil);
        setSecondsLeft(newStatus.secondsUntilUnlock);
        toast(
          `Account locked for ${formatLockoutTime(newStatus.secondsUntilUnlock)} due to too many failed attempts.`,
          'danger',
        );
      } else {
        toast(
          error instanceof Error
            ? error.message
            : `Invalid credentials. ${newStatus.attemptsRemaining} attempt${newStatus.attemptsRemaining === 1 ? '' : 's'} remaining.`,
          'danger',
        );
      }
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

        {/* Rate limit warning */}
        {isLocked ? (
          <div
            className="callout"
            role="alert"
            style={{
              marginBottom: '1rem',
              borderColor: 'rgba(156, 55, 55, 0.35)',
              background: 'var(--color-danger-soft)',
              color: 'var(--color-danger)',
            }}
          >
            <AlertCircle className="react-icon" aria-hidden="true" />
            <span>
              <strong>Account temporarily locked.</strong> Too many failed
              login attempts. Please wait{' '}
              <strong>{formatLockoutTime(secondsLeft)}</strong> before trying
              again.
            </span>
          </div>
        ) : attemptsRemaining < RATE_LIMIT_CONFIG.MAX_ATTEMPTS ? (
          <div
            className="callout"
            role="status"
            style={{
              marginBottom: '1rem',
              borderColor: 'rgba(156, 98, 30, 0.35)',
              background: 'var(--color-warning-soft)',
              color: 'var(--color-warning)',
            }}
          >
            <AlertCircle className="react-icon" aria-hidden="true" />
            <span>
              Warning: <strong>{attemptsRemaining}</strong> attempt
              {attemptsRemaining === 1 ? '' : 's'} remaining before your
              account is temporarily locked.
            </span>
          </div>
        ) : null}

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
                disabled={isLocked}
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
                disabled={isLocked}
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
            disabled={isSubmitting || isLocked}
          >
            <span>
              {isLocked
                ? `Locked (${formatLockoutTime(secondsLeft)})`
                : isSubmitting
                  ? 'Signing in…'
                  : 'Sign in'}
            </span>
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