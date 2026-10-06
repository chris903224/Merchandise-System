// src/components/LanguageSwitcher.tsx

import { useEffect, useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import './LanguageSwitcher.css';

/* ============================================
   ✅ LANGUAGE SWITCHER — 2 variants
   - "header" (default) — dropdown style
   - "inline" — para sa profile dropdown menu
============================================================ */

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'tl', label: 'Tagalog', flag: '🇵🇭' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

/* ✅ TYPE DEFINITION — idinagdag ang variant prop */
interface LanguageSwitcherProps {
  variant?: 'header' | 'inline';
}

export default function LanguageSwitcher({ variant = 'header' }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (match) setCurrentLang(match[1]);
  }, []);

  const handleChangeLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    setIsOpen(false);

    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `googtrans=/en/${langCode}; path=/`;

    if (langCode === 'en') {
      window.location.reload();
      return;
    }

    const selectEl = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (selectEl) {
      selectEl.value = langCode;
      selectEl.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

  const currentLangItem = LANGUAGES.find((l) => l.code === currentLang);

  // ============================================
  // INLINE VARIANT — para sa dropdown menu
  // ✅ Shows all languages as clickable list
  // ============================================
  if (variant === 'inline') {
    return (
      <div className="lang-switcher-inline">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            className={`lang-switcher-inline__item ${
              currentLang === lang.code ? 'is-active' : ''
            }`}
            onClick={() => handleChangeLanguage(lang.code)}
          >
            <span className="lang-switcher-inline__flag">{lang.flag}</span>
            <span className="lang-switcher-inline__label">{lang.label}</span>
          </button>
        ))}
        <div id="google_translate_element" className="lang-switcher__hidden" />
      </div>
    );
  }

  // ============================================
  // HEADER VARIANT — dropdown (default)
  // ============================================
  return (
    <div className="lang-switcher">
      <button
        type="button"
        className="lang-switcher__btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <Globe className="react-icon" aria-hidden="true" />
        <span className="lang-switcher__label">
          {currentLangItem?.label || 'English'}
        </span>
        <ChevronDown
          className={`react-icon lang-switcher__chev ${
            isOpen ? 'is-open' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          <div
            className="lang-switcher__backdrop"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="lang-switcher__menu" role="menu">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="menuitem"
                className={`lang-switcher__item ${
                  currentLang === lang.code ? 'is-active' : ''
                }`}
                onClick={() => handleChangeLanguage(lang.code)}
              >
                <span className="lang-switcher__flag">{lang.flag}</span>
                <span className="lang-switcher__item-label">{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div id="google_translate_element" className="lang-switcher__hidden" />
    </div>
  );
}