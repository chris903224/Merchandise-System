// src/pages/admin/AdminLoginPage.tsx

import { useState, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertCircle, ArrowLeft, ArrowRight, CreditCard, Eye, EyeOff, Lock, LockKeyhole, Mail, ShieldCheck, TriangleAlert,
} from 'lucide-react';
import { useToast } from '../../toast';
import { loginAdmin, mapSupabaseUser } from '../../data/auth';
import { supabase, supabaseAdmin } from '../../lib/supabaseClient';

import '../../styles/admin/admin.css';
import '../../styles/admin/admin-login.css';

const ALLOWED_ADMINS = [
  'ropu.sengco.sjc@phinmaed.com',
  'javi.borlagdan.sjc@phinmaed.com',
  'leda.lutrania.sjc@phinmaed.com',
  'chpe.villanueva.sjc@phinmaed.com',
  'chdi.lomocso.sjc@phinmaed.com'
];

const FEATURES = [
  { icon: Activity, title: 'Real-time order tracking', sub: 'Every order and payment, live.' },
  { icon: CreditCard, title: 'Manual & PayMongo verification', sub: 'Confirm payments in a few clicks.' },
  { icon: ShieldCheck, title: 'Secure admin-only access', sub: 'Restricted to authorized staff.' },
];

export default function AdminLoginPage() {
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // 🚨 Initial Check: Kung may naka-save na session, deretso sa dashboard
  useEffect(() => {
    async function checkInitialAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentEmail = session?.user?.email?.toLowerCase().trim();

        if (currentEmail && !currentEmail.endsWith('@phinmaed.com')) {
          await supabase.auth.signOut();
          localStorage.clear();
          window.location.replace('/login');
          return;
        }

        if (currentEmail && ALLOWED_ADMINS.includes(currentEmail)) {
          const isSystemAdmin = session?.user?.app_metadata?.is_system_admin === true;
          if (isSystemAdmin) {
            window.location.replace('/admin');
            return;
          }
        }
        setIsChecking(false);
      } catch (err) {
        console.error(err);
        setIsChecking(false);
      }
    }
    checkInitialAuth();
  }, []);

  const handlePasswordKey = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const emailToCheck = email.trim().toLowerCase();

    if (emailToCheck.split('@')[1] !== 'phinmaed.com') {
      setError('Access Denied. Only @phinmaed.com emails are allowed.');
      toast('Only @phinmaed.com emails can access the Admin Console.', 'danger');
      return;
    }
    if (!ALLOWED_ADMINS.includes(emailToCheck)) {
      setError('Access Denied. Your account is not authorized.');
      toast('Access Denied. You are not in the authorized admin list.', 'danger');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: adminData, error: adminError } = await supabase
        .from('authorized_admins')
        .select('email')
        .eq('email', emailToCheck)
        .maybeSingle();

      if (adminError || !adminData) {
        setError('Access Denied. Account not recognized by system.');
        setIsSubmitting(false);
        return;
      }

      // Clear old sessions
      await Promise.all([
        supabase.auth.signOut().catch(() => {}),
        supabaseAdmin.auth.signOut().catch(() => {}),
      ]);
      localStorage.clear();

      // Login as Admin
      const result = await loginAdmin(emailToCheck, password);
      const user = mapSupabaseUser(result.user);

      // Generate OTP
      const { data: otpCode, error: otpError } = await supabase
        .rpc('generate_admin_otp', { p_email: emailToCheck });

      if (otpError || !otpCode) {
        setError('Failed to generate OTP. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Send OTP via Email
      const emailResponse = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCheck, otp: otpCode }),
      });

      if (!emailResponse.ok) {
        setError('Failed to send OTP email. Please try again.');
        setIsSubmitting(false);
        return;
      }

      toast(`OTP code sent to ${emailToCheck}. Check your inbox.`, 'success');

      // 🚨 SAVE DATA SA SESSIONSTORAGE BAGO MAG-REDIRECT
      sessionStorage.setItem('sjcm_admin_pending_otp', JSON.stringify({
        email: emailToCheck,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
        }
      }));

      window.location.href = '/admin/otp';

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050a16', color: '#fff' }}>Verifying secure portal...</div>;
  }

  return (
    <main className="pl-page">
      <div className="pl-page__bg" aria-hidden="true" />
      <div className="pl-page__overlay" aria-hidden="true" />
      <div className="pl-shell">
        <aside className="pl-brand">
          <div className="pl-brand__mark">
            <div className="pl-logo"><img src="/logoo.png" alt="SJCM Store logo" width={56} height={56} /></div>
            <div>
              <span className="pl-brand__name">SJCM Store</span>
              <span className="pl-brand__tag">Internal Portal</span>
            </div>
          </div>
          <h1 className="pl-headline">Manage the campus store <em>with confidence.</em></h1>
          <p className="pl-desc">Track orders, verify payments, and manage organization accounts — all in one place.</p>
          <ul className="pl-features">
            {FEATURES.map(({ icon: Icon, title, sub }) => (
              <li className="pl-feature" key={title}>
                <span className="pl-feature__icon"><Icon className="react-icon" aria-hidden="true" /></span>
                <span><span className="pl-feature__title">{title}</span><span className="pl-feature__sub">{sub}</span></span>
              </li>
            ))}
          </ul>
          <div className="pl-brand__footer">
            <p className="pl-motto">“Faith • Excellence • Service”</p>
            <span className="pl-school">Saint Jude College Manila</span>
          </div>
        </aside>

        <section className="pl-card">
          <div className="pl-card__inner">
            {/* Shows only on mobile, where the left brand panel is hidden */}
            <div className="pl-mobile-brand">
              <div className="pl-logo"><img src="/logoo.png" alt="" width={42} height={42} /></div>
              <div>
                <span className="pl-brand__name">SJCM Store</span>
                <span className="pl-brand__tag">Internal Portal</span>
              </div>
            </div>

            <span className="pl-eyebrow"><span className="pl-eyebrow__dot" aria-hidden="true" /> Secure Access</span>
            <h2 className="pl-title">Internal Portal</h2>
            <p className="pl-subtitle">Sign in with your authorized credentials to continue.</p>

            {error && (
              <div className="pl-alert" role="alert">
                <AlertCircle className="react-icon" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form className="pl-form" onSubmit={handleSubmit} noValidate>
              <div className="pl-field">
                <div className="pl-label-row"><label htmlFor="admin-email">Email Address</label></div>
                <div className="pl-input">
                  <Mail className="react-icon pl-input__icon" aria-hidden="true" />
                  <input id="admin-email" type="email" placeholder="admin@phinmaed.com" autoComplete="username" autoFocus required
                    value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                </div>
              </div>

              <div className="pl-field">
                <div className="pl-label-row">
                  <label htmlFor="admin-password">Password</label>
                  {capsLock && (<span className="pl-caps" role="status"><TriangleAlert className="react-icon" aria-hidden="true" /> Caps Lock is on</span>)}
                </div>
                <div className="pl-input">
                  <LockKeyhole className="react-icon pl-input__icon" aria-hidden="true" />
                  <input id="admin-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                    autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handlePasswordKey} onKeyDown={handlePasswordKey} onBlur={() => setCapsLock(false)} disabled={isSubmitting} />
                  <button type="button" className="pl-toggle" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                    {showPassword ? <EyeOff className="react-icon" aria-hidden="true" /> : <Eye className="react-icon" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="pl-submit" disabled={isSubmitting}>
                {isSubmitting ? (<><span className="pl-spinner" aria-hidden="true" /> Signing in…</>) : (<><ShieldCheck className="react-icon" aria-hidden="true" /> Sign in to Portal <ArrowRight className="react-icon pl-submit__arrow" aria-hidden="true" /></>)}
              </button>
            </form>

            <div className="pl-divider">Not an administrator?</div>
            <Link to="/login" className="pl-back"><ArrowLeft className="react-icon" aria-hidden="true" /> Back to Student Login</Link>
            <p className="pl-secure"><Lock className="react-icon" aria-hidden="true" /> Encrypted connection · Authorized staff only</p>
          </div>
        </section>
      </div>
    </main>
  );
}