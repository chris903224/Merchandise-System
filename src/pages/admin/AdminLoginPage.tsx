// src/pages/admin/AdminLoginPage.tsx

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../toast';
import { useAdminStore } from '../../store/adminStore';
import { loginUser, mapSupabaseUser } from '../../data/auth';
import '../../styles/admin/admin.css';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Kung may existing admin session → redirect sa /admin
  useEffect(() => {
    if (session) {
      navigate('/admin', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginUser(email, password);
      const user = mapSupabaseUser(result.user);

      // ✅ Block kung hindi staff/admin
      if (!isStaffRole(user.role)) {
        setError('Access denied. This portal is for administrators only.');
        toast('Access denied. Administrator account required.', 'danger');
        setIsSubmitting(false);
        return;
      }

      // ✅ Save admin session
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

      toast(`Welcome back, ${user.name}.`, 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      toast(message, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login">
      {/* Background */}
      <div className="admin-login__bg" aria-hidden="true" />
      <div className="admin-login__overlay" aria-hidden="true" />

      <div className="admin-login__wrap">

        {/* LEFT — Brand panel */}
        <aside className="admin-login__brand">
          <div className="admin-login__brand-mark">
            <div className="admin-login__logo">SJ</div>
            <div className="admin-login__brand-text">
              <span className="admin-login__brand-name">SJCM Store</span>
              <span className="admin-login__brand-tag">Admin Console</span>
            </div>
          </div>

          <h1 className="admin-login__headline">
            Manage the campus store<br />with confidence.
          </h1>
          <p className="admin-login__desc">
            Track orders, verify payments, and manage organization accounts — all in one place.
          </p>

          <ul className="admin-login__features">
            <li>
              <span className="admin-login__check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              Real-time order &amp; payment tracking
            </li>
            <li>
              <span className="admin-login__check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              Manual &amp; PayMongo payment verification
            </li>
            <li>
              <span className="admin-login__check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              Secure admin-only access
            </li>
          </ul>

          <p className="admin-login__footer">
            "Faith • Excellence • Service"<br />
            <span>Saint Jude College Manila</span>
          </p>
        </aside>

        {/* RIGHT — Login form */}
        <section className="admin-login__card">
          <div className="admin-login__card-inner">
            <span className="admin-login__eyebrow">Admin Access</span>
            <h2 className="admin-login__title">Sign in</h2>
            <p className="admin-login__subtitle">
              Enter your administrator credentials to continue.
            </p>

            {error ? (
              <div className="admin-login__callout" role="alert">
                <AlertCircle className="react-icon" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
              <div className="admin-login__field">
                <label htmlFor="admin-email">Email Address</label>
                <div className="admin-login__input-wrap">
                  <Mail className="react-icon admin-login__input-icon" aria-hidden="true" />
                  <input
                    id="admin-email"
                    type="email"
                    placeholder="admin@sjcm.edu.ph"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="admin-login__field">
                <label htmlFor="admin-password">Password</label>
                <div className="admin-login__input-wrap">
                  <LockKeyhole className="react-icon admin-login__input-icon" aria-hidden="true" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="admin-login__toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="react-icon" aria-hidden="true" />
                    ) : (
                      <Eye className="react-icon" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="admin-login__submit"
                disabled={isSubmitting}
              >
                <ShieldCheck className="react-icon" aria-hidden="true" />
                {isSubmitting ? 'Signing in…' : 'Sign in to Admin Console'}
                <ArrowRight className="react-icon" aria-hidden="true" />
              </button>
            </form>

            <div className="admin-login__divider">
              <span>Not an administrator?</span>
            </div>

            <Link to="/login" className="admin-login__back">
              ← Back to Student Login
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}