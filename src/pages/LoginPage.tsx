// src/pages/LoginPage.tsx

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  X,
} from 'lucide-react';
import AuthCard from '../components/auth/AuthCard';
import AuthHeader from '../components/auth/AuthHeader';
import GuidelinesPanel from '../components/auth/GuidelinesPanel';
import ImageMarquee from '../components/auth/ImageMarquee';
import AuthBackground from '../components/auth/AuthBackground';
import { useRateLimit } from '../components/auth/useRateLimit';
import { useApp } from '../store';
import { useToast } from '../toast';
import { loginUser, mapSupabaseUser } from '../data/auth';
import {
  isStrongPassword,
  PASSWORD_RULES,
} from '../components/auth/passwordRules';
import '../styles/auth.css';

/* ✅ Password Strength Component */
function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;

  return (
    <ul className="auth-password-rules">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(value);
        return (
          <li
            key={rule.label}
            className={`auth-password-rule ${
              passed ? 'is-passed' : 'is-pending'
            }`}
          >
            {passed ? (
              <Check className="react-icon" aria-hidden="true" />
            ) : (
              <X className="react-icon" aria-hidden="true" />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useApp();

  /* ============================================
     ✅ TOP HEADER FORM — INDEPENDENT STATE
     ============================================ */
  const [headerIdentifier, setHeaderIdentifier] = useState('');
  const [headerPassword, setHeaderPassword] = useState('');
  const [isHeaderSubmitting, setIsHeaderSubmitting] = useState(false);

  /* ============================================
     ✅ BOTTOM CARD FORM — INDEPENDENT STATE
     ============================================ */
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  /* ============================================
     ✅ SHARED RATE LIMIT
     Parehong key para mag-share ng lock status
     ============================================ */
  const sharedRateLimitKey = headerIdentifier || loginIdentifier;

  const {
    isLocked,
    secondsLeft,
    attemptsRemaining,
    formatLockoutTime,
    RATE_LIMIT_CONFIG,
    guard,
    recordFailure,
    clear,
  } = useRateLimit(sharedRateLimitKey);

  /* ============================================
     ✅ SHARED LOGIN HANDLER
     ============================================ */
  const performLogin = async (
    identifier: string,
    password: string,
    setSubmitting: (v: boolean) => void,
    clearFormState: () => void
  ) => {
    const status = guard();
    if (!status.allowed) {
      toast(
        `Too many failed attempts. Try again in ${formatLockoutTime(status.secondsUntilUnlock)}.`,
        'danger'
      );
      return;
    }

    /* ✅ STRONG PASSWORD CHECK */
    if (!isStrongPassword(password)) {
      toast(
        'Password must start with uppercase letter, contain number and special character, and be at least 8 characters.',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginUser(identifier, password);
      const user = mapSupabaseUser(result.user);
      const appRole = user.role === 'Staff' ? 'School Staff' : user.role;

      clear();
      signIn({
        id: user.id,
        name: user.name,
        email: user.email,
        role: appRole,
        idNumber: user.studentId ?? '',
        organization: 'SJCM General',
      });
      toast(`Welcome back, ${user.name}.`, 'success');
      navigate('/', { replace: true });
    } catch (error) {
      const newStatus = recordFailure();

      if (!newStatus.allowed) {
        toast(
          `Account locked for ${formatLockoutTime(newStatus.secondsUntilUnlock)} due to too many failed attempts.`,
          'danger'
        );
      } else {
        toast(
          error instanceof Error
            ? error.message
            : `Invalid credentials. ${newStatus.attemptsRemaining} attempt${newStatus.attemptsRemaining === 1 ? '' : 's'} remaining.`,
          'danger'
        );
      }
    } finally {
      setSubmitting(false);
      clearFormState();
    }
  };

  /* ✅ TOP HEADER SUBMIT */
  const handleHeaderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performLogin(
      headerIdentifier,
      headerPassword,
      setIsHeaderSubmitting,
      () => {}
    );
  };

  /* ✅ BOTTOM CARD SUBMIT */
  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performLogin(
      loginIdentifier,
      loginPassword,
      setIsLoginSubmitting,
      () => {}
    );
  };

  /* ✅ Live validation */
  const loginPasswordValid = loginPassword
    ? isStrongPassword(loginPassword)
    : true;

  return (
    <main className="auth-experience">
      <AuthBackground />

      {/* ✅ INDEPENDENT HEADER STATE */}
      <AuthHeader
        identifier={headerIdentifier}
        password={headerPassword}
        isSubmitting={isHeaderSubmitting}
        isLocked={isLocked}
        onIdentifierChange={setHeaderIdentifier}
        onPasswordChange={setHeaderPassword}
        onSubmit={(event) => void handleHeaderSubmit(event)}
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
                {attemptsRemaining} login attempt
                {attemptsRemaining === 1 ? '' : 's'} remaining.
              </span>
            </div>
          ) : null}

          <form
            className="auth-form auth-form--login"
            onSubmit={(event) => void handleLoginSubmit(event)}
          >
            {/* USERNAME */}
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

            {/* PASSWORD */}
            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <LockKeyhole className="react-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  className={`auth-input auth-input--with-toggle ${
                    !loginPasswordValid ? 'has-error' : ''
                  }`}
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
                  onClick={() => setShowLoginPassword((v) => !v)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? (
                    <EyeOff className="react-icon" aria-hidden="true" />
                  ) : (
                    <Eye className="react-icon" aria-hidden="true" />
                  )}
                </button>
              </div>

              {loginPassword && !loginPasswordValid && (
                <PasswordStrength value={loginPassword} />
              )}
            </div>

            {/* FORGOT PASSWORD */}
            <div className="auth-forgot-row">
              <Link to="/forgot-password" className="auth-forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* SUBMIT */}
            <button
              className="auth-submit"
              type="submit"
              disabled={isLoginSubmitting || isLocked || !loginPasswordValid}
            >
              {isLoginSubmitting ? 'Logging in…' : 'Login'}
              <ArrowRight className="react-icon" aria-hidden="true" />
            </button>
          </form>

          <p className="auth-card__switch">
            Don&apos;t have an account?{' '}
            <Link to="/register">Register here</Link>
          </p>
        </AuthCard>
      </div>
    </main>
  );
}