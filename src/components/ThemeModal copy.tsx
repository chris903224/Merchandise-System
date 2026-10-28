// src/components/ThemeModal.tsx

import { useEffect, useState } from 'react';
import { Palette, Check, X } from 'lucide-react';
import {
  applyTheme,
  getStoredTheme,
  themeOptions,
  type ThemeId,
  type ThemeDefinition,
} from '../theme';
import './ThemeModal.css';

/* ============================================
   ✅ THEME MODAL — Animated Center Popup
   ✅ Blurred backdrop + smooth animations
   ✅ 10 themes grid with live preview
============================================================ */

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeChange?: (themeId: ThemeId) => void;
}

export default function ThemeModal({
  isOpen,
  onClose,
  onThemeChange,
}: ThemeModalProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(getStoredTheme());
  const [hoveredTheme, setHoveredTheme] = useState<ThemeId | null>(null);

  /* ✅ Group themes by mode */
  const lightThemes = themeOptions.filter((t) => t.mode === 'light');
  const darkThemes = themeOptions.filter((t) => t.mode === 'dark');

  /* ✅ Handle Escape key + body scroll lock */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  /* ✅ Apply theme on click */
  const handleThemeSelect = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    onThemeChange?.(themeId);
  };

  if (!isOpen) return null;

  return (
    <div
      className="theme-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Theme picker"
    >
      <div className="theme-modal">
        {/* Header */}
        <div className="theme-modal__header">
          <div className="theme-modal__title-wrap">
            <span className="theme-modal__icon">
              <Palette className="react-icon" aria-hidden="true" />
            </span>
            <div>
              <h2 className="theme-modal__title">Choose Your Theme</h2>
              <p className="theme-modal__subtitle">
                Pick from 10 hand-crafted themes — applies instantly
              </p>
            </div>
          </div>

          <button
            type="button"
            className="theme-modal__close"
            onClick={onClose}
            aria-label="Close theme picker"
          >
            <X className="react-icon" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="theme-modal__body">
          {/* Light Themes */}
          <div className="theme-modal__section">
            <div className="theme-modal__section-header">
              <span className="theme-modal__section-badge">☀️ Light</span>
              <span className="theme-modal__section-count">
                {lightThemes.length} themes
              </span>
            </div>
            <div className="theme-modal__grid">
              {lightThemes.map((option) => (
                <ThemeCard
                  key={option.id}
                  option={option}
                  isActive={currentTheme === option.id}
                  isHovered={hoveredTheme === option.id}
                  onHover={() => setHoveredTheme(option.id)}
                  onLeave={() => setHoveredTheme(null)}
                  onSelect={() => handleThemeSelect(option.id)}
                />
              ))}
            </div>
          </div>

          {/* Dark Themes */}
          <div className="theme-modal__section">
            <div className="theme-modal__section-header">
              <span className="theme-modal__section-badge">🌙 Dark</span>
              <span className="theme-modal__section-count">
                {darkThemes.length} themes
              </span>
            </div>
            <div className="theme-modal__grid">
              {darkThemes.map((option) => (
                <ThemeCard
                  key={option.id}
                  option={option}
                  isActive={currentTheme === option.id}
                  isHovered={hoveredTheme === option.id}
                  onHover={() => setHoveredTheme(option.id)}
                  onLeave={() => setHoveredTheme(null)}
                  onSelect={() => handleThemeSelect(option.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="theme-modal__footer">
          <p className="theme-modal__footer-text">
            💡 Your choice is saved automatically
          </p>
          <button
            type="button"
            className="theme-modal__done"
            onClick={onClose}
          >
            <Check className="react-icon" aria-hidden="true" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   ✅ THEME CARD — Individual theme preview
============================================================ */
function ThemeCard({
  option,
  isActive,
  isHovered,
  onHover,
  onLeave,
  onSelect,
}: {
  option: ThemeDefinition;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`theme-modal-card ${isActive ? 'is-active' : ''} ${
        isHovered ? 'is-hovered' : ''
      }`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      aria-pressed={isActive}
      data-theme-id={option.id}
    >
      <span
        className="theme-modal-card__preview"
        style={{ background: option.gradient }}
      >
        <span className="theme-modal-card__emoji">{option.emoji}</span>
      </span>

      <span className="theme-modal-card__label">{option.label}</span>

      {isActive && (
        <span className="theme-modal-card__check">
          <Check className="react-icon" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}