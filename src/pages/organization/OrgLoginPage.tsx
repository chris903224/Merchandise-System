// src/pages/organization/OrgLoginPage.tsx

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Eye, EyeOff, Boxes, ShieldHalf,
  LockKeyhole, HelpCircle, ChevronDown, KeyRound
} from 'lucide-react';
import { useApp } from '../../store';
import { supabaseOrg } from '../../lib/supabaseClient';
// 🚨 SIGURADUHING TAMA ANG PATH NA ITO (kung saan naka-export ang saveOrgSession)
import { saveOrgSession } from '../../services/organization/orgSessionService'; 

import '../../styles/organization/OrgLoginPage.css';

export default function OrgLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [openAcc, setOpenAcc] = useState(0);

  const navigate = useNavigate();
  const { signIn, isLoading } = useApp();

  useEffect(() => {
    document.body.classList.add('org-body-bg');
    return () => {
      document.body.classList.remove('org-body-bg');
    };
  }, []);

  // 🚨 STEP 1: VERIFY CREDENTIALS, GENERATE OTP, SAVE TO DB, SEND VIA BREVO
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      setToast({ msg: 'Enter your email and password to continue.', type: 'error' });
      return;
    }
    setLoading(true);
    setToast(null);

    try {
      // 1. I-verify ang credentials
      const { data: authData, error: authError } = await supabaseOrg.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      if (authError) throw new Error(authError.message || 'Invalid credentials.');

      // 2. Kunin ang profile
      const { data: profile, error: profileError } = await supabaseOrg
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) throw new Error(profileError.message);
      if (!profile) throw new Error('Profile not found in database.');

      // 3. I-verify kung Organization
      if (profile.role !== 'Organization') {
        await supabaseOrg.auth.signOut();
        throw new Error('Access denied. This account is not an Organization.');
      }

      // 4. GUMAWA NG OTP AT I-SAVE SA DATABASE
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins expiry

      const { error: otpError } = await supabaseOrg
        .from('org_otps')
        .insert([{ email: profile.email, otp_code: generatedOtp, expires_at: expiresAt }]);
      
      if (otpError) throw new Error(`Failed to generate OTP: ${otpError.message}`);

      // 🚨 5. TATAWAGIN ANG BREVO API PARA SA EMAIL
      const emailResponse = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'christianvillanuevac9@gmail.com', // 🚨 PALITAN ITO NG TOTOONG EMAIL MO
          otp: generatedOtp,
        }),
      });

      if (!emailResponse.ok) {
        const errData = await emailResponse.json();
        console.warn('[OrgLogin] Brevo email failed:', errData);
        // Continue pa rin — naka-save naman ang OTP sa DB
      } else {
        console.log('[OrgLogin] ✅ OTP email sent via Brevo');
      }

      // 6. Pumasok sa OTP step
      setAwaitingOtp(true);
      setToast({ msg: `OTP sent to your email. Please check your inbox.`, type: 'success' });

    } catch (err: any) {
      setToast({ msg: err.message || 'Login failed.', type: 'error' });
      await supabaseOrg.auth.signOut();
    } finally {
      setLoading(false);
    }
  }

  // 🚨 STEP 2: VERIFY OTP AT LOGIN
  async function handleVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!otpCode) {
      setToast({ msg: 'Enter the OTP code.', type: 'error' });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      const { data: { session: authSession } } = await supabaseOrg.auth.getSession();
      if (!authSession) throw new Error('Session expired. Please log in again.');

      const { data: profile } = await supabaseOrg
        .from('profiles')
        .select('*')
        .eq('id', authSession.user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found.');

      // 1. I-VERIFY ANG OTP MULA SA DATABASE
      const { data: otpData, error: otpVerifyError } = await supabaseOrg
        .from('org_otps')
        .select('*')
        .eq('email', profile.email)
        .eq('otp_code', otpCode)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpVerifyError || !otpData) {
        throw new Error('Invalid or expired OTP code.');
      }

      // 2. BURAHIN ANG OTP PAGKATAPOS GAMITIN
      await supabaseOrg.from('org_otps').delete().eq('id', otpData.id);

      // 3. I-SETUP ANG SESSION
      const session = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: 'Organization' as const,
        organization: 'SJC Supply Office',
        idNumber: profile.student_id || 'ORG-001',
        course: '',
        yearLevel: '',
        dateOfBirth: '',
      };

      // 🚨 I-SAVE SA APP STORE
      signIn(session);

      // 🚨 I-SAVE DIN SA ORG SESSION (Para hindi mag-error sa Orders Page)
      saveOrgSession({
        userId: profile.id,
        email: profile.email,
        role: 'Organization',
        name: profile.name,
        organization: 'SJC Supply Office',
      });
      console.log('[OrgLogin] ✅ Org session saved.');

      setToast({ msg: `Welcome back, ${session.name}. Access granted.`, type: 'success' });
      setTimeout(() => navigate('/org/dashboard', { replace: true }), 800);

    } catch (err: any) {
      setToast({ msg: err.message || 'OTP verification failed.', type: 'error' });
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
    <div className="ol-page">
      <div className="ol-bg" aria-hidden="true" />

      <main className="ol-shell">
        <section className="ol-panel ol-guidelines" aria-labelledby="ol-guidelines-title">
          <header className="ol-guidelines__head">
            <p className="ol-eyebrow">Start here</p>
            <h1 className="ol-title" id="ol-guidelines-title">System Guidelines</h1>
            <p className="ol-lead">Keep your organization account secure and ready for inventory and order management.</p>
          </header>
          <div className="ol-acc-list">
            {guidelines.map((item, i) => {
              const Icon = item.icon;
              const isOpen = openAcc === i;
              return (
                <div key={item.title} className={`ol-acc${isOpen ? ' is-open' : ''}`}>
                  <button className="ol-acc__trigger" type="button" id={`ol-acc-trigger-${i}`} aria-expanded={isOpen} aria-controls={`ol-acc-panel-${i}`} onClick={() => setOpenAcc(isOpen ? -1 : i)}>
                    <span className="ol-acc__icon"><Icon size={20} strokeWidth={2} aria-hidden="true" /></span>
                    <span className="ol-acc__title">{item.title}</span>
                    <ChevronDown size={20} className="ol-acc__chevron" aria-hidden="true" />
                  </button>
                  <div className="ol-acc__body" id={`ol-acc-panel-${i}`} role="region" aria-labelledby={`ol-acc-trigger-${i}`}>
                    <div className="ol-acc__inner"><p>{item.body}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="ol-panel ol-login-panel" aria-labelledby="ol-login-title">
          <div className="ol-login-inner">
            <div className="ol-brand">
              <span className="ol-logo-ring">
                <img className="ol-logo" src="/logo.png" alt="Organization logo" />
              </span>
              <h2 className="ol-brand-title" id="ol-login-title">
                {awaitingOtp ? 'OTP Verification' : 'Organization'}
              </h2>
            </div>
            <p className="ol-lead ol-login-lead">
              {awaitingOtp ? `We've sent a 6-digit code to the system administrator.` : 'Sign in to manage products, inventory, and transactions.'}
            </p>

            {!awaitingOtp ? (
              <form className="ol-form" onSubmit={handleSubmit} noValidate>
                <div className="ol-field">
                  <label htmlFor="email">Email</label>
                  <div className="ol-input">
                    <User size={18} className="ol-input__icon" aria-hidden="true" />
                    <input className="ol-input__field" id="email" type="email" placeholder="e.g. org-admin@sjc.edu.ph" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
                  </div>
                </div>

                <div className="ol-field">
                  <label htmlFor="password">Password</label>
                  <div className="ol-input">
                    <Lock size={18} className="ol-input__icon" aria-hidden="true" />
                    <input className="ol-input__field" id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
                    <button className="ol-toggle" type="button" aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw} onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button className="ol-btn" type="submit" disabled={loading}>
                  {loading ? (<><span className="ol-spinner" aria-hidden="true" /> Verifying…</>) : 'Login'}
                </button>
              </form>
            ) : (
              <form className="ol-form" onSubmit={handleVerifyOtp} noValidate>
                <div className="ol-field">
                  <label htmlFor="otpCode">6-Digit OTP Code</label>
                  <div className="ol-input">
                    <KeyRound size={18} className="ol-input__icon" aria-hidden="true" />
                    <input className="ol-input__field" id="otpCode" type="text" placeholder="Enter 6-digit code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={6} disabled={loading} required />
                  </div>
                </div>

                <button className="ol-btn" type="submit" disabled={loading || otpCode.length < 6}>
                  {loading ? (<><span className="ol-spinner" aria-hidden="true" /> Verifying OTP…</>) : 'Verify OTP & Login'}
                </button>

                <button type="button" className="ol-btn" style={{ marginTop: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => { setAwaitingOtp(false); setOtpCode(''); setToast(null); supabaseOrg.auth.signOut(); }} disabled={loading}>
                  Back to Login
                </button>
              </form>
            )}

            {toast && <div className={`ol-alert ol-alert--${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>{toast.msg}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}