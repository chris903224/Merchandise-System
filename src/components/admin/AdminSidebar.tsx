// src/components/admin/AdminSidebar.tsx

import { useEffect, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Package, FileText, CreditCard, Smartphone, Building2,
  ShieldCheck, User, Settings, ChevronRight,
} from 'lucide-react';
import { useAdminStore, type AdminPage } from '../../store/adminStore';

interface NavItem {
  to: string;
  page: AdminPage;
  label: string;
  Icon: typeof Home;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin',           page: 'home',     label: 'Home',                     Icon: Home },
  { to: '/admin/products',  page: 'products', label: 'Product Management',       Icon: Package },
  { to: '/admin/orders',    page: 'orders',   label: 'Order Management',         Icon: FileText, badge: '8' },
  { to: '/admin/payments',  page: 'payments', label: 'Payment Management',       Icon: CreditCard },
  { to: '/admin/paymongo',  page: 'paymongo', label: 'PayMongo Management',      Icon: Smartphone },
  { to: '/admin/orgs',      page: 'orgs',     label: 'Organization Accounts',    Icon: Building2 },
  { to: '/admin/console',   page: 'console',  label: 'Admin Console',            Icon: ShieldCheck },
  { to: '/admin/profile',   page: 'profile',  label: 'Profile',                  Icon: User },
  { to: '/admin/settings',  page: 'settings', label: 'Settings',                 Icon: Settings },
];

const CLOSE_DELAY_MS = 200;

export default function AdminSidebar() {
  const {
    isSidebarPinned,
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
      className="admin-sidebar"
      onMouseEnter={() => { cancelClose(); openSidebar(); }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="admin-sidebar__pin"
        onClick={togglePin}
        aria-label={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
        title={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
      >
        <ChevronRight className="admin-sidebar__pin-icon" aria-hidden="true" />
      </button>

      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__logo">SJ</div>
        <div className="admin-sidebar__brand-text">
          <span className="admin-sidebar__brand-name">SJCM Store</span>
          <span className="admin-sidebar__brand-tag">Admin Console</span>
        </div>
      </div>

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
          >
            <span className="admin-sidebar__icon">
              <Icon className="react-icon" aria-hidden="true" />
            </span>
            <span className="admin-sidebar__label">{label}</span>
            {badge ? <span className="admin-sidebar__badge">{badge}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <p className="admin-sidebar__footer-title">SJCM Store</p>
        <p className="admin-sidebar__footer-sub">
          Official Merchandise<br />Management System
        </p>
      </div>
    </aside>
  );
}