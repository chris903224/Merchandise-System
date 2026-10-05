// src/components/SidebarLayout.tsx

import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Home,
  LogOut,
  Search,
  Settings,
  ShoppingCart,
  Store,
  User,
  Package,
} from 'lucide-react';
import { useApp } from '../store';
import ProfilePicture from './ProfilePicture';

type SidebarLayoutProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/catalog', label: 'Store', icon: Store },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { session, cart, signOut } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = (cart ?? []).reduce(
    (sum: number, item: { qty?: number }) => sum + (Number(item.qty) || 0),
    0
  );

  function handleLogout() {
    setMenuOpen(false);
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      {/* ============================================
          TOP NAVBAR
      ============================================ */}
      <header className="app-topbar">
        <Link to="/" className="brand">
          <span className="brand__mark">SJ</span>
          <span className="brand__copy">
            <span className="brand__name">SJCM Store</span>
            <span className="brand__tagline">Campus merchandise pickup</span>
          </span>
        </Link>

        <div className="app-topbar__search">
          <Search className="react-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search products, categories, or anything…"
            aria-label="Search"
          />
          <span className="app-topbar__kbd">Ctrl K</span>
        </div>

        <nav className="app-topbar__links" aria-label="Quick links">
          {/* Cart */}
          <Link to="/cart" className="nav-action app-topbar__icon-action">
            <ShoppingCart className="react-icon" aria-hidden="true" />
            <span className="nav-action__label">Cart</span>
            {cartCount > 0 ? (
              <span className="nav-cart-count">{cartCount}</span>
            ) : null}
          </Link>

          {/* My Account Dropdown */}
          <div className="nav-profile">
            <button
              type="button"
              className="nav-avatar"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <ProfilePicture
                name={session?.name ?? '?'}
                imageUrl={session?.profilePicture || null}
                size="sm"
              />
              <span className="nav-action__label">My Account</span>
              <ChevronDown
                className={`react-icon nav-avatar-chevron${
                  menuOpen ? ' nav-avatar-chevron--open' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {menuOpen ? (
              <div className="nav-dropdown" role="menu">
                <div className="nav-dropdown-header">
                  <ProfilePicture
                    name={session?.name ?? '?'}
                    imageUrl={session?.profilePicture || null}
                    size="md"
                  />
                  <div className="nav-dropdown-user">
                    <p className="nav-dropdown-name">{session?.name}</p>
                    <p className="nav-dropdown-email">{session?.email}</p>
                  </div>
                </div>
                <hr className="nav-dropdown-divider" />
                <Link
                  to="/profile"
                  className="nav-dropdown-item"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="react-icon" aria-hidden="true" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="nav-dropdown-item"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="react-icon" aria-hidden="true" />
                  Settings
                </Link>
                <hr className="nav-dropdown-divider" />
                <button
                  type="button"
                  className="nav-dropdown-item nav-dropdown-item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut className="react-icon" aria-hidden="true" />
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </nav>
      </header>

      {/* ============================================
          BODY — expandable nav + content
      ============================================ */}
      <div className="app-body">
        {/* ✅ NEW: Expandable horizontal nav — base sa picture */}
        <nav className="expandable-nav" aria-label="Primary navigation">
          <div className="expandable-nav__inner">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `expandable-nav__link${isActive ? ' is-active' : ''}`
                }
                title={label}
              >
                <span className="expandable-nav__icon-wrap">
                  <Icon className="react-icon" aria-hidden="true" />
                </span>
                <span className="expandable-nav__label">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}