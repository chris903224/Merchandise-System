// src/components/admin/AdminTopbar.tsx

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useToast } from '../../toast';
import AdminBellDropdown from './AdminBellDropdown';
import AdminUserDropdown from './AdminUserDropdown';

export default function AdminTopbar() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const bellWrapRef = useRef<HTMLDivElement>(null);
  const userWrapRef = useRef<HTMLDivElement>(null);

  // Ctrl/Cmd + K focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (bellWrapRef.current && !bellWrapRef.current.contains(target)) {
        setIsBellOpen(false);
      }
      if (userWrapRef.current && !userWrapRef.current.contains(target)) {
        setIsUserOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Escape closes dropdowns
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBellOpen(false);
        setIsUserOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const q = value.trim();
    if (q.length >= 2) {
      // ✅ FIX — 2 args lang
      if (q.length === 3) toast(`Searching for "${q}"…`, 'info');
    }
  };

  return (
    <div className="admin-topbar">
      <div className="admin-topbar__search">
        <Search className="react-icon admin-topbar__search-icon" aria-hidden="true" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search products, orders, organizations..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          aria-label="Global search"
        />
        <kbd className="admin-topbar__kbd">⌘K</kbd>
      </div>

      <div className="admin-topbar__right">
        <div className="admin-topbar__wrap" ref={bellWrapRef}>
          <AdminBellDropdown
            open={isBellOpen}
            onToggle={() => {
              setIsBellOpen((v) => !v);
              setIsUserOpen(false);
            }}
          />
        </div>

        <div className="admin-topbar__wrap" ref={userWrapRef}>
          <AdminUserDropdown
            open={isUserOpen}
            onToggle={() => {
              setIsUserOpen((v) => !v);
              setIsBellOpen(false);
            }}
            onClose={() => setIsUserOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}