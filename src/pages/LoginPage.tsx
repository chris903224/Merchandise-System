// src/pages/LoginPage.tsx

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from 'lucide-react';
import AuthCard from '../components/auth/AuthCard';
import AuthHeader from '../components/auth/AuthHeader';
import GuidelinesPanel from '../components/auth/GuidelinesPanel';
import ImageMarquee from '../components/auth/ImageMarquee';
import { useApp } from '../store';
import { useToast } from '../toast';
import {
  clearRateLimit,
  checkRateLimit,
  formatLockoutTime,
  RATE_LIMIT_CONFIG,
  recordFailedAttempt,
} from '../data/rateLimit';
import { loginUser, mapSupabaseUser } from '../data/auth';

const ROUTES = {
  REGISTER: '/register',
  HOME: '/',
} as const;

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useApp();

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(RATE_LIMIT_CONFIG.MAX_ATTEMPTS);

  const isLocked = lockedUntil !== null && secondsLeft > 0;

  // Lockout countdown
  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setSecondsLeft(0);
        setAttemptsRemaining(RATE_LIMIT_CONFIG.MAX_ATTEMPTS);
        clearRateLimit(loginIdentifier);
        return;
      }
      setSecondsLeft(remaining);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [lockedUntil, loginIdentifier]);

  // Check rate limit when identifier changes
  useEffect(() => {
    if (!loginIdentifier.trim()) {
      setAttemptsRemaining(RATE_LIMIT_CONFIG.MAX_ATTEMPTS);
      setLockedUntil(null);
      setSecondsLeft(0);
      return;
    }

    const status = checkRateLimit(loginIdentifier);
    setAttemptsRemaining(status.attemptsRemaining);
    if (!status.allowed && status.lockedUntil) {
      setLockedUntil(status.lockedUntil);
      setSecondsLeft(status.secondsUntilUnlock);
    }
  }, [loginIdentifier]);

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const status = checkRateLimit(loginIdentifier);
    if (!status.allowed) {
      setLockedUntil(status.lockedUntil);
      setSecondsLeft(status.secondsUntilUnlock);
      toast(
        `Too many failed attempts. Try again in ${formatLockoutTime(status.secondsUntilUnlock)}.`,
        'danger',
      );
      return;
    }

    setIsLoginSubmitting(true);
    try {
      const result = await loginUser(loginIdentifier, loginPassword);
      const user = mapSupabaseUser(result.user);
      const appRole = user.role === 'Staff' ? 'School Staff' : user.role;

      clearRateLimit(loginIdentifier);
      signIn({
        id: user.id,
        name: user.name,
        email: user.email,
        role: appRole,
        idNumber: user.studentId ?? '',
        organization: 'SJCM General',
      });
      toast(`Welcome back, ${user.name}.`, 'success');
      navigate(ROUTES.HOME, { replace: true });
    } catch (error) {
      const newStatus = recordFailedAttempt(loginIdentifier);
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
      setIsLoginSubmitting(false);
    }
  };

  return (
    <main className="auth-experience">
      <AuthHeader
        identifier={loginIdentifier}
        password={loginPassword}
        isSubmitting={isLoginSubmitting}
        isLocked={isLocked}
        onIdentifierChange={setLoginIdentifier}
        onPasswordChange={setLoginPassword}
        onSubmit={(event) => void handleLoginSubmit(event)}
      />

      <div className="auth-experience__content">
        <GuidelinesPanel />
        <ImageMarquee />

        <AuthCard
          mode="login"
          title="Welcome back"
          description="Sign in to reserve merchandise and track pickup."
        >
          {isLocked ? (
            <div className="auth-callout auth-callout--danger" role="alert">
              <AlertCircle className="react-icon" aria-hidden="true" />
              <span>
                Account temporarily locked. Try again in{' '}
                <strong>{formatLockoutTime(secondsLeft)}</strong>.
              </span>
            </div>
          ) : attemptsRemaining < RATE_LIMIT_CONFIG.MAX_ATTEMPTS ? (
            <div className="auth-callout auth-callout--warning" role="status">
              <AlertCircle className="react-icon" aria-hidden="true" />
              <span>
                {attemptsRemaining} login attempt{attemptsRemaining === 1 ? '' : 's'} remaining.
              </span>
            </div>
          ) : null}

          <form
            className="auth-form auth-form--login"
            onSubmit={(event) => void handleLoginSubmit(event)}
          >
            <div className="auth-field">
              <label htmlFor="login-username">Username</label>
              <div className="auth-input-wrap">
                <UserRound className="react-icon" aria-hidden="true" />
                <input
                  id="login-username"
                  className="auth-input"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  required
                  value={loginIdentifier}
                  onChange={(event) => setLoginIdentifier(event.target.value)}
                  disabled={isLocked}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <LockKeyhole className="react-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  className="auth-input auth-input--with-toggle"
                  type={showLoginPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  disabled={isLocked}
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  onClick={() => setShowLoginPassword((visible) => !visible)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? (
                    <EyeOff className="react-icon" aria-hidden="true" />
                  ) : (
                    <Eye className="react-icon" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={isLoginSubmitting || isLocked}
            >
              {isLoginSubmitting ? 'Logging in…' : 'Login'}
              <ArrowRight className="react-icon" aria-hidden="true" />
            </button>
          </form>

          <p className="auth-card__switch">
            Don&apos;t have an account?{' '}
            <Link to={ROUTES.REGISTER}>Register here</Link>
          </p>
        </AuthCard>
      </div>
    </main>
  );
}