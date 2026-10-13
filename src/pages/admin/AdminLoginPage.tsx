// src/pages/admin/AdminLoginPage.tsx

import { useState, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  LockKeyhole,
  Mail,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { useToast } from '../../toast';
import { useAdminStore } from '../../store/adminStore';
import { loginAdmin, mapSupabaseUser } from '../../data/auth';
import { supabase, supabaseAdmin } from '../../lib/supabaseClient';

import '../../styles/admin/admin.css';
import '../../styles/admin/admin-login.css';

/* ============================================
   HELPERS
============================================ */

function isStaffRole(role: string): boolean {
  const normalized = role.toLowerCase().trim();
  return (
    normalized === 'admin' ||
    normalized === 'administrator' ||
    normalized === 'staff' ||
    normalized === 'school staff'
  );
}

const FEATURES = [
  {
    icon: Activity,
    title: 'Real-time order tracking',
    sub: 'Every order and payment, live.',
  },
  {
    icon: CreditCard,
    title: 'Manual & PayMongo verification',
    sub: 'Confirm payments in a few clicks.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure admin-only access',
    sub: 'Restricted to authorized staff.',
  },
];

/* ============================================
   COMPONENT
============================================ */

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setSession, session } = useAdminStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      console.log('[AdminLogin] ✅ Session detected — redirecting to /admin');
      navigate('/admin', { replace: true });
    }
  }, [session, navigate]);

  const handlePasswordKey = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[AdminLogin] 🧹 Clearing all sessions...');
      try {
        await Promise.all([
          supabase.auth.signOut().catch(() => {}),
          supabaseAdmin.auth.signOut().catch(() => {}),
        ]);
      } catch (e) {
        console.warn('[AdminLogin] Sign out warning:', e);
      }

      localStorage.removeItem('sjcm_session');
      localStorage.removeItem('sjcm_admin_auth');
      localStorage.removeItem('sjcm:last-login-email');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      console.log('[AdminLogin] ✅ All sessions cleared');

      const result = await loginAdmin(email, password);
      const user = mapSupabaseUser(result.user);

      console.log('[AdminLogin] ✅ Logged in:', {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      if (!isStaffRole(user.role)) {
        setError('Access denied. This portal is for administrators only.');
        toast('Access denied. Administrator account required.', 'danger');
        setIsSubmitting(false);
        return;
      }

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

      setSession(adminSession);

      console.log('[AdminLogin] ✅ Admin session saved:', user.email);
      toast(`Welcome back, ${user.name}.`, 'success');

      setTimeout(() => {
        console.log('[AdminLogin] 🚀 Redirecting to /admin...');
        window.location.href = '/admin';
      }, 300);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      toast(message, 'danger');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="pl-page">
      <div className="pl-page__bg" aria-hidden="true" />
      <div className="pl-page__overlay" aria-hidden="true" />

      <div className="pl-shell">
        {/* LEFT — Brand panel */}
        <aside className="pl-brand">
          <div className="pl-brand__mark">
            <div className="pl-logo">
              <img src="/logoo.png" alt="SJCM Store logo" width={56} height={56} />
            </div>
            <div>
              <span className="pl-brand__name">SJCM Store</span>
              <span className="pl-brand__tag">Admin Console</span>
            </div>
          </div>

          <h1 className="pl-headline">
            Manage the campus store <em>with confidence.</em>
          </h1>
          <p className="pl-desc">
            Track orders, verify payments, and manage organization accounts — all in one
            place.
          </p>

          <ul className="pl-features">
            {FEATURES.map(({ icon: Icon, title, sub }) => (
              <li className="pl-feature" key={title}>
                <span className="pl-feature__icon">
                  <Icon className="react-icon" aria-hidden="true" />
                </span>
                <span>
                  <span className="pl-feature__title">{title}</span>
                  <span className="pl-feature__sub">{sub}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="pl-brand__footer">
            <p className="pl-motto">“Faith • Excellence • Service”</p>
            <span className="pl-school">Saint Jude College Manila</span>
          </div>
        </aside>

        {/* RIGHT — Login form */}
        <section className="pl-card">
          <div className="pl-card__inner">
            <span className="pl-eyebrow">
              <span className="pl-eyebrow__dot" aria-hidden="true" />
              Admin Access
            </span>
            <h2 className="pl-title">Welcome back</h2>
            <p className="pl-subtitle">
              Sign in with your administrator credentials to continue.
            </p>

            {error ? (
              <div className="pl-alert" role="alert">
                <AlertCircle className="react-icon" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <form className="pl-form" onSubmit={handleSubmit} noValidate>
              <div className="pl-field">
                <div className="pl-label-row">
                  <label htmlFor="admin-email">Email Address</label>
                </div>
                <div className="pl-input">
                  <Mail className="react-icon pl-input__icon" aria-hidden="true" />
                  <input
                    id="admin-email"
                    type="email"
                    placeholder="admin@sjcm.edu.ph"
                    autoComplete="username"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="pl-field">
                <div className="pl-label-row">
                  <label htmlFor="admin-password">Password</label>
                  {capsLock ? (
                    <span className="pl-caps" role="status">
                      <TriangleAlert className="react-icon" aria-hidden="true" /> Caps Lock is on
                    </span>
                  ) : null}
                </div>
                <div className="pl-input">
                  <LockKeyhole className="react-icon pl-input__icon" aria-hidden="true" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handlePasswordKey}
                    onKeyDown={handlePasswordKey}
                    onBlur={() => setCapsLock(false)}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="pl-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="react-icon" aria-hidden="true" />
                    ) : (
                      <Eye className="react-icon" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="pl-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="pl-spinner" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="react-icon" aria-hidden="true" />
                    Sign in to Admin Console
                    <ArrowRight className="react-icon pl-submit__arrow" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="pl-divider">Not an administrator?</div>

            <Link to="/login" className="pl-back">
              <ArrowLeft className="react-icon" aria-hidden="true" />
              Back to Student Login
            </Link>

            <p className="pl-secure">
              <Lock className="react-icon" aria-hidden="true" />
              Encrypted connection · Authorized staff only
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}