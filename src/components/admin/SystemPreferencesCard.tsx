import { useState } from 'react';
import { applyAdminTheme, getAdminTheme, type AdminTheme } from '../../lib/adminTheme';

const THEMES: { id: AdminTheme; name: string; desc: string }[] = [
  { id: 'default', name: 'Default',       desc: 'Clean, flat and minimal.' },
  { id: 'clay',    name: 'Claymorphism',  desc: 'Soft, puffy, 3D-style surfaces.' },
  { id: 'glass',   name: 'Glassmorphism', desc: 'Frosted, translucent layers.' },
];

export default function SystemPreferencesCard() {
  const [theme, setTheme] = useState<AdminTheme>(getAdminTheme());

  const choose = (id: AdminTheme) => {
    if (id === theme) return;
    setTheme(id);
    applyAdminTheme(id);
  };

  return (
    <div className="admin-settings-card admin-settings-card--wide">
      <h3 className="admin-settings-card__title">System Preferences</h3>
      <p className="admin-settings-card__desc">Choose how the admin dashboard looks.</p>

      <div className="admin-theme-picker" role="radiogroup" aria-label="Appearance">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={theme === t.id}
            className={`admin-theme-option${theme === t.id ? ' is-selected' : ''}`}
            onClick={() => choose(t.id)}
          >
            <span className={`admin-theme-option__preview admin-theme-option__preview--${t.id}`}>
              <i /><b />
            </span>
            <span className="admin-theme-option__name">
              {t.name}
              <span className="admin-theme-option__check" aria-hidden="true">✓</span>
            </span>
            <p className="admin-theme-option__desc">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}