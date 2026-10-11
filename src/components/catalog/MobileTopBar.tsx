// src/components/layout/MobileTopBar.tsx
// ✅ Sticky top app-bar with search + notification

import { Link } from 'react-router-dom';
import { Bell, ChevronLeft, Search } from 'lucide-react';

interface MobileTopBarProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  onBack?: () => void;
  onSearchClick?: () => void;
}

export default function MobileTopBar({
 
  showBack = false,
  showSearch = false,
  onBack,
  onSearchClick,
}: MobileTopBarProps) {
  return (
    <header className="mobile-topbar">
      {showBack ? (
        <button
          type="button"
          className="mobile-topbar__icon-btn"
          onClick={onBack}
          aria-label="Go back"
        >
          <ChevronLeft className="react-icon" />
        </button>
      ) : (
        <Link to="/" className="mobile-topbar__brand" aria-label="Home">
          <span className="mobile-topbar__brand-dot" />
          <span className="mobile-topbar__brand-text">SJCM Store</span>
        </Link>
      )}

      {showSearch && (
        <button
          type="button"
          className="mobile-topbar__search"
          onClick={onSearchClick}
          aria-label="Search products"
        >
          <Search className="react-icon" />
          <span>Search products...</span>
        </button>
      )}

      <Link
        to="/notifications"
        className="mobile-topbar__icon-btn"
        aria-label="Notifications"
      >
        <Bell className="react-icon" />
      </Link>
    </header>
  );
}