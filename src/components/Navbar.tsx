// src/components/Navbar.tsx

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  ShoppingCart,
  Store,
  User,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../store';
import { countCartItems, getConsolePath, isStaffRole } from '../services';
import NotificationBell from './NotificationBell';  // 👈 ADD THIS

// Fixed pixel sizes for the avatar images.
const NAV_AVATAR_SIZE = 36;
const DROPDOWN_AVATAR_SIZE = 48;

// Configurable constants
const ROUTES = {
  HOME: '/',
  CATALOG: '/catalog',
  CART: '/cart',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export default function Navbar() {
  const { session, cart, signOut } = useApp();
  const navigate = useNavigate();
  const cartCount = useMemo(() => countCartItems(cart), [cart]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const toggleDropdown = () => setIsDropdownOpen((open) => !open);

  const handleSignOut = () => {
    signOut();
    navigate(ROUTES.LOGIN);
    closeDropdown();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeDropdown]);

  // Close dropdown on Escape for keyboard users
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDropdown();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeDropdown]);

  // Give a new profile picture a fresh chance to load if it changes
  useEffect(() => {
    setAvatarFailed(false);
  }, [session?.profilePicture]);

  // Get initials from name
  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  const avatarUrl = session?.profilePicture && !avatarFailed ? session.profilePicture : null;
  const initials = session?.name ? getInitials(session.name) : 'U';

  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <div className="site-nav__inner">
        <Link to={ROUTES.HOME} className="brand" aria-label="SJCM Store home">
          <span className="brand__mark">SJ</span>
          <span className="brand__copy">
            <span className="brand__name">SJCM Store</span>
            <span className="brand__tagline">Campus merchandise pickup</span>
          </span>
        </Link>
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

              {/* 👇 NOTIFICATION BELL - ADDED HERE */}
              <NotificationBell />

              {/* Avatar / Profile Circle with Dropdown */}
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

                {/* Dropdown Menu */}
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