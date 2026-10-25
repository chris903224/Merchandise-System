// src/components/organization/Topbar.tsx

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../Icon';
import { useNotificationStore } from '../../store/notificationStore';
import { useUIStore } from '../../store/uiStore';
import { useApp } from '../../store';
import { LANGUAGE_CODE } from '../../data/constants';
import type { Session } from '../../types/organization';

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

export default function OrgTopbar({ session }: { session: Session | null }) {
  const [q, setQ] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
  const openLang = useUIStore((s) => s.openLang);
  const openTheme = useUIStore((s) => s.openTheme);
  const lang = (localStorage.getItem('sjc-lang') ?? 'en') as keyof typeof LANGUAGE_CODE;

  const { signOut } = useApp();

  // ✅ Lalabas ang glass background ng header pag nag-scroll (.is-scrolled)
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Ctrl/Cmd + K → focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/org/products?q=${encodeURIComponent(term)}`);
  }

  const handleLogout = () => {
    signOut();
    navigate('/org/login', { replace: true });
  };

  return (
    <header className={`top org-topbar${scrolled ? ' is-scrolled' : ''}`}>
      {/* 1. SEARCH PILL — bilog na search button sa dulo */}
      <form className="search" onSubmit={onSubmit} role="search">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search anything…"
        />
        <button type="submit" className="search-go" aria-label="Search">
          <Icon name="search" />
        </button>
      </form>

      {/* 2. NAV ACTIONS (bilog) */}
      <div className="org-nav-actions">
        <button
          className="org-action-btn"
          onClick={openLang}
          type="button"
          title="Language"
        >
          <Icon name="globe" />
          <span className="org-lang-code">{LANGUAGE_CODE[lang] ?? 'US'}</span>
        </button>

        <Link
          to="/org/notifications"
          className="org-action-btn org-icon-btn"
          title="Notifications"
        >
          <Icon name="bell" />
          {unread > 0 && <span className="org-badge">{unread}</span>}
        </Link>

        {/* Profile Dropdown */}
        <div className={`user-wrap${dropdownOpen ? ' is-open' : ''}`} ref={dropdownRef}>
          <button
            type="button"
            className="org-user-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="org-avatar">{initialsOf(session?.name ?? '')}</span>
            <Icon name="chev" className="org-chevron" />
          </button>

          <div className="org-dropdown">
            <div className="dropdown-header">
              <b>{session?.name ?? 'User'}</b>
              <small>{session?.organization ?? 'Organization'}</small>
            </div>
            <hr />
            <Link to="/org/profile" onClick={() => setDropdownOpen(false)}>
              <Icon name="user" /> Profile
            </Link>
            <Link to="/org/settings" onClick={() => setDropdownOpen(false)}>
              <Icon name="gear" /> Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                openLang();
                setDropdownOpen(false);
              }}
            >
              <Icon name="globe" /> Language
            </button>
            <button
              type="button"
              onClick={() => {
                openTheme();
                setDropdownOpen(false);
              }}
            >
              <Icon name="palette" /> Theme
            </button>
            <hr />
            <button type="button" className="danger" onClick={handleLogout}>
              <Icon name="logout" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}