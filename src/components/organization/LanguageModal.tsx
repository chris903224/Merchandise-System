// src/components/organization/LanguageModal.tsx

import { useEffect } from 'react';
import { Icon } from '../Icon';
import { useUIStore } from '../../store/uiStore';
import { LANGS } from '../../data/constants';

export default function LanguageModal() {
  const close = useUIStore((s) => s.closeLang);

  function select(code: string) {
    localStorage.setItem('sjc-lang', code);
    document.documentElement.lang = code;
    close();
    // Reload to re-render all labels through the i18n layer
    window.location.reload();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const current = localStorage.getItem('sjc-lang') ?? 'en';

  return (
    <div
      className="ov open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="org-lang-title"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="dlg">
        <div className="dh">
          <span className="ic g1"><Icon name="globe" /></span>
          <div>
            <h2 id="org-lang-title">Choose Your Language</h2>
            <small>Pick from 7 languages — applies instantly</small>
          </div>
          <button className="x" onClick={close} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>

        <div className="db">
          <div className="tgrid">
            {LANGS.map((l) => (
              <button
                key={l.code}
                className={`tc${current === l.code ? ' sel' : ''}`}
                onClick={() => select(l.code)}
              >
                <span className="sw lw">{l.flag}</span>
                <b>{l.label}</b>
                {current === l.code && <span className="ck"><Icon name="check" /></span>}
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