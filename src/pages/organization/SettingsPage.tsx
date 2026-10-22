// src/pages/organization/SettingsPage.tsx

import { useEffect, useState } from 'react';
import { useApp } from '../../store';
import { useUIStore } from '../../store/uiStore';
import { Icon } from '../../components/Icon';
import { supabase } from '../../lib/supabaseClient';
import type { OrgPreferences } from '../../types/organization';
import '../../styles/organization/settings.css';

const LANGS: { value: OrgPreferences['language']; label: string }[] = [
  { value: 'en',  label: 'English (US)' },
  { value: 'fil', label: 'Filipino (PH)' },
  { value: 'es',  label: 'Español (ES)' },
  { value: 'zh',  label: '中文 (CN)' },
  { value: 'ja',  label: '日本語 (JP)' },
  { value: 'ko',  label: '한국어 (KR)' },
  { value: 'fr',  label: 'Français (FR)' },
];

const TZS = [
  { value: 'Asia/Manila',    label: 'Philippines (PHT, UTC+8)' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
  { value: 'Asia/Tokyo',     label: 'Japan (UTC+9)' },
  { value: 'UTC',            label: 'UTC' },
];

const DATES: { value: OrgPreferences['dateFormat']; label: string }[] = [
  { value: 'MDY', label: 'Oct 15, 2026' },
  { value: 'DMY', label: '15 Oct 2026' },
  { value: 'ISO', label: '2026-10-15' },
];

const HOURS: { value: OrgPreferences['hourFormat']; label: string }[] = [
  { value: '12', label: '12-hour' },
  { value: '24', label: '24-hour' },
];

// ✅ UI Styles list
const UI_STYLES = [
  {
    value: 'glass',
    label: 'Glassmorphism',
    desc: 'Frosted & see-through',
    icon: 'layers',
  },
  {
    value: 'clay',
    label: 'Claymorphism',
    desc: 'Soft & puffy',
    icon: 'square',
  },
  {
    value: 'neu',
    label: 'Neumorphism',
    desc: 'Soft & embossed',
    icon: 'circle',
  },
  {
    value: 'skeu',
    label: 'Skeuomorphism',
    desc: 'Glossy 3D',
    icon: 'box',
  },
] as const;

const PREF_KEY = 'sjc-org-prefs';

function loadLocalPrefs(): OrgPreferences {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw) as OrgPreferences;
  } catch { /* ignore parsing error */ }
  
  return {
    language: 'en',
    timezone: 'Asia/Manila',
    dateFormat: 'MDY',
    hourFormat: '12',
    notif: { orders: true, payments: true, weekly: false },
    theme: localStorage.getItem('sjc-theme') ?? 'midnight',
    uiStyle: (localStorage.getItem('sjc-ui') as OrgPreferences['uiStyle']) ?? 'glass',
  };
}

function saveLocalPrefs(p: OrgPreferences) {
  localStorage.setItem(PREF_KEY, JSON.stringify(p));
  localStorage.setItem('sjc-theme', p.theme);
  localStorage.setItem('sjc-ui', p.uiStyle);
  document.documentElement.dataset.theme = p.theme;
  document.documentElement.dataset.ui = p.uiStyle;
}

function formatPreview(date: Date, prefs: OrgPreferences): string {
  const datePart = new Intl.DateTimeFormat(
    prefs.language === 'en' ? 'en-US' : prefs.language,
    {
      timeZone: prefs.timezone,
      ...(prefs.dateFormat === 'ISO'
        ? { year: 'numeric', month: '2-digit', day: '2-digit' }
        : prefs.dateFormat === 'DMY'
        ? { day: 'numeric', month: 'short', year: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' }),
    }
  ).format(date);

  const timePart = new Intl.DateTimeFormat('en-US', {
    timeZone: prefs.timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: prefs.hourFormat === '12',
  }).format(date);

  return `${datePart}, ${timePart}`;
}

export default function SettingsPage() {
  const { session, signIn } = useApp();
  const { openTheme, openLang } = useUIStore();

  const [name, setName] = useState('');
  const [prefs, setPrefs] = useState<OrgPreferences>(() => loadLocalPrefs());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session) setName(session.name);
  }, [session]);

  function patchPrefs(patch: Partial<OrgPreferences>) {
    setPrefs((p) => ({ ...p, ...patch }));
  }

  // ✅ LIVE APPLY UI STYLE SA <html> TAG
  function handleUiChange(value: OrgPreferences['uiStyle']) {
    // 1. I-update ang state
    patchPrefs({ uiStyle: value });

    // 2. ✅ I-apply agad sa <html> tag (ito ang nag-trigger ng CSS)
    document.documentElement.dataset.ui = value;
    
    // 3. ✅ I-save sa localStorage
    localStorage.setItem('sjc-ui', value);
    
    // 4. ✅ I-save din sa PREF_KEY para persistent
    const currentPrefs = { ...prefs, uiStyle: value };
    localStorage.setItem(PREF_KEY, JSON.stringify(currentPrefs));
  }

  async function handleSave() {
    if (!session) return;
    if (!name.trim()) return;

    setSaving(true);
    try {
      saveLocalPrefs(prefs);

      if (name.trim() !== session.name) {
        await supabase
          .from('users')
          .update({ name: name.trim() })
          .eq('id', session.id);

        signIn({ ...session, name: name.trim() });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!session) return null;

  return (
    <section className="page-settings" id="org-settings">
      <div className="ph">
        <div>
          <h2>Settings</h2>
          <p>Update your profile and regional preferences.</p>
        </div>
        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>

      <div className="set">
        {/* 1. PROFILE INFORMATION */}
        <div className="glass card">
          <h3><Icon name="user" /> Profile Information</h3>
          <div className="fill">
            <label className="fld">
              Full name
              <input
                className="in"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="fld">
              ID number
              <input className="in" value={session.idNumber || '—'} disabled />
            </label>
            <label className="fld">
              Email
              <input className="in" value={session.email} disabled />
            </label>
            <label className="fld">
              Organization
              <input className="in" value={session.organization} disabled />
            </label>
          </div>
          <small className="note2">
            Email, organization, and ID number are set by your admin and cannot be changed here.
          </small>
        </div>

        {/* 2. LANGUAGE & REGION */}
        <div className="glass card">
          <h3>
            <Icon name="globe" /> Language &amp; Region
            <button type="button" className="btn sm" style={{ marginLeft: 'auto' }} onClick={openLang}>
              Open language picker
            </button>
          </h3>
          <div className="fill">
            <label className="fld">
              Language
              <select
                className="in"
                value={prefs.language}
                onChange={(e) => patchPrefs({ language: e.target.value as OrgPreferences['language'] })}
              >
                {LANGS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </label>
            <label className="fld">
              Time zone
              <select
                className="in"
                value={prefs.timezone}
                onChange={(e) => patchPrefs({ timezone: e.target.value })}
              >
                {TZS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="fld">
              Date format
              <select
                className="in"
                value={prefs.dateFormat}
                onChange={(e) => patchPrefs({ dateFormat: e.target.value as OrgPreferences['dateFormat'] })}
              >
                {DATES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </label>
            <label className="fld">
              Time format
              <select
                className="in"
                value={prefs.hourFormat}
                onChange={(e) => patchPrefs({ hourFormat: e.target.value as OrgPreferences['hourFormat'] })}
              >
                {HOURS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </label>
            <label className="fld">
              Currency
              <input className="in" value="Philippine Peso (PHP)" disabled />
            </label>
          </div>
          <p className="prev">Preview: {formatPreview(new Date(), prefs)}</p>
        </div>

        {/* 3. NOTIFICATIONS */}
        <div className="glass card">
          <h3><Icon name="bell" /> Notifications</h3>
          <div className="fill">
            <div className="row2">
              <span>
                Order alerts
                <small>Get notified when a new order comes in.</small>
              </span>
              <label className="tg">
                <input
                  type="checkbox"
                  checked={prefs.notif.orders}
                  onChange={(e) =>
                    patchPrefs({ notif: { ...prefs.notif, orders: e.target.checked } })
                  }
                />
                <s />
              </label>
            </div>
            <div className="row2">
              <span>
                Payment received
                <small>Know right away when a payment is paid.</small>
              </span>
              <label className="tg">
                <input
                  type="checkbox"
                  checked={prefs.notif.payments}
                  onChange={(e) =>
                    patchPrefs({ notif: { ...prefs.notif, payments: e.target.checked } })
                  }
                />
                <s />
              </label>
            </div>
            <div className="row2">
              <span>
                Weekly summary
                <small>A short report every Monday.</small>
              </span>
              <label className="tg">
                <input
                  type="checkbox"
                  checked={prefs.notif.weekly}
                  onChange={(e) =>
                    patchPrefs({ notif: { ...prefs.notif, weekly: e.target.checked } })
                  }
                />
                <s />
              </label>
            </div>
          </div>
        </div>

        {/* 4. APPEARANCE */}
        <div className="glass card">
          <h3>
            <Icon name="palette" /> Appearance
            <button type="button" className="btn sm" style={{ marginLeft: 'auto' }} onClick={openTheme}>
              Open theme picker
            </button>
          </h3>
          <div className="fill">
            {/* ✅ UI Style Selector — Clickable Cards */}
            <span className="lbl2">UI Style (Morphism)</span>
            <div className="ui-styles">
              {UI_STYLES.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  className={`ui-style${prefs.uiStyle === u.value ? ' on' : ''}`}
                  onClick={() => handleUiChange(u.value)}
                  aria-pressed={prefs.uiStyle === u.value}
                >
                  <span className={`ui-style__preview s-${u.value}`}>
                    <em>Button</em>
                  </span>
                  <b>{u.label}</b>
                  <small>{u.desc}</small>
                  {prefs.uiStyle === u.value && (
                    <span className="ui-style__check">
                      <Icon name="check" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="row2" style={{ marginTop: 8 }}>
              <span>
                Color theme
                <small>{prefs.theme} · {prefs.uiStyle}</small>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}