import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { useUIStore } from '../../store/uiStore';
import { themeOptions, applyTheme, getStoredTheme, type ThemeId } from '../../theme';

const UI_STYLES = [
  { id: 'glass', name: 'Glassmorphism', desc: 'Frosted and see-through' },
  { id: 'neu',   name: 'Neumorphism',   desc: 'Soft UI, embossed' },
  { id: 'clay',  name: 'Claymorphism',  desc: 'Soft, puffy and playful' },
  { id: 'skeu',  name: 'Skeuomorphism', desc: 'Real-world, glossy 3D' },
];

export default function ThemeModal() {
  const close = useUIStore((s) => s.closeTheme);
  
  const [theme, setTheme] = useState<ThemeId>(() => getStoredTheme());
  const [uiStyle, setUiStyle] = useState(() => localStorage.getItem('sjc-ui') ?? 'glass');

  function handleThemeSelect(id: ThemeId) {
    setTheme(id);
    applyTheme(id); 

    const selectedOption = themeOptions.find((t) => t.id === id);
    if (selectedOption) {
      const mode = selectedOption.mode;
      
      localStorage.setItem('sjc-theme', id);
      localStorage.setItem('sjc-mode', mode);
      
      document.documentElement.setAttribute('data-mode', mode);
      
      if (mode === 'light') {
        document.documentElement.style.backgroundColor = '#eef0f4';
        document.documentElement.style.colorScheme = 'light';
      } else {
        document.documentElement.style.backgroundColor = '#050a16';
        document.documentElement.style.colorScheme = 'dark';
      }
    }
  }

  function handleUiSelect(id: string) {
    setUiStyle(id);
    document.documentElement.dataset.ui = id;
    localStorage.setItem('sjc-ui', id);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <div className="ov open" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="dlg">
        <div className="dh">
          <span className="ic g1"><Icon name="palette" /></span>
          <div>
            <h2>Choose Your Theme</h2>
            <small>Pick from 10 hand-crafted themes and 4 styles — applies instantly</small>
          </div>
          <button className="x" onClick={close} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>

        <div className="db">
          <div className="gh">
            <span className="chip">Light</span>
            <small>5 themes</small>
          </div>
          <div className="tgrid">
            {themeOptions.filter((t) => t.mode === 'light').map((t) => (
              <button
                key={t.id}
                className={`tc${theme === t.id ? ' sel' : ''}`}
                onClick={() => handleThemeSelect(t.id)}
              >
                <span className="sw" style={{ background: t.gradient }}>
                  {t.emoji}
                </span>
                <b>{t.label}</b>
                {theme === t.id && <span className="ck"><Icon name="check" /></span>}
              </button>
            ))}
          </div>

          <div className="gh">
            <span className="chip">Dark</span>
            <small>5 themes</small>
          </div>
          <div className="tgrid">
            {themeOptions.filter((t) => t.mode === 'dark').map((t) => (
              <button
                key={t.id}
                className={`tc${theme === t.id ? ' sel' : ''}`}
                onClick={() => handleThemeSelect(t.id)}
              >
                <span className="sw" style={{ background: t.gradient }}>
                  {t.emoji}
                </span>
                <b>{t.label}</b>
                {theme === t.id && <span className="ck"><Icon name="check" /></span>}
              </button>
            ))}
          </div>

          <div className="gh">
            <span className="chip">Style</span>
            <small>4 styles</small>
          </div>
          <div className="tgrid">
            {UI_STYLES.map((u) => (
              <button
                key={u.id}
                className={`tc${uiStyle === u.id ? ' sel' : ''}`}
                onClick={() => handleUiSelect(u.id)}
              >
                <span className={`sw sty s-${u.id}`}><em>Button</em></span>
                <b>{u.name}</b>
                <small>{u.desc}</small>
                {uiStyle === u.id && <span className="ck"><Icon name="check" /></span>}
              </button>
            ))}
          </div>
        </div>

        <div className="df">
          <small>Your choice is saved automatically</small>
          <button className="btn" onClick={close}>Done</button>
        </div>
      </div>
    </div>
  );
}