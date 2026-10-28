// src/pages/admin/AdminOtpPage.tsx

import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { useToast } from '../../toast';
// 🚨 INALIS ANG useAdminStore DITO
import { supabase } from '../../lib/supabaseClient';

import '../../styles/admin/admin.css';
import '../../styles/admin/admin-login.css';

export default function AdminOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  // 🚨 INALIS ANG setSession DITO

  const email = (location.state as any)?.email || '';
  const user = (location.state as any)?.user;

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🚨 Kung walang state (na-refresh), ibalik sa login
  useEffect(() => {
    if (!email || !user) {
      navigate('/admin/login', { replace: true });
    }
  }, [email, user, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 🚨 I-verify ang OTP sa database
      const { data: isValid, error: rpcError } = await supabase
        .rpc('verify_admin_otp', { 
          p_email: email.toLowerCase(), 
          p_otp: otp 
        });

      if (rpcError || !isValid) {
        setError('Invalid or expired OTP code.');
        toast('Invalid OTP. Please try again.', 'danger');
        setIsSubmitting(false);
        return;
      }

      // 🚨 I-save DIRETSO SA LOCALSTORAGE (Dahil inalis natin ang setSession)
      const adminSession = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role === 'Staff' ? 'School Staff' : user.role,
          profilePicture: user.profilePicture,
        },
        loginAt: Date.now(),
        remember: false,
      };

      // 🚨 ITO ANG NAG-I-SAVE SA LOCALSTORAGE
      localStorage.setItem('sjcm_admin_auth', JSON.stringify(adminSession));

      toast(`Welcome back, ${user.name}.`, 'success');

      // 🚨 EMERGENCY FIX: Gamitin ang `window.location.href` para sure na mag-reload
      setTimeout(() => {
        window.location.href = '/admin';
      }, 500);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'OTP verification failed.';
      setError(message);
      toast(message, 'danger');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="pl-page">
      <div className="pl-page__bg" aria-hidden="true" />
      <div className="pl-page__overlay" aria-hidden="true" />
      
      <div className="pl-shell" style={{ gridTemplateColumns: '1fr', maxWidth: '500px' }}>
        <section className="pl-card">
          <div className="pl-card__inner">
            <span className="pl-eyebrow">
              <span className="pl-eyebrow__dot" aria-hidden="true" />
              OTP Verification
            </span>
            <h2 className="pl-title">Enter Verification Code</h2>
            <p className="pl-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>. Enter it below to continue.
            </p>

            {error && (
              <div className="pl-alert" role="alert">
                <ShieldCheck className="react-icon" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form className="pl-form" onSubmit={handleSubmit}>
              <div className="pl-field">
                <div className="pl-label-row">
                  <label htmlFor="otp-code">OTP Code</label>
                </div>
                <div className="pl-input">
                  <KeyRound className="react-icon pl-input__icon" aria-hidden="true" />
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    autoFocus
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={isSubmitting}
                    style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }}
                  />
                </div>
              </div>

              <button type="submit" className="pl-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="pl-spinner" aria-hidden="true" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="react-icon" aria-hidden="true" />
                    Verify & Access Console
                    <ArrowRight className="react-icon pl-submit__arrow" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="pl-back"
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: 'var(--color-text-muted)' }}
            >
              <ArrowLeft className="react-icon" aria-hidden="true" />
              Back to Login
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}