// src/pages/organization/OrgLoginPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Eye, EyeOff, Boxes, ShieldHalf,
  LockKeyhole, HelpCircle, ChevronDown
} from 'lucide-react';
import { useApp } from '../../store';
import { supabase } from '../../lib/supabaseClient';
import { saveOrgSession } from '../../services/organization/orgSessionService'; // 🚨 IDINAGDAG

export default function OrgLoginPage() {
  const [staffUser, setStaffUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [openAcc, setOpenAcc] = useState(0);

  const navigate = useNavigate();
  const { signIn, session: currentSession, isLoading } = useApp();

  // 🚨 MATINDING HARANG #1: Bawal pumasok ang Student dito
  useEffect(() => {
    if (!isLoading && currentSession && currentSession.role !== 'Organization') {
      console.warn('[OrgLogin] Student detected. Blocking access.');
      navigate('/', { replace: true });
    }
  }, [currentSession, isLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!staffUser || !password) {
      setToast({ msg: 'Enter your staff user and password to continue.', type: 'error' });
      return;
    }
    setLoading(true);
    setToast(null);

    try {
      // 🚨 MATINDING HARANG #2: Linisin ang lumang Student session
      localStorage.removeItem('sjc-session');
      localStorage.removeItem('sjc-course');
      localStorage.removeItem('sjc-year-level');
      localStorage.removeItem('sjc-dob');

      // 1. Supabase Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: staffUser.trim(),
        password: password,
      });
      if (authError) throw new Error(authError.message || 'Invalid credentials.');

      // 2. Kunin ang profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) throw new Error(profileError.message);
      if (!profile) throw new Error('Profile not found in database.');
      
      // 3. I-verify kung Organization
      if (profile.role !== 'Organization') {
        await supabase.auth.signOut();
        throw new Error('Access denied. This account is not an Organization.');
      }

      // 4. I-setup ang Session object
      const session = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: 'Organization' as const,
        organization: 'SJC Supply Office',
        idNumber: profile.student_id || 'ORG-001',
      };

      // 5. I-save sa global state (para sa OrgGuard)
      signIn(session);

      // 6. I-save sa orgSessionService (Ito na ang tamang paraan)
      saveOrgSession({
        userId: profile.id,
        email: profile.email,
        role: 'Organization',
        name: profile.name,
        organization: 'SJC Supply Office',
      });
      console.log('[OrgLogin] ✅ Org Session saved properly.');

      // 7. Redirect
      setToast({ msg: `Welcome back, ${session.name}. Access granted.`, type: 'success' });
      setTimeout(() => navigate('/org/dashboard', { replace: true }), 800);
      
    } catch (err: any) {
      setToast({ msg: err.message || 'Login failed. Please check your credentials.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const guidelines = [
    { icon: Boxes, title: 'Scope of access', body: 'Manage products, track inventory stock, and configure organization payment methods through this portal.' },
    { icon: ShieldHalf, title: 'Keep credentials private', body: 'This account is strictly confidential. Do not share it or allow unauthorized personnel to access it under any circumstances.' },
    { icon: LockKeyhole, title: 'Account provisioning', body: 'Accounts are created and issued by the System Administrator for authorized personnel only. Public registration is disabled.' },
    { icon: HelpCircle, title: 'Need help?', body: 'Contact your administrator or official support for account assistance, password resets, and technical questions.' },
  ];

  if (isLoading) return null;

  return (
    <div className="org-login-wrapper">
      <main className="shell">
        {/* LEFT: Guidelines */}
        <section className="panel guidelines">
          <header>
            <p className="eyebrow">Start here</p>
            <h1>System Guidelines</h1>
            <p className="lead">Keep your organization account secure and ready for inventory and order management.</p>
          </header>
          <div className="acc-list">
            {guidelines.map((item, i) => {
              const Icon = item.icon;
              const isOpen = openAcc === i;
              return (
                <div key={i} className={`acc${isOpen ? ' is-open' : ''}`}>
                  <button className="acc__trigger" type="button" onClick={() => setOpenAcc(isOpen ? -1 : i)}>
                    <span className="acc__icon">
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <span className="acc__title">{item.title}</span>
                    <ChevronDown size={20} className="acc__chevron" />
                  </button>
                  <div className="acc__body">
                    <div className="acc__inner"><p>{item.body}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT: Login */}
        <section className="panel login">
          <div className="login__brand">
            <img className="login__logo" src="/logo.png" alt="Logo" />
            <h2>Organization</h2>
          </div>
          <p className="lead" style={{ marginBottom: '32px' }}>Sign in to manage products, inventory, and transactions.</p>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="staffUser">Email</label>
              <div className="input-wrap">
                <User size={20} className="icon-left" />
                <input className="input" id="staffUser" type="email" placeholder="e.g. admin@sjc.edu.ph" value={staffUser} onChange={(e) => setStaffUser(e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <Lock size={20} className="icon-left" />
                <input className="input" id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button className="toggle-pw" type="button" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button className="btn" type="submit" disabled={loading} style={{ marginTop: '16px' }}>
              {loading ? 'Authenticating…' : 'Login'}
            </button>
          </form>

          {toast && (
            <div className={`toast toast--${toast.type}`} style={{ marginTop: '24px' }}>
              <span>{toast.msg}</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}