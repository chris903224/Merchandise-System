// src/pages/admin/SettingsPage.tsx

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin';

interface SettingGroup {
  id: string;
  title: string;
  desc: string;
  items: { key: string; label: string; default: boolean }[];
}

const GROUPS: SettingGroup[] = [
  {
    id: 'notifications',
    title: 'Notifications',
    desc: 'Choose what alerts you receive.',
    items: [
      { key: 'notif-new-order', label: 'New order alerts', default: true },
      { key: 'notif-low-stock', label: 'Low stock warnings', default: true },
      { key: 'notif-weekly', label: 'Weekly reports', default: false },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    desc: 'Protect your admin account.',
    items: [
      { key: 'sec-2fa', label: 'Two-factor authentication', default: true },
      { key: 'sec-login-alerts', label: 'Login alerts', default: true },
      { key: 'sec-session-timeout', label: 'Session timeout', default: false },
    ],
  },
  {
    id: 'store',
    title: 'Store Preferences',
    desc: 'Manage storefront behavior.',
    items: [
      { key: 'pref-auto-confirm', label: 'Auto-confirm orders', default: true },
      { key: 'pref-show-stock', label: 'Show stock counts', default: true },
      { key: 'pref-maintenance', label: 'Maintenance mode', default: false },
    ],
  },
];

const STORAGE_KEY = 'sjcm_admin_settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      const merged: Record<string, boolean> = {};
      GROUPS.forEach((g) => g.items.forEach((i) => {
        merged[i.key] = i.key in saved ? saved[i.key] : i.default;
      }));
      setSettings(merged);
    } catch { /* ignore */ }
  }, []);

  const toggle = (key: string) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Customize notifications, security, and store preferences."
        actions={
          <button className="admin-btn admin-btn--primary" onClick={handleSave}>
            <Save className="react-icon" /> {saved ? 'Saved!' : 'Save Settings'}
          </button>
        }
      />

      <div className="admin-settings-grid">
        {GROUPS.map((g) => (
          <div key={g.id} className="admin-settings-card">
            <h3 className="admin-settings-card__title">{g.title}</h3>
            <p className="admin-settings-card__desc">{g.desc}</p>
            {g.items.map((item) => (
              <label key={item.key} className="admin-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings[item.key])}
                  onChange={() => toggle(item.key)}
                />
                <span className="admin-toggle__track" />
                <span className="admin-toggle__label">{item.label}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}