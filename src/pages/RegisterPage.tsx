// src/pages/RegisterPage.tsx

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import AuthCard from '../components/auth/AuthCard';
import AuthHeader from '../components/auth/AuthHeader';
import GuidelinesPanel from '../components/auth/GuidelinesPanel';
import ImageMarquee from '../components/auth/ImageMarquee';
import AuthBackground from '../components/auth/AuthBackground';
import RegisterRequirementsModal from '../components/auth/RegisterRequirementsModal';
import PasswordStrength, {
  isStrongPassword,
} from '../components/auth/PasswordStrength';
import { OTP_EXPIRY_SECONDS, useOtpTimer } from '../components/auth/useOtpTimer';
import { useRateLimit } from '../components/auth/useRateLimit';
import type { AuthStage } from '../components/auth/authTypes';
import { useApp } from '../store';
import { useToast } from '../toast';
import {
  EmailAlreadyRegisteredError,
  mapSupabaseUser,
  registerUser,
  resendOtp,
  StudentIdAlreadyRegisteredError,
  verifyOtp,
} from '../data/auth';
import {
  isPhinmaedEmail,
  isValidEmail,
  isValidStudentId,
  PHINMAED_DOMAIN,
} from '../data/validation';
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

/* ============================================
   ✅ Auto-format student ID
============================================ */
function formatStudentIdInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 12);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useApp();

  /* ✅ Global rate-limit — same hook, shared state */
  const { isLocked: isLoginLocked, secondsLeft } = useRateLimit();

  /* ✅ Header inputs (independent — hindi nakakaapekto sa register form) */
  const [headerIdentifier, setHeaderIdentifier] = useState('');
  const [headerPassword, setHeaderPassword] = useState('');
  const [isHeaderSubmitting] = useState(false);

  /* ✅ lockUntil timestamp para sa countdown display sa AuthHeader */
  const loginLockUntil = isLoginLocked ? Date.now() + secondsLeft * 1000 : null;

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

  /* ✅ Requirements Modal state */
  const [showRequirementsModal, setShowRequirementsModal] = useState(true);

  /* ✅ Password field focus — para i-show yung floating popover */
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  /* ✅ OTP timer */
  const { timeLeft, reset: resetTimer, format: formatOtpTime } = useOtpTimer(
    stage === 'otp',
    () => {
      setErrors((prev) => ({
        ...prev,
        otp: 'This verification code has expired. Resend it to continue.',
      }));
    }
  );

  /* ✅ Redirect kapag success */
  useEffect(() => {
    if (stage !== 'success') return;
    const timer = window.setTimeout(
      () => navigate('/dashboard', { replace: true }),
      1200
    );
    return () => window.clearTimeout(timer);
  }, [navigate, stage]);

  /* ✅ Validation */
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

    if (!idNumber.trim()) {
      nextErrors.idNumber = 'Student ID number is required.';
    } else if (!isValidStudentId(idNumber)) {
      nextErrors.idNumber = 'Format must be like: XX-XXXX-XXXXXX';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (!isStrongPassword(password)) {
      nextErrors.password = 'Password does not meet the requirements.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /* ✅ Register submit */
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
      if (error instanceof EmailAlreadyRegisteredError) {
        setErrors((prev) => ({
          ...prev,
          email: 'This email is already registered. Please sign in instead.',
        }));
        toast(
          'This email is already registered. Please sign in instead.',
          'danger'
        );
        return;
      }

      if (error instanceof StudentIdAlreadyRegisteredError) {
        setErrors((prev) => ({
          ...prev,
          idNumber: 'This Student ID is already registered.',
        }));
        toast(
          'This Student ID is already registered. Please sign in instead.',
          'danger'
        );
        return;
      }

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

  /* ✅ Verify OTP */
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
      toast(
        'Your account is verified. Redirecting to your dashboard.',
        'success'
      );
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

  /* ✅ Resend OTP */
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

  const handleStudentIdChange = (value: string) => {
    const formatted = formatStudentIdInput(value);
    setIdNumber(formatted);
  };

  /* ✅ Live states */
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const showPasswordPopover =
    isPasswordFocused || Boolean(errors.password);

  return (
    <main className="auth-experience">
      <AuthBackground />

      {/* ✅ REGISTRATION REQUIREMENTS MODAL */}
      <RegisterRequirementsModal
        isOpen={showRequirementsModal}
        onContinue={() => setShowRequirementsModal(false)}
      />

      {/* ✅ HEADER — naka-lock kapag naka-lock sa login (via shared useRateLimit) */}
      <AuthHeader
        identifier={headerIdentifier}
        password={headerPassword}
        isSubmitting={isHeaderSubmitting}
        isLocked={isLoginLocked}
        lockUntil={loginLockUntil}
        onIdentifierChange={setHeaderIdentifier}
        onPasswordChange={setHeaderPassword}
        onSubmit={(event) => {
          event.preventDefault();
          /* ✅ Redirect sa login page kung gusto mag-login via header */
          navigate('/login');
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
            /* ============================================
               STAGE: OTP VERIFICATION
            ============================================ */
            <form
              className="auth-form"
              onSubmit={(event) => void handleVerifyOtp(event)}
            >
              <div className="auth-stage-icon">
                <ShieldCheck className="react-icon" aria-hidden="true" />
              </div>

              <div className="auth-field">
                <label htmlFor="register-otp">One-Time Password</label>
                <input
                  id="register-otp"
                  className={`auth-input auth-input--otp ${
                    errors.otp ? 'has-error' : ''
                  }`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  required
                  placeholder={OTP_PLACEHOLDER}
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, ''))
                  }
                  aria-invalid={Boolean(errors.otp)}
                  aria-describedby={
                    errors.otp ? 'register-otp-error' : undefined
                  }
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
                    disabled={
                      isResending || timeLeft > OTP_EXPIRY_SECONDS - 30
                    }
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
                  isRegisterSubmitting ||
                  timeLeft <= 0 ||
                  otp.length !== OTP_LENGTH
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
            /* ============================================
               STAGE: SUCCESS
            ============================================ */
            <div className="auth-success" role="status">
              <CheckCircle2
                className="auth-success__icon"
                aria-hidden="true"
              />
              <p>Verified successfully.</p>
              <span>Redirecting to your dashboard…</span>
            </div>
          ) : (
            /* ============================================
               STAGE: REGISTER FORM
            ============================================ */
            <form
              className="auth-form"
              onSubmit={(event) => void handleRegisterSubmit(event)}
            >
              {/* USERNAME */}
              <div className="auth-field">
                <label htmlFor="register-username">Username</label>
                <div className="auth-input-wrap">
                  <UserRound className="react-icon" aria-hidden="true" />
                  <input
                    id="register-username"
                    className={`auth-input ${
                      errors.name ? 'has-error' : ''
                    }`}
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="your.name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                  />
                </div>
                {errors.name ? (
                  <span className="auth-error">{errors.name}</span>
                ) : null}
              </div>

              {/* EMAIL */}
              <div className="auth-field">
                <label htmlFor="register-email">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail className="react-icon" aria-hidden="true" />
                  <input
                    id="register-email"
                    className={`auth-input ${
                      errors.email ? 'has-error' : ''
                    }`}
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
                  <span className="auth-hint">
                    Use your {PHINMAED_DOMAIN} address.
                  </span>
                )}
              </div>

              {/* STUDENT ID + PASSWORD */}
              <div className="auth-field-grid">
                {/* ✅ STUDENT ID */}
                <div className="auth-field">
                  <label htmlFor="register-id">Student ID</label>
                  <div className="auth-input-wrap">
                    <IdCard className="react-icon" aria-hidden="true" />
                    <input
                      id="register-id"
                      className={`auth-input ${
                        errors.idNumber ? 'has-error' : ''
                      }`}
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="00-0000-000000"
                      maxLength={14}
                      value={idNumber}
                      onChange={(event) =>
                        handleStudentIdChange(event.target.value)
                      }
                      aria-invalid={Boolean(errors.idNumber)}
                    />
                  </div>
                  {errors.idNumber ? (
                    <span className="auth-error">{errors.idNumber}</span>
                  ) : (
                    <span className="auth-hint">
                      Format: <strong>XX-XXXX-XXXXXX</strong>
                    </span>
                  )}
                </div>

                {/* ✅ PASSWORD — may FLOATING popover */}
                <div className="auth-field">
                  <label htmlFor="register-password">Password</label>

                  <div className="auth-field__relative">
                    <div className="auth-input-wrap">
                      <LockKeyhole
                        className="react-icon"
                        aria-hidden="true"
                      />
                      <input
                        id="register-password"
                        className={`auth-input auth-input--with-toggle ${
                          errors.password ? 'has-error' : ''
                        }`}
                        type={
                          showRegisterPassword ? 'text' : 'password'
                        }
                        autoComplete="new-password"
                        required
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() =>
                          setTimeout(
                            () => setIsPasswordFocused(false),
                            150
                          )
                        }
                        aria-invalid={Boolean(errors.password)}
                      />
                      <button
                        className="auth-password-toggle"
                        type="button"
                        onClick={() =>
                          setShowRegisterPassword((v) => !v)
                        }
                        aria-label={
                          showRegisterPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >
                        {showRegisterPassword ? (
                          <EyeOff
                            className="react-icon"
                            aria-hidden="true"
                          />
                        ) : (
                          <Eye
                            className="react-icon"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </div>

                    {/* ✅ FLOATING POPOVER — nasa labas ng panel */}
                    <PasswordStrength
                      value={password}
                      visible={showPasswordPopover && password.length > 0}
                    />
                  </div>

                  {errors.password ? (
                    <span className="auth-error">{errors.password}</span>
                  ) : null}
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="auth-field">
                <label htmlFor="register-confirm-password">
                  Confirm Password
                </label>
                <div className="auth-input-wrap">
                  <LockKeyhole className="react-icon" aria-hidden="true" />
                  <input
                    id="register-confirm-password"
                    className={`auth-input auth-input--with-toggle ${
                      errors.confirmPassword ? 'has-error' : ''
                    } ${passwordsMatch ? 'is-valid' : ''}`}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    aria-invalid={Boolean(errors.confirmPassword)}
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff
                        className="react-icon"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye className="react-icon" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {confirmPassword.length > 0 && (
                  <span
                    className={`auth-hint ${
                      passwordsMatch
                        ? 'auth-hint--success'
                        : 'auth-hint--error'
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <Check
                          className="react-icon"
                          aria-hidden="true"
                        />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="react-icon" aria-hidden="true" />
                        <span>Passwords do not match</span>
                      </>
                    )}
                  </span>
                )}

                {errors.confirmPassword ? (
                  <span className="auth-error">
                    {errors.confirmPassword}
                  </span>
                ) : null}
              </div>

              {/* SUBMIT */}
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