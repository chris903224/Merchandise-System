// src/components/layout/MobileBottomNav.tsx

import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Grid2x2,
  ShoppingCart,
  Package,
  UserRound,
} from 'lucide-react';
import { useApp } from '../../store';

export default function MobileBottomNav() {
  const { cart, session } = useApp();
  const location = useLocation();

  const cartCount = cart.reduce(
    (sum, item) => sum + (Number(item.qty) || 0),
    0
  );

  const tabs = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/catalog', label: 'Catalog', icon: Grid2x2 },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
    {
      to: '/dashboard',
      label: 'Orders',
      icon: Package,
    },
    {
      to: session ? '/profile' : '/login',
      label: 'Me',
      icon: UserRound,
    },
  ];

  const hiddenPaths = ['/login', '/register', '/forgot-password'];
  if (hiddenPaths.includes(location.pathname)) return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary navigation">
      {tabs.map(({ to, label, icon: Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `mobile-bottom-nav__item ${isActive ? 'is-active' : ''}`
          }
        >
          <span className="mobile-bottom-nav__icon-wrap">
            <Icon className="react-icon" aria-hidden="true" />
            {badge !== undefined && badge > 0 && (
              <span className="mobile-bottom-nav__badge">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </span>
          <span className="mobile-bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}