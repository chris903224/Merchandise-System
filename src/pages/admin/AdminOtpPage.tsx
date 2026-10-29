// src/pages/admin/AdminOtpPage.tsx

import { useState, type FormEvent, useEffect } from 'react';
// 🚨 TINANGGAL ANG 'Link' DAHIL HINDI GINAGAMIT
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import { useToast } from '../../toast';
import { useAdminStore } from '../../store/adminStore';
import { supabase } from '../../lib/supabaseClient';

import '../../styles/admin/admin.css';
import '../../styles/admin/admin-login.css';

export default function AdminOtpPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setSession } = useAdminStore(); 

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<{ email: string, user: any } | null>(null);

  // 🚨 Kunin ang data mula sa sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('sjcm_admin_pending_otp');
    if (!raw) {
      navigate('/sjcm-internal-portal-2026', { replace: true });
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.email || !parsed.user) throw new Error('Invalid');
      setPendingData(parsed);
    } catch (err) {
      sessionStorage.removeItem('sjcm_admin_pending_otp');
      navigate('/sjcm-internal-portal-2026', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingData) return;
    
    setError(null);
    if (otp.length !== 6) return setError('Please enter the 6-digit OTP code.');

    setIsSubmitting(true);
    try {
      // Verify OTP sa Supabase
      const { data: isValid, error: rpcError } = await supabase.rpc('verify_admin_otp', { 
        p_email: pendingData.email.toLowerCase(), 
        p_otp: otp 
      });

      if (rpcError || !isValid) {
        setError('Invalid or expired OTP code.');
        setIsSubmitting(false);
        return;
      }

      const adminSession = {
        user: { 
          id: pendingData.user.id, 
          name: pendingData.user.name, 
          email: pendingData.user.email, 
          role: pendingData.user.role, 
          profilePicture: pendingData.user.profilePicture 
        },
        loginAt: Date.now(),
        remember: false,
      };

      // 🚨 I-SAVE SA STORE AT LOCALSTORAGE
      setSession(adminSession); 
      localStorage.setItem('sjcm_admin_auth', JSON.stringify(adminSession));
      sessionStorage.removeItem('sjcm_admin_pending_otp');

      toast(`Welcome back, ${pendingData.user.name}.`, 'success');
      
      // 🚨 GAMITIN ANG NAVIGATE PARA WALANG RELOAD
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 300);

    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
      setIsSubmitting(false);
    }
  };

  if (!pendingData) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050a16', color: '#fff' }}>Loading secure data...</div>;
  }

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
              We sent a 6-digit code to <strong>{pendingData.email}</strong>. Enter it below to continue.
            </p>

            {error && (
              <div className="pl-alert" role="alert">
                <AlertCircle className="react-icon" aria-hidden="true" />
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
              onClick={() => { 
                sessionStorage.removeItem('sjcm_admin_pending_otp'); 
                navigate('/sjcm-internal-portal-2026'); 
              }}
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