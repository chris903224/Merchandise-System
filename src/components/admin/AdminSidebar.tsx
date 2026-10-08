// src/components/admin/AdminSidebar.tsx

import { useEffect, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Package, FileText, CreditCard, Smartphone, Building2,
  ShieldCheck, User, Settings, ChevronRight,
} from 'lucide-react';
import { useAdminStore, type AdminPage } from '../../store/adminStore';
import logo from '../../../dist/logo.png';

interface NavItem {
  to: string;
  page: AdminPage;
  label: string;
  Icon: typeof Home;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin',           page: 'home',     label: 'Home',                  Icon: Home },
  { to: '/admin/products',  page: 'products', label: 'Products',              Icon: Package },
  { to: '/admin/orders',    page: 'orders',   label: 'Orders',                Icon: FileText, badge: '8' },
  { to: '/admin/payments',  page: 'payments', label: 'Payments',              Icon: CreditCard },
  { to: '/admin/paymongo',  page: 'paymongo', label: 'PayMongo',              Icon: Smartphone },
  { to: '/admin/orgs',      page: 'orgs',     label: 'Organizations',         Icon: Building2 },
  { to: '/admin/console',   page: 'console',  label: 'Console',               Icon: ShieldCheck },
  { to: '/admin/profile',   page: 'profile',  label: 'Profile',               Icon: User },
  { to: '/admin/settings',  page: 'settings', label: 'Settings',              Icon: Settings },
];

const CLOSE_DELAY_MS = 250;

export default function AdminSidebar() {
  const {
    isSidebarPinned,
    isSidebarOpen,
    openSidebar,
    closeSidebar,
    togglePin,
  } = useAdminStore();

  const closeTimerRef = useRef<number | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (isSidebarPinned) return;
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      closeSidebar();
    }, CLOSE_DELAY_MS);
  }, [isSidebarPinned, closeSidebar, cancelClose]);

  // Welcome flash on mount
  useEffect(() => {
    openSidebar();
    const t = window.setTimeout(() => {
      if (!isSidebarPinned) closeSidebar();
    }, 900);
    return () => {
      window.clearTimeout(t);
      cancelClose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside
      className={`admin-sidebar ${isSidebarOpen ? 'is-open' : ''}`}
      onMouseEnter={() => { cancelClose(); openSidebar(); }}
      onMouseLeave={scheduleClose}
    >
      {/* ✅ Pin button */}
      <button
        type="button"
        className="admin-sidebar__pin"
        onClick={togglePin}
        aria-label={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
        title={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
      >
        <ChevronRight className="admin-sidebar__pin-icon" aria-hidden="true" />
      </button>

      {/* ✅ Brand — SJ logo icon only when collapsed */}
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__logo">
  <img src={logo} alt="SJCM Store logo" />
</div>
        <div className="admin-sidebar__brand-text">
          <span className="admin-sidebar__brand-name">SJCM Store</span>
          <span className="admin-sidebar__brand-tag">Admin Console</span>
        </div>
      </div>

      {/* ✅ Nav — icons always visible, labels slide in on expand */}
      <nav className="admin-sidebar__nav">
        {NAV_ITEMS.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              `admin-sidebar__item ${isActive ? 'is-active' : ''}`
            }
            aria-label={label}
            title={label}
          >
            <span className="admin-sidebar__icon">
              <Icon aria-hidden="true" />
            </span>
            <span className="admin-sidebar__label">{label}</span>
            {badge ? (
              <span className="admin-sidebar__badge">{badge}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {/* ✅ Footer */}
      <div className="admin-sidebar__footer">
        <p className="admin-sidebar__footer-title">SJCM Store</p>
        <p className="admin-sidebar__footer-sub">
          Official Merchandise<br />Management System
        </p>
      </div>
    </aside>
  );
}