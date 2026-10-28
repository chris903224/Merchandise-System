// src/components/organization/Sidebar.tsx

import { NavLink } from 'react-router-dom';
import { Icon } from '../Icon';
import { BRAND } from '../../data/constants';
import type { Session } from '../../types/organization';

const NAV = [
  { to: '/org/dashboard', icon: 'home', label: 'Home' },
  { to: '/org/products', icon: 'box', label: 'Products' },
  { to: '/org/orders', icon: 'cart', label: 'Orders' },
  { to: '/org/onboarding', icon: 'clipboard', label: 'Onboarding' }, // ✅
  { to: '/org/notifications', icon: 'bell', label: 'Notifications' },
  { to: '/org/settings', icon: 'gear', label: 'Settings' },
];

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

export default function OrgSidebar({ session }: { session: Session | null }) {
  const name = session?.name ?? 'User';
  const orgName = session?.organization ?? BRAND.name;
  const roleLabel = session?.role ?? 'Organization';

  return (
    <aside className="floating-sidebar">
      <div className="brand">
        <img className="logo" src={BRAND.logo} alt="" />
        <b className="t">{orgName}</b>
      </div>

      <div className="nav-list">
        {NAV.map((n) => (
          <NavLink 
            key={n.to} 
            to={n.to} 
            className={({ isActive }) => `nav-icon${isActive ? ' active' : ''}`}
            title={n.label}
          >
            <Icon name={n.icon} />
            <span className="t">{n.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="foot">
        <NavLink to="/org/profile" className="me">
          <span className="av">{initialsOf(name)}</span>
          <div className="t">
            <b>{name}</b>
            <small>{roleLabel}</small>
          </div>
        </NavLink>
      </div>
    </aside>
  );
} 