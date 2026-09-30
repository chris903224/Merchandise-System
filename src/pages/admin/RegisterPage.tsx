// src/pages/RegisterPage.tsx

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
import AuthBackground from '../components/auth/AuthBackground';
import { OTP_EXPIRY_SECONDS, useOtpTimer } from '../components/auth/useOtpTimer';
import type { AuthStage } from '../components/auth/authTypes';
import { useApp } from '../store';
import { useToast } from '../toast';
import {
  getPasswordErrorMessage,
  isPhinmaedEmail,
  isValidEmail,
  isValidStudentId,
  PHINMAED_DOMAIN,
  STUDENT_ID_EXAMPLE,
} from '../data/validation';
import {
  mapSupabaseUser,
  registerUser,
  resendOtp,
  verifyOtp,
} from '../data/auth';
import '../styles/auth.css';

type RegistrationErrors = {
  name?: string;
  email?: string;
  idNumber?: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
};

const OTP_LENGTH = 6;
const OTP_PLACEHOLDER = '\u2013 \u2013 \u2013 \u2013 \u2013 \u2013';

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useApp();

  const [stage, setStage] = useState<AuthStage>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<RegistrationErrors>({});

  // ✅ OTP timer hook
  const { timeLeft, reset: resetTimer, format: formatOtpTime } = useOtpTimer(
    stage === 'otp',
    () => {
      setErrors((prev) => ({
        ...prev,
        otp: 'This verification code has expired. Resend it to continue.',
      }));
    }
  );

  // ✅ Redirect kapag success
  useEffect(() => {
    if (stage !== 'success') return;
    const timer = window.setTimeout(
      () => navigate('/dashboard', { replace: true }),
      1200
    );
    return () => window.clearTimeout(timer);
  }, [navigate, stage]);

  const validateRegistration = (): boolean => {
    const nextErrors: RegistrationErrors = {};

    if (!name.trim()) nextErrors.name = 'Username is required.';
    else if (name.trim().length < 2)
      nextErrors.name = 'Username must be at least 2 characters.';

    if (!email.trim()) nextErrors.email = 'Email address is required.';
    else if (!isValidEmail(email))
      nextErrors.email = 'Please enter a valid email address.';
    else if (!isPhinmaedEmail(email))
      nextErrors.email = `Email must end with ${PHINMAED_DOMAIN}.`;

    if (!idNumber.trim()) nextErrors.idNumber = 'Student ID number is required.';
    else if (!isValidStudentId(idNumber))
      nextErrors.idNumber = `Format: ${STUDENT_ID_EXAMPLE}`;

    const passwordError = getPasswordErrorMessage(password);
    if (passwordError) nextErrors.password = passwordError;
    if (!confirmPassword)
      nextErrors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword)
      nextErrors.confirmPassword = 'Passwords do not match.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateRegistration()) {
      toast(
        'Please review the highlighted fields before creating your account.',
        'warning'
      );
      return;
    }

    setIsRegisterSubmitting(true);
    try {
      await registerUser({ name, email, password, studentId: idNumber });
      toast('A verification code was sent to your email.', 'success');
      setStage('otp');
      resetTimer();
      setOtp('');
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.',
        'danger'
      );
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setErrors((prev) => ({
        ...prev,
        otp: `Enter the ${OTP_LENGTH}-digit verification code.`,
      }));
      return;
    }

    setIsRegisterSubmitting(true);
    setErrors((prev) => ({ ...prev, otp: undefined }));
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
      setErrors((prev) => ({
        ...prev,
        otp:
          error instanceof Error
            ? error.message
            : 'The code is invalid or expired. Try again.',
      }));
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setErrors((prev) => ({ ...prev, otp: undefined }));
    try {
      await resendOtp(email);
      toast('A new verification code was sent.', 'success');
      resetTimer();
      setOtp('');
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Unable to resend the code.',
        'danger'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="auth-experience">
      <AuthBackground />

      <AuthHeader
        identifier={email}
        password={password}
        isSubmitting={isRegisterSubmitting}
        isLocked={false}
        onIdentifierChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={(event) => {
          if (stage === 'otp') void handleVerifyOtp(event);
          else void handleRegisterSubmit(event);
        }}
      />

      <div className="auth-experience__content">
        <GuidelinesPanel />
        <ImageMarquee />

        <AuthCard
          mode="register"
          title={
            stage === 'otp'
              ? 'Verify your account'
              : stage === 'success'
                ? 'Account verified'
                : 'Register an Account'
          }
          description={
            stage === 'otp'
              ? `Enter the ${OTP_LENGTH}-digit code sent to ${email}.`
              : stage === 'success'
                ? 'Your SJCM account is ready.'
                : 'Create your SJCM merchandise account.'
          }
        >
          {stage === 'otp' ? (
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
                {errors.otp ? (
                  <span id="register-otp-error" className="auth-error">
                    {errors.otp}
                  </span>
                ) : null}
                <div className="auth-otp-meta">
                  <span className={timeLeft < 60 ? 'is-danger' : ''}>
                    Expires in <strong>{formatOtpTime(timeLeft)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleResendOtp()}
                    disabled={isResending || timeLeft > OTP_EXPIRY_SECONDS - 30}
                  >
                    <RefreshCw className="react-icon" aria-hidden="true" />
                    {isResending ? 'Sending…' : 'Resend'}
                  </button>
                </div>
              </div>
              <button
                className="auth-submit"
                type="submit"
                disabled={
                  isRegisterSubmitting || timeLeft <= 0 || otp.length !== OTP_LENGTH
                }
              >
                {isRegisterSubmitting ? 'Verifying…' : 'Verify OTP'}
                <ArrowRight className="react-icon" aria-hidden="true" />
              </button>
              <button
                className="auth-text-button"
                type="button"
                onClick={() => {
                  setStage('register');
                  setOtp('');
                  setErrors({});
                }}
              >
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
              {/* ... lahat ng registration fields (username, email, ID, password, confirm) ... */}
              {/* Same as original code — copy-paste lang */}
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
                  />
                </div>
                {errors.name ? <span className="auth-error">{errors.name}</span> : null}
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
                  />
                </div>
                {errors.email ? (
                  <span className="auth-error">{errors.email}</span>
                ) : (
                  <span className="auth-hint">Use your {PHINMAED_DOMAIN} address.</span>
                )}
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
                      required
                      placeholder="06-2526-004945"
                      value={idNumber}
                      onChange={(event) => setIdNumber(event.target.value)}
                      aria-invalid={Boolean(errors.idNumber)}
                    />
                  </div>
                  {errors.idNumber ? (
                    <span className="auth-error">{errors.idNumber}</span>
                  ) : null}
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
                    />
                    <button
                      className="auth-password-toggle"
                      type="button"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="react-icon" aria-hidden="true" />
                      ) : (
                        <Eye className="react-icon" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <span className="auth-error">{errors.password}</span>
                  ) : null}
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
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="react-icon" aria-hidden="true" />
                    ) : (
                      <Eye className="react-icon" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <span className="auth-error">{errors.confirmPassword}</span>
                ) : null}
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={isRegisterSubmitting}
              >
                {isRegisterSubmitting ? 'Creating account…' : 'Create'}
                <ArrowRight className="react-icon" aria-hidden="true" />
              </button>
              <p className="auth-card__switch">
                Already have an account? <a href="/login">Sign in</a>
              </p>
            </form>
          )}
        </AuthCard>
      </div>
    </main>
  );
}