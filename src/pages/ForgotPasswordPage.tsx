// src/pages/ForgotPasswordPage.tsx

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import AuthCard from '../components/auth/AuthCard';
import AuthBackground from '../components/auth/AuthBackground';
import GuidelinesPanel from '../components/auth/GuidelinesPanel';
import ImageMarquee from '../components/auth/ImageMarquee';
import { OTP_EXPIRY_SECONDS, useOtpTimer } from '../components/auth/useOtpTimer';
import { useToast } from '../toast';
import {
  getPasswordErrorMessage,
  isValidEmail,
} from '../data/validation';
import {
  resendPasswordResetEmail,
  sendPasswordResetEmail,
  updatePassword,
  verifyPasswordResetOtp,
} from '../data/auth';
import '../styles/auth.css';

type ResetStage = 'email' | 'otp' | 'password' | 'success';

const OTP_LENGTH = 6;
const OTP_PLACEHOLDER = '\u2013 \u2013 \u2013 \u2013 \u2013 \u2013';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [stage, setStage] = useState<ResetStage>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const {
    timeLeft,
    reset: resetTimer,
    format: formatOtpTime,
  } = useOtpTimer(stage === 'otp', () => {
    setErrors((prev) => ({
      ...prev,
      otp: 'This code has expired. Please request a new one.',
    }));
  });

  // STEP 1 — Send reset code
  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!isValidEmail(email))
      nextErrors.email = 'Please enter a valid email address.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(email);
      toast('A reset code was sent to your email.', 'success');
      setStage('otp');
      resetTimer();
      setOtp('');
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Failed to send reset code.',
        'danger'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2 — Verify OTP
  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      setErrors((prev) => ({
        ...prev,
        otp: `Enter the ${OTP_LENGTH}-digit code.`,
      }));
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, otp: undefined }));
    try {
      await verifyPasswordResetOtp(email, otp);
      toast('Code verified. Set your new password.', 'success');
      setStage('password');
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        otp:
          error instanceof Error ? error.message : 'Invalid or expired code.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 3 — Update password
  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const passwordError = getPasswordErrorMessage(newPassword);
    if (passwordError) nextErrors.newPassword = passwordError;
    if (!confirmPassword)
      nextErrors.confirmPassword = 'Please confirm your password.';
    else if (newPassword !== confirmPassword)
      nextErrors.confirmPassword = 'Passwords do not match.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await updatePassword(newPassword);
      toast('Password updated successfully!', 'success');
      setStage('success');
      window.setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Failed to update password.',
        'danger'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setIsResending(true);
    setErrors((prev) => ({ ...prev, otp: undefined }));
    try {
      await resendPasswordResetEmail(email);
      toast('A new reset code was sent.', 'success');
      resetTimer();
      setOtp('');
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Unable to resend code.',
        'danger'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="auth-experience">
      <AuthBackground />

      <div className="auth-experience__content">
        <GuidelinesPanel />
        <ImageMarquee />

        <AuthCard
          mode="login"
          title={
            stage === 'email'
              ? 'Reset Password'
              : stage === 'otp'
                ? 'Verify Code'
                : stage === 'password'
                  ? 'New Password'
                  : 'Password Updated'
          }
          description={
            stage === 'email'
              ? 'Enter your email to receive a reset code.'
              : stage === 'otp'
                ? `We sent a ${OTP_LENGTH}-digit code to ${email}.`
                : stage === 'password'
                  ? 'Choose a strong new password.'
                  : 'You can now sign in with your new password.'
          }
        >
          {/* STEP 1: EMAIL */}
          {stage === 'email' && (
            <form
              className="auth-form"
              onSubmit={(event) => void handleSendCode(event)}
            >
              <div className="auth-field">
                <label htmlFor="reset-email">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail className="react-icon" aria-hidden="true" />
                  <input
                    id="reset-email"
                    className={`auth-input ${errors.email ? 'has-error' : ''}`}
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@phinmaed.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoFocus
                  />
                </div>
                {errors.email ? (
                  <span className="auth-error">{errors.email}</span>
                ) : (
                  <span className="auth-hint">
                    Use the email you registered with.
                  </span>
                )}
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending…' : 'Send Reset Code'}
                <ArrowRight className="react-icon" aria-hidden="true" />
              </button>

              <Link to="/login" className="auth-text-button">
                <ArrowLeft className="react-icon" aria-hidden="true" />
                Back to Login
              </Link>
            </form>
          )}

          {/* STEP 2: OTP */}
          {stage === 'otp' && (
            <form
              className="auth-form"
              onSubmit={(event) => void handleVerifyOtp(event)}
            >
              <div className="auth-stage-icon">
                <ShieldCheck className="react-icon" aria-hidden="true" />
              </div>

              <div className="auth-field">
                <label htmlFor="reset-otp">Verification Code</label>
                <input
                  id="reset-otp"
                  className={`auth-input auth-input--otp ${errors.otp ? 'has-error' : ''}`}
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
                  autoFocus
                />
                {errors.otp ? (
                  <span className="auth-error">{errors.otp}</span>
                ) : null}

                <div className="auth-otp-meta">
                  <span className={timeLeft < 60 ? 'is-danger' : ''}>
                    Expires in <strong>{formatOtpTime(timeLeft)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleResend()}
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
                  isSubmitting || timeLeft <= 0 || otp.length !== OTP_LENGTH
                }
              >
                {isSubmitting ? 'Verifying…' : 'Verify Code'}
                <ArrowRight className="react-icon" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="auth-text-button"
                onClick={() => {
                  setStage('email');
                  setOtp('');
                  setErrors({});
                }}
              >
                <ArrowLeft className="react-icon" aria-hidden="true" />
                Change email
              </button>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {stage === 'password' && (
            <form
              className="auth-form"
              onSubmit={(event) => void handleUpdatePassword(event)}
            >
              <div className="auth-field">
                <label htmlFor="reset-new-password">New Password</label>
                <div className="auth-input-wrap">
                  <LockKeyhole className="react-icon" aria-hidden="true" />
                  <input
                    id="reset-new-password"
                    className={`auth-input auth-input--with-toggle ${
                      errors.newPassword ? 'has-error' : ''
                    }`}
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoFocus
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="react-icon" aria-hidden="true" />
                    ) : (
                      <Eye className="react-icon" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.newPassword ? (
                  <span className="auth-error">{errors.newPassword}</span>
                ) : null}
              </div>

              <div className="auth-field">
                <label htmlFor="reset-confirm-password">
                  Confirm Password
                </label>
                <div className="auth-input-wrap">
                  <LockKeyhole className="react-icon" aria-hidden="true" />
                  <input
                    id="reset-confirm-password"
                    className={`auth-input auth-input--with-toggle ${
                      errors.confirmPassword ? 'has-error' : ''
                    }`}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating…' : 'Update Password'}
                <ArrowRight className="react-icon" aria-hidden="true" />
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {stage === 'success' && (
            <div className="auth-success" role="status">
              <CheckCircle2 className="auth-success__icon" aria-hidden="true" />
              <p>Password updated!</p>
              <span>Redirecting to login…</span>
            </div>
          )}
        </AuthCard>
      </div>
    </main>
  );
}