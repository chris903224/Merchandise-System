import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Home,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  Store,
  User,
} from 'lucide-react';
import { useApp } from '../store';
import ProfilePicture from './ProfilePicture';

type SidebarLayoutProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/catalog', label: 'Store', icon: Store },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { session, cart, signOut } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = (cart ?? []).reduce((sum: number, item: { qty?: number }) => sum + (Number(item.qty) || 0), 0);

  function handleLogout() {
    setMenuOpen(false);
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      {/* 👇 TOP NAVBAR - MANANATILI ITO, WALANG BINABAGO */}
      <header className="app-topbar">
        <button
          type="button"
          className="icon-button"
          aria-label="Toggle navigation"
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <Menu className="react-icon" aria-hidden="true" />
        </button>

        <Link to="/" className="brand">
          <span className="brand__mark">SJ</span>
          <span className="brand__copy">
            <span className="brand__name">SJCM Store</span>
            <span className="brand__tagline">Campus merchandise pickup</span>
          </span>
        </Link>

        <div className="app-topbar__search">
          <Search className="react-icon" aria-hidden="true" />
          <input type="search" placeholder="Search products, categories, or anything…" aria-label="Search" />
          <span className="app-topbar__kbd">Ctrl K</span>
        </div>

        <nav className="app-topbar__links" aria-label="Quick links">
          {/* 👇 Catalog */}
          <Link to="/catalog" className="nav-action">
            <Store className="react-icon" aria-hidden="true" />
            <span className="nav-action__label">Catalog</span>
          </Link>

          {/* 👇 Cart */}
          <Link to="/cart" className="nav-action app-topbar__icon-action">
            <ShoppingCart className="react-icon" aria-hidden="true" />
            <span className="nav-action__label">Cart</span>
            {cartCount > 0 ? <span className="nav-cart-count">{cartCount}</span> : null}
          </Link>

          {/* 👇 My Orders */}
          <Link to="/orders" className="nav-action">
            <ShoppingCart className="react-icon" aria-hidden="true" />
            <span className="nav-action__label">My Orders</span>
          </Link>

          {/* 👇 My Account Dropdown */}
          <div className="nav-profile">
            <button
              type="button"
              className="nav-avatar"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <ProfilePicture name={session?.name ?? '?'} imageUrl={session?.profilePicture || null} size="sm" />
              <span className="nav-action__label">My Account</span>
              <ChevronDown className={`react-icon nav-avatar-chevron${menuOpen ? ' nav-avatar-chevron--open' : ''}`} aria-hidden="true" />
            </button>

            {menuOpen ? (
              <div className="nav-dropdown" role="menu">
                <div className="nav-dropdown-header">
                  <ProfilePicture name={session?.name ?? '?'} imageUrl={session?.profilePicture || null} size="md" />
                  <div className="nav-dropdown-user">
                    <p className="nav-dropdown-name">{session?.name}</p>
                    <p className="nav-dropdown-email">{session?.email}</p>
                  </div>
                </div>
                <hr className="nav-dropdown-divider" />
                <Link to="/profile" className="nav-dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <User className="react-icon" aria-hidden="true" />
                  Profile
                </Link>
                <Link to="/settings" className="nav-dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <Settings className="react-icon" aria-hidden="true" />
                  Settings
                </Link>
                <hr className="nav-dropdown-divider" />
                <button type="button" className="nav-dropdown-item nav-dropdown-item--danger" role="menuitem" onClick={handleLogout}>
                  <LogOut className="react-icon" aria-hidden="true" />
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </nav>
      </header>

      {/* 👇 BODY - SIDEBAR + CONTENT */}
      <div className="app-body">
        {sidebarOpen ? (
          <div className="app-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        ) : null}

        <aside className={`app-sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label="Primary">
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `sidebar-nav__item${isActive ? ' is-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="react-icon" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <Link to="/support" className="sidebar-help">
            <span className="sidebar-help__icon">
              <LifeBuoy className="react-icon" aria-hidden="true" />
            </span>
            <span>
              <span className="sidebar-help__title">Need help?</span>
              <span className="sidebar-help__note">Visit our support center</span>
            </span>
            <ChevronDown className="react-icon sidebar-help__chevron" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true" />
          </Link>
        </aside>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}