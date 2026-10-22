// src/components/organization/Topbar.tsx

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../Icon';
import { useNotificationStore } from '../../store/notificationStore';
import { useUIStore } from '../../store/uiStore';
import { useApp } from '../../store'; // ✅ Para sa signOut
import { LANGUAGE_CODE } from '../../data/constants';
import type { Session } from '../../types/organization';

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

export default function OrgTopbar({ session }: { session: Session | null }) {
  const [q, setQ] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
  const openLang = useUIStore((s) => s.openLang);
  const openTheme = useUIStore((s) => s.openTheme);
  const lang = (localStorage.getItem('sjc-lang') ?? 'en') as keyof typeof LANGUAGE_CODE;
  
  const { signOut } = useApp();

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus(); }
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
    <header className="top">
      <form className="search" onSubmit={onSubmit}>
        <Icon name="search" />
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search anything…" />
        <kbd>Ctrl K</kbd>
      </form>

      <button className="bell langbtn" onClick={openLang} type="button">
        <Icon name="globe" />
        <span className="cc">{LANGUAGE_CODE[lang] ?? 'US'}</span>
      </button>

      <Link to="/org/notifications" className="bell">
        <Icon name="bell" />
        {unread > 0 && <em>{unread}</em>}
      </Link>

      {/* ✅ USER DROPDOWN */}
      <div className={`user-wrap${dropdownOpen ? ' is-open' : ''}`} ref={dropdownRef}>
        <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <span className="av">{initialsOf(session?.name ?? '')}</span>
          <div>
            <b>{session?.name ?? 'User'}</b>
            <small>{session?.organization ?? 'Organization'}</small>
          </div>
          <Icon name="chev" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </button>

        <div className="user-dropdown">
          <Link to="/org/profile" onClick={() => setDropdownOpen(false)}>
            <Icon name="user" /> Profile
          </Link>
          
          <Link to="/org/settings" onClick={() => setDropdownOpen(false)}>
            <Icon name="gear" /> Settings
          </Link>

          <button type="button" onClick={() => { openLang(); setDropdownOpen(false); }}>
            <Icon name="globe" /> Language
          </button>

          <button type="button" onClick={() => { openTheme(); setDropdownOpen(false); }}>
            <Icon name="palette" /> Theme
          </button>

          <hr />

          <button type="button" className="danger" onClick={handleLogout}>
            <Icon name="logout" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}