// src/components/Navbar.tsx

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Search,
  ShoppingCart,
  Store,
  User,
  Settings,
  ChevronDown,
  X,
  Heart,          // ✅ IDAGDAG
} from 'lucide-react';
import { useApp } from '../store';
import { countCartItems, getConsolePath, isStaffRole } from '../services';
import { fetchProfileImages } from '../data/storage';
import NotificationBell from './NotificationBell';

const NAV_AVATAR_SIZE = 36;
const DROPDOWN_AVATAR_SIZE = 48;

const ROUTES = {
  HOME: '/',
  CATALOG: '/catalog',
  CART: '/cart',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  FAVORITES: '/favorites',    // ✅ IDAGDAG
} as const;

export default function Navbar() {
  const { session, cart, signOut } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = useMemo(() => countCartItems(cart), [cart]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [remoteAvatarUrl, setRemoteAvatarUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const toggleDropdown = () => setIsDropdownOpen((open) => !open);

  const handleSignOut = () => {
    signOut();
    navigate(ROUTES.LOGIN);
    closeDropdown();
  };

  // ============================================
  // SYNC SEARCH QUERY SA URL
  // ============================================
  useEffect(() => {
    if (location.pathname === ROUTES.CATALOG) {
      const urlQuery = new URLSearchParams(location.search).get('q') ?? '';
      setSearchQuery(urlQuery);
    }
  }, [location.pathname, location.search]);

  // ============================================
  // LIVE SEARCH
  // ============================================
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    const trimmed = value.trim();

    if (location.pathname === ROUTES.CATALOG) {
      const params = new URLSearchParams(location.search);
      if (trimmed) {
        params.set('q', trimmed);
      } else {
        params.delete('q');
      }
      navigate(`${ROUTES.CATALOG}?${params.toString()}`, { replace: true });
    } else if (trimmed) {
      navigate(`${ROUTES.CATALOG}?q=${encodeURIComponent(trimmed)}`, {
        replace: false,
      });
    }
  };

  // ============================================
  // ENTER — submit search
  // ============================================
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`${ROUTES.CATALOG}?q=${encodeURIComponent(trimmed)}`);
      searchInputRef.current?.blur();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (location.pathname === ROUTES.CATALOG) {
      const params = new URLSearchParams(location.search);
      params.delete('q');
      navigate(`${ROUTES.CATALOG}?${params.toString()}`, { replace: true });
    }
    searchInputRef.current?.focus();
  };

  // ============================================
  // KEYBOARD SHORTCUT: Ctrl+K
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ============================================
  // CLOSE DROPDOWN — click outside
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeDropdown]);

  // ============================================
  // CLOSE DROPDOWN — Escape
  // ============================================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDropdown();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeDropdown]);

  // ============================================
  // FETCH AVATAR
  // ============================================
  useEffect(() => {
    if (!session) {
      setRemoteAvatarUrl(null);
      return;
    }

    setRemoteAvatarUrl(session.profilePicture || null);

    const loadAvatar = async () => {
      try {
        const { avatar_url } = await fetchProfileImages(session.id);
        if (avatar_url) {
          setRemoteAvatarUrl(avatar_url);
        }
      } catch (error) {
        console.warn('[Navbar] Failed to fetch avatar:', error);
      }
    };

    void loadAvatar();
  }, [session]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [remoteAvatarUrl]);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  const avatarUrl = remoteAvatarUrl && !avatarFailed ? remoteAvatarUrl : null;
  const initials = session?.name ? getInitials(session.name) : 'U';

  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <div className="site-nav__inner">
        {/* BRAND */}
        <Link to={ROUTES.HOME} className="brand" aria-label="SJCM Store home">
          <span className="brand__mark">SJ</span>
          <span className="brand__copy">
            <span className="brand__name">SJCM Store</span>
            <span className="brand__tagline">Campus merchandise pickup</span>
          </span>
        </Link>

        {/* SEARCH BAR */}
        <form
          className="nav-search"
          role="search"
          onSubmit={handleSearchSubmit}
          aria-label="Search products"
        >
          <Search className="nav-search__icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            className="nav-search__input"
            placeholder="Search products, categories, or organization..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search products"
            autoComplete="off"
          />
          {searchQuery ? (
            <button
              type="button"
              className="nav-search__clear"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <X className="react-icon" aria-hidden="true" />
            </button>
          ) : (
            <kbd className="nav-search__kbd" aria-hidden="true">⌘K</kbd>
          )}
        </form>

        {/* NAV ACTIONS */}
        <div className="nav-actions">
          <Link to={ROUTES.CATALOG} className="nav-action" aria-label="Browse catalog">
            <Store className="react-icon" aria-hidden="true" />
            <span className="nav-action__label">Catalog</span>
          </Link>

          <Link to={ROUTES.CART} className="nav-action" aria-label="Open shopping cart">
            <ShoppingCart className="react-icon" aria-hidden="true" />
            <span className="nav-action__label">Cart</span>
            {cartCount > 0 && (
              <span className="nav-cart-count" aria-label={`${cartCount} items in cart`}>
                {cartCount}
              </span>
            )}
          </Link>

          {session ? (
            <>
              <Link
                to={getConsolePath(session.role)}
                className="nav-action"
                aria-label={`Open ${isStaffRole(session.role) ? 'console' : 'My Orders'}`}
              >
                <LayoutDashboard className="react-icon" aria-hidden="true" />
                <span className="nav-action__label">
                  {isStaffRole(session.role) ? 'Console' : 'My Orders'}
                </span>
              </Link>

              <NotificationBell />

              <div className="nav-profile" ref={dropdownRef}>
                <button
                  type="button"
                  className="nav-avatar"
                  onClick={toggleDropdown}
                  aria-label="User menu"
                  aria-haspopup="menu"
                  aria-expanded={isDropdownOpen}
                >
                  <span className="nav-avatar-frame">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={session.name}
                        className="nav-avatar-img"
                        width={NAV_AVATAR_SIZE}
                        height={NAV_AVATAR_SIZE}
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <span className="nav-avatar-initials">{initials}</span>
                    )}
                  </span>
                  <ChevronDown
                    className={`nav-avatar-chevron ${isDropdownOpen ? 'nav-avatar-chevron--open' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {isDropdownOpen && (
                  <div className="nav-dropdown" role="menu">
                    <Link
                      to={ROUTES.PROFILE}
                      className="nav-dropdown-header-link"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      <div className="nav-dropdown-header">
                        <span className="nav-dropdown-avatar-frame">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={session.name}
                              className="nav-dropdown-avatar"
                              width={DROPDOWN_AVATAR_SIZE}
                              height={DROPDOWN_AVATAR_SIZE}
                              onError={() => setAvatarFailed(true)}
                            />
                          ) : (
                            <span className="nav-dropdown-initials">{initials}</span>
                          )}
                        </span>
                        <div className="nav-dropdown-user">
                          <p className="nav-dropdown-name">{session.name}</p>
                          <p className="nav-dropdown-role">{session.role}</p>
                          <p className="nav-dropdown-email">{session.email}</p>
                        </div>
                      </div>
                    </Link>

                    <hr className="nav-dropdown-divider" />

                    <Link
                      to={ROUTES.PROFILE}
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      <User className="react-icon" aria-hidden="true" />
                      <span>My Profile</span>
                    </Link>

                    {/* ✅ IDAGDAG — My Favorites */}
                    <Link
                      to={ROUTES.FAVORITES}
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      <Heart className="react-icon" aria-hidden="true" />
                      <span>My Favorites</span>
                    </Link>

                    <Link
                      to={ROUTES.SETTINGS}
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      <Settings className="react-icon" aria-hidden="true" />
                      <span>Settings</span>
                    </Link>

                    <hr className="nav-dropdown-divider" />

                    <button
                      type="button"
                      className="nav-dropdown-item nav-dropdown-item--danger"
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      <LogOut className="react-icon" aria-hidden="true" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to={ROUTES.LOGIN} className="nav-action nav-action--accent" aria-label="Sign in">
              <LogIn className="react-icon" aria-hidden="true" />
              <span className="nav-action__label">Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}