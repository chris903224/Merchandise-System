// src/pages/VerifyEmailPage.tsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle, ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../toast';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const orderId = searchParams.get('order');
  const email = searchParams.get('email');

  const [otpCode, setOtpCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  /* ✅ Track kung na-trigger na ang auto-send */
  const hasAutoSentRef = useRef(false);

  /* ============================================
     ✅ RESET STATE ON MOUNT
     ============================================ */
  useEffect(() => {
    setOtpCode('');
    setIsVerifying(false);
    setIsSent(false);
    setHasError(false);
    setError('');
    hasAutoSentRef.current = false;
  }, [email, orderId]);

  /* ============================================
     ✅ AUTO-SEND OTP
     ============================================ */
  useEffect(() => {
    if (!email) return;
    if (hasAutoSentRef.current) return;

    hasAutoSentRef.current = true;
    void sendOTP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, orderId]);

  /* ============================================
     ✅ LIVE COUNTDOWN TIMER
     ============================================ */
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  /* ============================================
     ✅ EXTRACT SECONDS FROM SUPABASE ERROR
     ============================================ */
  const extractWaitSeconds = (message: string): number | null => {
    const match = message.match(/after\s+(\d+)\s*seconds?/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    const altMatch = message.match(/(\d+)\s*seconds?/i);
    if (altMatch && altMatch[1]) {
      return parseInt(altMatch[1], 10);
    }

    return null;
  };

  /* ============================================
     ✅ SEND OTP
     ============================================ */
  const sendOTP = async () => {
    if (!email) {
      setError('Missing email address. Please try again from checkout.');
      setHasError(true);
      return;
    }

    setIsSending(true);
    setError('');
    setHasError(false);

    try {
      console.log('[OTP] Sending code to:', email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (error) {
        const waitSeconds = extractWaitSeconds(error.message || '');

        if (waitSeconds !== null) {
          setCountdown(waitSeconds);
          setError(
            `For security purposes, you can only request this after ${waitSeconds} seconds.`
          );
          setHasError(true);
          setIsSent(false);
          hasAutoSentRef.current = true;
          console.log('[OTP] Rate limited. Retry in', waitSeconds, 'seconds');
          return;
        }

        throw error;
      }

      setIsSent(true);
      setCountdown(60);
      toast('Verification code sent!', 'success');
    } catch (err: any) {
      console.error('[OTP] Send failed:', err);
      setError(err.message || 'Failed to send code');
      setHasError(true);
      setIsSent(false);
      hasAutoSentRef.current = false;
    } finally {
      setIsSending(false);
    }
  };

  /* ============================================
     ✅ VERIFY OTP
     ============================================ */
  const verifyOTP = async () => {
    if (!email || otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (error) throw error;

      if (orderId) {
        sessionStorage.setItem(`order_verified_${orderId}`, 'true');
      }

      toast('Email verified successfully!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[OTP] Verify failed:', err);
      setError(err.message || 'Invalid code');
      setOtpCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  /* ============================================
     ✅ RESEND HANDLER
     ============================================ */
  const handleResend = () => {
    if (isSending || countdown > 0) return;
    void sendOTP();
  };

  const maskedEmail = email?.replace(/(.{2}).*@/, '$1***@') || 'your email';

  /* ✅ Check kung naka-rate-limit */
  const isRateLimited = hasError && countdown > 0;

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <div className="otp-verify-page">
          <Link to="/dashboard" className="otp-verify-page__back">
            <ArrowLeft className="react-icon" aria-hidden="true" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="otp-verify-page__card">
            <div className="otp-modal__icon">
              <Mail className="react-icon" aria-hidden="true" />
            </div>

            <h1 className="otp-modal__title">Verify Your Email</h1>
            <p className="otp-modal__desc">
              We sent a 6-digit verification code to{' '}
              <strong>{maskedEmail}</strong>
            </p>

            {/* ============================================
                ✅ LOADING STATE
            ============================================ */}
            {!isSent && isSending && (
              <div className="otp-modal__loading">
                <Loader2 className="react-icon animate-spin" aria-hidden="true" />
                <span>Sending code...</span>
              </div>
            )}

            {/* ============================================
                ✅ RATE-LIMITED STATE
            ============================================ */}
            {isRateLimited && !isSending && (
              <div className="otp-modal__rate-limit">
                <p className="otp-modal__error">
                  ⚠️ For security purposes, you can only request this after{' '}
                  <strong className="otp-modal__countdown">{countdown}</strong>{' '}
                  seconds.
                </p>
                <button
                  type="button"
                  className="otp-modal__btn otp-modal__btn--primary"
                  onClick={handleResend}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? (
                    <>
                      <Loader2 className="react-icon animate-spin" aria-hidden="true" />
                      <span>Wait {countdown}s</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="react-icon" aria-hidden="true" />
                      <span>Try Again</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ============================================
                ✅ ERROR STATE
            ============================================ */}
            {hasError && !isRateLimited && !isSending && !isSent && (
              <div className="otp-modal__error-state">
                <p className="otp-modal__error">⚠️ {error}</p>
                <button
                  type="button"
                  className="otp-modal__btn otp-modal__btn--primary"
                  onClick={handleResend}
                >
                  <RefreshCw className="react-icon" aria-hidden="true" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

            {/* ============================================
                ✅ MANUAL RETRY
            ============================================ */}
            {!isSent && !isSending && !hasError && (
              <button
                type="button"
                className="otp-modal__btn otp-modal__btn--primary"
                onClick={handleResend}
              >
                <Mail className="react-icon" aria-hidden="true" />
                <span>Send Verification Code</span>
              </button>
            )}

            {/* ============================================
                ✅ OTP INPUT
            ============================================ */}
            {isSent && (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(val);
                    setError('');
                  }}
                  placeholder="000000"
                  className="otp-modal__input"
                  autoFocus
                  autoComplete="one-time-code"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && otpCode.length === 6) {
                      void verifyOTP();
                    }
                  }}
                />

                {error && <p className="otp-modal__error">⚠️ {error}</p>}

                <button
                  type="button"
                  className="otp-modal__btn otp-modal__btn--primary"
                  onClick={verifyOTP}
                  disabled={isVerifying || otpCode.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="react-icon animate-spin" aria-hidden="true" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="react-icon" aria-hidden="true" />
                      <span>Verify Email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="otp-modal__btn otp-modal__btn--ghost"
                  onClick={handleResend}
                  disabled={isSending || countdown > 0}
                >
                  {countdown > 0 ? (
                    <>
                      <Loader2 className="react-icon animate-spin" aria-hidden="true" />
                      <span>Resend in {countdown}s</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="react-icon" aria-hidden="true" />
                      <span>Resend Code</span>
                    </>
                  )}
                </button>

                <p className="otp-modal__hint">
                  💡 Didn't receive the code? Check your spam folder or wait{' '}
                  {countdown > 0 ? `${countdown}s` : 'a moment'} to resend.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}