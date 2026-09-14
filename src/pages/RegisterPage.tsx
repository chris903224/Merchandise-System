// src/pages/RegisterPage.tsx

import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  UserRoundPlus,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import {
  registerUser,
  verifyOtp,
  resendOtp,
  mapSupabaseUser,
} from '../data/auth';
import {
  isValidEmail,
  isPhinmaedEmail,
  isValidStudentId,
  PHINMAED_DOMAIN,
  STUDENT_ID_EXAMPLE,
  getPasswordErrorMessage,
} from '../data/validation';

const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
} as const;

type Stage = 'register' | 'otp' | 'success';

/** Must match the Supabase "Email OTP length" setting (Auth → Providers → Email). */
const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useApp();

  // Stage control
  const [stage, setStage] = useState<Stage>('register');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP states
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const [isResending, setIsResending] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    idNumber?: string;
    password?: string;
    confirmPassword?: string;
    otp?: string;
  }>({});

  // ⏱️ OTP countdown timer
  useEffect(() => {
    if (stage !== 'otp') return;
    if (timeLeft <= 0) {
      setErrors((prev) => ({ ...prev, otp: 'Expired na ang OTP. Paki-resend.' }));
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  // ============================================
  // VALIDATION
  // ============================================
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Full name
    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    // Email
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    } else if (!isPhinmaedEmail(email)) {
      newErrors.email = `Email must end with ${PHINMAED_DOMAIN}.`;
    }

    // Student ID
    if (!idNumber.trim()) {
      newErrors.idNumber = 'Student ID number is required.';
    } else if (!isValidStudentId(idNumber)) {
      newErrors.idNumber = `Format: ${STUDENT_ID_EXAMPLE}`;
    }

    // Password
    const pwdError = getPasswordErrorMessage(password);
    if (pwdError) newErrors.password = pwdError;

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // STEP 1: REGISTER → SEND OTP
  // ============================================
  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      toast('Please fix the errors before submitting.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
        name,
        email,
        password,
        studentId: idNumber,
      });

      toast('Nagpadala kami ng OTP sa email mo. Tingnan ang inbox.', 'success');
      setStage('otp');
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setOtp('');
    } catch (error) {
      console.error('Register error:', error);
      toast(
        error instanceof Error ? error.message : 'Registration failed. Please try again.',
        'danger',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // STEP 2: VERIFY OTP
  // ============================================
  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      setErrors((prev) => ({
        ...prev,
        otp: `Ilagay ang ${OTP_LENGTH}-digit code.`,
      }));
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, otp: undefined }));

    try {
      const result = await verifyOtp(email, otp);
      const user = mapSupabaseUser(result.user);

      // Update app state
      signIn({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        idNumber: user.studentId,
        organization: 'SJCM General',
      } as any);

      setStage('success');
      toast('Verified! Redirecting sa dashboard...', 'success');

      setTimeout(() => navigate(ROUTES.DASHBOARD, { replace: true }), 1200);
    } catch (error) {
      console.error('Verify OTP error:', error);
      setErrors((prev) => ({
        ...prev,
        otp:
          error instanceof Error
            ? error.message
            : 'Mali o expired ang OTP. Subukan ulit.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RESEND OTP
  // ============================================
  const handleResendOtp = async () => {
    setIsResending(true);
    setErrors((prev) => ({ ...prev, otp: undefined }));
    try {
      await resendOtp(email);
      toast('Bagong OTP ang ipinadala.', 'success');
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setOtp('');
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast(
        error instanceof Error ? error.message : 'Hindi ma-resend ang OTP.',
        'danger',
      );
    } finally {
      setIsResending(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ============================================
  // RENDER: OTP STAGE
  // ============================================
  if (stage === 'otp') {
    return (
      <main className="register-page">
        <div className="register-bg">
          <div className="register-glow glow-1" />
          <div className="register-glow glow-2" />
        </div>

        <div className="register-container glass">
          <header className="register-header">
            <div className="register-icon">
              <ShieldCheck className="react-icon" aria-hidden="true" />
            </div>
            <h1 className="register-title">I-enter ang OTP</h1>
            <p className="register-description">
              Nagpadala kami ng {OTP_LENGTH}-digit verification code sa{' '}
              <b>{email}</b>. Ilagay ito sa loob ng 5 minuto.
            </p>
          </header>

          <form className="register-form" onSubmit={handleVerifyOtp}>
            <div className="register-field">
              <label className="register-label" htmlFor="register-otp">
                <Lock className="react-icon" aria-hidden="true" />
                <span>One-Time Password</span>
              </label>
              <input
                type="text"
                id="register-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                className={`register-input glass-input register-otp-input ${
                  errors.otp ? 'register-input--error' : ''
                }`}
                placeholder={'0'.repeat(OTP_LENGTH)}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  if (errors.otp) setErrors({ ...errors, otp: undefined });
                }}
                autoFocus
              />
              {errors.otp && <span className="register-error">{errors.otp}</span>}

              <div className="register-otp-meta">
                <span
                  className={`register-otp-timer ${
                    timeLeft < 60 ? 'is-danger' : ''
                  }`}
                >
                  ⏱️ Expires in: <b>{formatTime(timeLeft)}</b>
                </span>
                <button
                  type="button"
                  className="register-otp-resend"
                  onClick={handleResendOtp}
                  disabled={isResending || timeLeft > OTP_EXPIRY_SECONDS - 30}
                >
                  {isResending ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="register-submit glass-btn"
              disabled={
                isSubmitting || timeLeft <= 0 || otp.length !== OTP_LENGTH
              }
            >
              <span>{isSubmitting ? 'Verifying...' : 'Verify OTP'}</span>
              <ArrowRight className="react-icon" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="register-otp-back"
              onClick={() => {
                setStage('register');
                setOtp('');
                setErrors({});
              }}
            >
              ← Bumalik sa registration
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ============================================
  // RENDER: SUCCESS STAGE
  // ============================================
  if (stage === 'success') {
    return (
      <main className="register-page">
        <div className="register-bg">
          <div className="register-glow glow-1" />
          <div className="register-glow glow-2" />
        </div>
        <div className="register-container glass">
          <header className="register-header">
            <div className="register-icon">
              <ShieldCheck className="react-icon" aria-hidden="true" />
            </div>
            <h1 className="register-title">✅ Verified!</h1>
            <p className="register-description">Redirecting sa dashboard...</p>
          </header>
        </div>
      </main>
    );
  }

  // ============================================
  // RENDER: REGISTER STAGE
  // ============================================
  return (
    <main className="register-page">
      <div className="register-bg">
        <div className="register-glow glow-1" />
        <div className="register-glow glow-2" />
      </div>

      <div className="register-container glass">
        <header className="register-header">
          <div className="register-icon">
            <UserRoundPlus className="react-icon" aria-hidden="true" />
          </div>
          <h1 className="register-title">Create a Student Account</h1>
          <p className="register-description">
            Register as a student to reserve SJCM uniforms and organization
            merchandise.
          </p>
        </header>

        <form className="register-form" onSubmit={handleRegister}>
          {/* Full Name */}
          <div className="register-field">
            <label className="register-label" htmlFor="register-name">
              <User className="react-icon" aria-hidden="true" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              id="register-name"
              className={`register-input glass-input ${
                errors.name ? 'register-input--error' : ''
              }`}
              placeholder="e.g. Juan dela Cruz"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
            />
            {errors.name && (
              <span className="register-error">{errors.name}</span>
            )}
          </div>

          {/* Email */}
          <div className="register-field">
            <label className="register-label" htmlFor="register-email">
              <Mail className="react-icon" aria-hidden="true" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              id="register-email"
              className={`register-input glass-input ${
                errors.email ? 'register-input--error' : ''
              }`}
              placeholder="name@phinmaed.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
            />
            {errors.email && (
              <span className="register-error">{errors.email}</span>
            )}
            <p className="register-hint">
              Kailangan {PHINMAED_DOMAIN} ang email mo.
            </p>
          </div>

          {/* Student ID */}
          <div className="register-field">
            <label className="register-label" htmlFor="register-id">
              <CreditCard className="react-icon" aria-hidden="true" />
              <span>Student ID Number</span>
            </label>
            <input
              type="text"
              id="register-id"
              className={`register-input glass-input ${
                errors.idNumber ? 'register-input--error' : ''
              }`}
              placeholder={STUDENT_ID_EXAMPLE}
              value={idNumber}
              onChange={(e) => {
                setIdNumber(e.target.value);
                if (errors.idNumber)
                  setErrors({ ...errors, idNumber: undefined });
              }}
            />
            {errors.idNumber && (
              <span className="register-error">{errors.idNumber}</span>
            )}
            <p className="register-hint">
              Format: 06-2526-XXXXXX (halimbawa: {STUDENT_ID_EXAMPLE})
            </p>
          </div>

          {/* Password */}
          <div className="register-field">
            <label className="register-label" htmlFor="register-password">
              <Lock className="react-icon" aria-hidden="true" />
              <span>Password</span>
            </label>
            <div className="register-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="register-password"
                className={`register-input glass-input ${
                  errors.password ? 'register-input--error' : ''
                }`}
                placeholder="Christian@0110"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors({ ...errors, password: undefined });
                }}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="react-icon" />
                ) : (
                  <Eye className="react-icon" />
                )}
              </button>
            </div>
            {errors.password && (
              <span className="register-error">{errors.password}</span>
            )}
            <p className="register-hint">
              Min 8 chars, may uppercase, lowercase, number, at special char
              (halimbawa: Christian@0110)
            </p>
          </div>

          {/* Confirm Password */}
          <div className="register-field">
            <label
              className="register-label"
              htmlFor="register-confirm-password"
            >
              <Lock className="react-icon" aria-hidden="true" />
              <span>Confirm Password</span>
            </label>
            <div className="register-password-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="register-confirm-password"
                className={`register-input glass-input ${
                  errors.confirmPassword ? 'register-input--error' : ''
                }`}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors({ ...errors, confirmPassword: undefined });
                }}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="react-icon" />
                ) : (
                  <Eye className="react-icon" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="register-error">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="register-submit glass-btn"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? 'Creating account...' : 'Create account'}</span>
            <ArrowRight className="react-icon" aria-hidden="true" />
          </button>
        </form>

        <footer className="register-footer">
          Already have an account? <Link to={ROUTES.LOGIN}>Sign in</Link>
        </footer>
      </div>
    </main>
  );
}