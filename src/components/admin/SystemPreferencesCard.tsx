import { useState } from 'react';
import {
  applyAdminPalette,
  applyAdminTheme,
  getAdminPalette,
  getAdminTheme,
  type AdminPalette,
  type AdminTheme,
} from '../../lib/adminTheme';

const STYLES: { id: AdminTheme; name: string; desc: string }[] = [
  { id: 'default', name: 'Default',       desc: 'Clean, flat and minimal.' },
  { id: 'clay',    name: 'Claymorphism',  desc: 'Soft, puffy, 3D-style surfaces.' },
  { id: 'glass',   name: 'Glassmorphism', desc: 'Frosted, translucent layers.' },
];

const PALETTES: { id: AdminPalette; name: string; desc: string }[] = [
  { id: 'forest',   name: 'Forest',   desc: 'The original SJCM green.' },
  { id: 'midnight', name: 'Midnight', desc: 'Soft dark, easy at night.' },
  { id: 'sand',     name: 'Sand',     desc: 'Warm paper tones.' },
  { id: 'ocean',    name: 'Ocean',    desc: 'Calm, cool mist blues.' },
];

export default function SystemPreferencesCard() {
  const [style, setStyle] = useState<AdminTheme>(getAdminTheme());
  const [palette, setPalette] = useState<AdminPalette>(getAdminPalette());

  const chooseStyle = (id: AdminTheme) => {
    if (id === style) return;
    setStyle(id);
    applyAdminTheme(id);
  };

  const choosePalette = (id: AdminPalette) => {
    if (id === palette) return;
    setPalette(id);
    applyAdminPalette(id);
  };

  return (
    <div className="admin-settings-card admin-settings-card--wide">
      <h3 className="admin-settings-card__title">System Preferences</h3>
      <p className="admin-settings-card__desc">Choose how the admin dashboard looks.</p>

      <p className="admin-settings-subhead">Style</p>
      <div className="admin-theme-picker" role="radiogroup" aria-label="Style">
        {STYLES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={style === t.id}
            className={`admin-theme-option${style === t.id ? ' is-selected' : ''}`}
            onClick={() => chooseStyle(t.id)}
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

      <p className="admin-settings-subhead">Color theme</p>
      <div className="admin-theme-picker" role="radiogroup" aria-label="Color theme">
        {PALETTES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={palette === t.id}
            className={`admin-theme-option${palette === t.id ? ' is-selected' : ''}`}
            onClick={() => choosePalette(t.id)}
          >
            <span className={`admin-theme-option__preview admin-theme-option__preview--pal-${t.id}`}>
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