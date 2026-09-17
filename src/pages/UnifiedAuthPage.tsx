import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import AuthCard from '../components/auth/AuthCard';
import AuthHeader from '../components/auth/AuthHeader';
import GuidelinesPanel from '../components/auth/GuidelinesPanel';
import ImageMarquee from '../components/auth/ImageMarquee';
import type { AuthMode, AuthStage } from '../components/auth/authTypes';
import { useApp } from '../store';
import { useToast } from '../toast';
import {
  clearRateLimit,
  checkRateLimit,
  formatLockoutTime,
  RATE_LIMIT_CONFIG,
  recordFailedAttempt,
} from '../data/rateLimit';
import {
  getPasswordErrorMessage,
  isPhinmaedEmail,
  isValidEmail,
  isValidStudentId,
  PHINMAED_DOMAIN,
  STUDENT_ID_EXAMPLE,
} from '../data/validation';
import { loginUser, mapSupabaseUser, registerUser, resendOtp, verifyOtp } from '../data/auth';
import '../styles/auth.css';

interface UnifiedAuthPageProps {
  initialMode: AuthMode;
}

type RegistrationErrors = {
  name?: string;
  email?: string;
  idNumber?: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
};

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300;
const OTP_PLACEHOLDER = '\u2013 \u2013 \u2013 \u2013 \u2013 \u2013'; // en-dash placeholders, spaced by letter-spacing

// ✅ HARDCODED — direct URL sa public folder
const CAMPUS_BACKGROUND_URL = '/background-images/campus.png';

export default function UnifiedAuthPage({ initialMode }: UnifiedAuthPageProps) {
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

  const [activeMode, setActiveMode] = useState<AuthMode>(initialMode);
  const [stage, setStage] = useState<AuthStage>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<RegistrationErrors>({});

  const isLocked = lockedUntil !== null && secondsLeft > 0;

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

  useEffect(() => {
    if (stage !== 'otp') return;
    if (timeLeft <= 0) {
      setErrors((previous) => ({ ...previous, otp: 'This verification code has expired. Resend it to continue.' }));
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stage, timeLeft]);

  useEffect(() => {
    if (stage !== 'success') return;
    const timer = window.setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
    return () => window.clearTimeout(timer);
  }, [navigate, stage]);

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const status = checkRateLimit(loginIdentifier);
    if (!status.allowed) {
      setLockedUntil(status.lockedUntil);
      setSecondsLeft(status.secondsUntilUnlock);
      toast(`Too many failed attempts. Try again in ${formatLockoutTime(status.secondsUntilUnlock)}.`, 'danger');
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
      navigate('/', { replace: true });
    } catch (error) {
      const newStatus = recordFailedAttempt(loginIdentifier);
      setAttemptsRemaining(newStatus.attemptsRemaining);

      if (!newStatus.allowed && newStatus.lockedUntil) {
        setLockedUntil(newStatus.lockedUntil);
        setSecondsLeft(newStatus.secondsUntilUnlock);
        toast(`Account locked for ${formatLockoutTime(newStatus.secondsUntilUnlock)} due to too many failed attempts.`, 'danger');
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

  const validateRegistration = (): boolean => {
    const nextErrors: RegistrationErrors = {};

    if (!name.trim()) nextErrors.name = 'Username is required.';
    else if (name.trim().length < 2) nextErrors.name = 'Username must be at least 2 characters.';

    if (!email.trim()) nextErrors.email = 'Email address is required.';
    else if (!isValidEmail(email)) nextErrors.email = 'Please enter a valid email address.';
    else if (!isPhinmaedEmail(email)) nextErrors.email = `Email must end with ${PHINMAED_DOMAIN}.`;

    if (!idNumber.trim()) nextErrors.idNumber = 'Student ID number is required.';
    else if (!isValidStudentId(idNumber)) nextErrors.idNumber = `Format: ${STUDENT_ID_EXAMPLE}`;

    const passwordError = getPasswordErrorMessage(password);
    if (passwordError) nextErrors.password = passwordError;
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateRegistration()) {
      toast('Please review the highlighted fields before creating your account.', 'warning');
      return;
    }

    setIsRegisterSubmitting(true);
    try {
      await registerUser({ name, email, password, studentId: idNumber });
      toast('A verification code was sent to your email.', 'success');
      setStage('otp');
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setOtp('');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Registration failed. Please try again.', 'danger');
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setErrors((previous) => ({ ...previous, otp: `Enter the ${OTP_LENGTH}-digit verification code.` }));
      return;
    }

    setIsRegisterSubmitting(true);
    setErrors((previous) => ({ ...previous, otp: undefined }));
    try {
      const result = await verifyOtp(email, otp);
      const user = mapSupabaseUser(result.user);
      const appRole = user.role === 'Staff' ? 'School Staff' : user.role;

      signIn({
        id: user.id,
        name: user.name,
        email: user.email,
        role: appRole,
        idNumber: user.studentId ?? idNumber,
        organization: 'SJCM General',
      });
      setStage('success');
      toast('Your account is verified. Redirecting to your dashboard.', 'success');
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        otp: error instanceof Error ? error.message : 'The code is invalid or expired. Try again.',
      }));
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setErrors((previous) => ({ ...previous, otp: undefined }));
    try {
      await resendOtp(email);
      toast('A new verification code was sent.', 'success');
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setOtp('');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to resend the code.', 'danger');
    } finally {
      setIsResending(false);
    }
  };

  const navigateToMode = (mode: AuthMode) => {
    setActiveMode(mode);
    setStage('register');
    setErrors({});
    setOtp('');

    if (initialMode !== 'login') {
      navigate(mode === 'login' ? '/login' : '/register');
    }
  };

  const formatOtpTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainder = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  };

  return (
    <main className="auth-experience">
      {/* ✅ HARDCODED background image — direct URL sa public folder */}
      <img
        src={CAMPUS_BACKGROUND_URL}
        alt=""
        className="auth-experience__background"
        aria-hidden="true"
      />

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
          mode={activeMode}
          title={
            activeMode === 'login'
              ? 'Welcome back'
              : stage === 'otp'
                ? 'Verify your account'
                : stage === 'success'
                  ? 'Account verified'
                  : 'Register an Account'
          }
          description={
            activeMode === 'login'
              ? 'Sign in to reserve merchandise and track pickup.'
              : stage === 'otp'
                ? `Enter the ${OTP_LENGTH}-digit code sent to ${email}.`
                : stage === 'success'
                  ? 'Your SJCM account is ready.'
                  : 'Create your SJCM merchandise account.'
          }
        >
          {activeMode === 'login' ? (
            <>
              {isLocked ? (
                <div className="auth-callout auth-callout--danger" role="alert">
                  <AlertCircle className="react-icon" aria-hidden="true" />
                  <span>
                    Account temporarily locked. Try again in <strong>{formatLockoutTime(secondsLeft)}</strong>.
                  </span>
                </div>
              ) : attemptsRemaining < RATE_LIMIT_CONFIG.MAX_ATTEMPTS ? (
                <div className="auth-callout auth-callout--warning" role="status">
                  <AlertCircle className="react-icon" aria-hidden="true" />
                  <span>{attemptsRemaining} login attempt{attemptsRemaining === 1 ? '' : 's'} remaining.</span>
                </div>
              ) : null}

              <form className="auth-form auth-form--login" onSubmit={(event) => void handleLoginSubmit(event)}>
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
                      {showLoginPassword ? <EyeOff className="react-icon" aria-hidden="true" /> : <Eye className="react-icon" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                <button className="auth-submit" type="submit" disabled={isLoginSubmitting || isLocked}>
                  {isLoginSubmitting ? 'Logging in…' : 'Login'}
                  <ArrowRight className="react-icon" aria-hidden="true" />
                </button>
              </form>
              <p className="auth-card__switch">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => navigateToMode('register')}>
                  Register here
                </button>
              </p>
            </>
          ) : stage === 'otp' ? (
            <form className="auth-form" onSubmit={(event) => void handleVerifyOtp(event)}>
              <div className="auth-stage-icon">
                <ShieldCheck className="react-icon" aria-hidden="true" />
              </div>
              <div className="auth-field">
                <label htmlFor="register-otp">One-Time Password</label>
                <input
                  id="register-otp"
                  className={`auth-input auth-input--otp ${errors.otp ? 'has-error' : ''}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  required
                  placeholder={OTP_PLACEHOLDER}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  aria-invalid={Boolean(errors.otp)}
                  aria-describedby={errors.otp ? 'register-otp-error' : undefined}
                  autoFocus
                />
                {errors.otp ? <span id="register-otp-error" className="auth-error">{errors.otp}</span> : null}
                <div className="auth-otp-meta">
                  <span className={timeLeft < 60 ? 'is-danger' : ''}>Expires in <strong>{formatOtpTime(timeLeft)}</strong></span>
                  <button type="button" onClick={() => void handleResendOtp()} disabled={isResending || timeLeft > OTP_EXPIRY_SECONDS - 30}>
                    <RefreshCw className="react-icon" aria-hidden="true" />
                    {isResending ? 'Sending…' : 'Resend'}
                  </button>
                </div>
              </div>
              <button className="auth-submit" type="submit" disabled={isRegisterSubmitting || timeLeft <= 0 || otp.length !== OTP_LENGTH}>
                {isRegisterSubmitting ? 'Verifying…' : 'Verify OTP'}
                <ArrowRight className="react-icon" aria-hidden="true" />
              </button>
              <button className="auth-text-button" type="button" onClick={() => { setStage('register'); setOtp(''); setErrors({}); }}>
                Back to registration
              </button>
            </form>
          ) : stage === 'success' ? (
            <div className="auth-success" role="status">
              <CheckCircle2 className="auth-success__icon" aria-hidden="true" />
              <p>Verified successfully.</p>
              <span>Redirecting to your dashboard…</span>
            </div>
          ) : (
            <form className="auth-form" onSubmit={(event) => void handleRegisterSubmit(event)}>
              <div className="auth-field">
                <label htmlFor="register-username">Username</label>
                <div className="auth-input-wrap">
                  <UserRound className="react-icon" aria-hidden="true" />
                  <input
                    id="register-username"
                    className={`auth-input ${errors.name ? 'has-error' : ''}`}
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'register-name-error' : undefined}
                  />
                </div>
                {errors.name ? <span id="register-name-error" className="auth-error">{errors.name}</span> : null}
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail className="react-icon" aria-hidden="true" />
                  <input
                    id="register-email"
                    className={`auth-input ${errors.email ? 'has-error' : ''}`}
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@phinmaed.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'register-email-error' : undefined}
                  />
                </div>
                {errors.email ? <span id="register-email-error" className="auth-error">{errors.email}</span> : <span className="auth-hint">Use your {PHINMAED_DOMAIN} address.</span>}
              </div>

              <div className="auth-field-grid">
                <div className="auth-field">
                  <label htmlFor="register-id">Student ID</label>
                  <div className="auth-input-wrap">
                    <IdCard className="react-icon" aria-hidden="true" />
                    <input
                      id="register-id"
                      className={`auth-input ${errors.idNumber ? 'has-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      required
                      placeholder="06-2526-004945"
                      value={idNumber}
                      onChange={(event) => setIdNumber(event.target.value)}
                      aria-invalid={Boolean(errors.idNumber)}
                      aria-describedby={errors.idNumber ? 'register-id-error' : undefined}
                    />
                  </div>
                  {errors.idNumber ? <span id="register-id-error" className="auth-error">{errors.idNumber}</span> : null}
                </div>

                <div className="auth-field">
                  <label htmlFor="register-password">Password</label>
                  <div className="auth-input-wrap">
                    <LockKeyhole className="react-icon" aria-hidden="true" />
                    <input
                      id="register-password"
                      className={`auth-input auth-input--with-toggle ${errors.password ? 'has-error' : ''}`}
                      type={showRegisterPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? 'register-password-error' : undefined}
                    />
                    <button className="auth-password-toggle" type="button" onClick={() => setShowRegisterPassword((visible) => !visible)} aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}>
                      {showRegisterPassword ? <EyeOff className="react-icon" aria-hidden="true" /> : <Eye className="react-icon" aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.password ? <span id="register-password-error" className="auth-error">{errors.password}</span> : null}
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-confirm-password">Confirm Password</label>
                <div className="auth-input-wrap">
                  <LockKeyhole className="react-icon" aria-hidden="true" />
                  <input
                    id="register-confirm-password"
                    className={`auth-input auth-input--with-toggle ${errors.confirmPassword ? 'has-error' : ''}`}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
                  />
                  <button className="auth-password-toggle" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                    {showConfirmPassword ? <EyeOff className="react-icon" aria-hidden="true" /> : <Eye className="react-icon" aria-hidden="true" />}
                  </button>
                </div>
                {errors.confirmPassword ? <span id="register-confirm-password-error" className="auth-error">{errors.confirmPassword}</span> : null}
              </div>

              <button className="auth-submit" type="submit" disabled={isRegisterSubmitting}>
                {isRegisterSubmitting ? 'Creating account…' : 'Create'}
                <ArrowRight className="react-icon" aria-hidden="true" />
              </button>
              <p className="auth-card__switch">
                Already have an account?{' '}
                <button type="button" onClick={() => navigateToMode('login')}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </AuthCard>
      </div>
    </main>
  );
}