// src/pages/admin/ConsolePage.tsx

import { Link } from 'react-router-dom';
import { Package, ShoppingBag, CreditCard, Building2 } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin';
import { getActivity } from '../../services/admin';

export default function ConsolePage() {
  const activity = getActivity();

  return (
    <>
      <AdminPageHeader
        eyebrow="System Control"
        title="Admin Console"
        description="Full control over users, inventory, payments, and configuration."
      />

      <div className="admin-console-grid">
        <Link className="admin-console-card" to="/admin/products">
          <div className="admin-console-card__icon"><Package className="react-icon" /></div>
          <h3 className="admin-console-card__title">Products</h3>
          <p className="admin-console-card__desc">Manage inventory, stock, and pricing.</p>
          <span className="admin-console-card__meta">86 items</span>
        </Link>
        <Link className="admin-console-card" to="/admin/orders">
          <div className="admin-console-card__icon"><ShoppingBag className="react-icon" /></div>
          <h3 className="admin-console-card__title">Orders</h3>
          <p className="admin-console-card__desc">Track, process, and fulfill orders.</p>
          <span className="admin-console-card__meta">248 orders</span>
        </Link>
        <Link className="admin-console-card" to="/admin/payments">
          <div className="admin-console-card__icon"><CreditCard className="react-icon" /></div>
          <h3 className="admin-console-card__title">Payments</h3>
          <p className="admin-console-card__desc">Verify manual & PayMongo payments.</p>
          <span className="admin-console-card__meta">₱ 124.8K</span>
        </Link>
        <Link className="admin-console-card" to="/admin/orgs">
          <div className="admin-console-card__icon"><Building2 className="react-icon" /></div>
          <h3 className="admin-console-card__title">Organizations</h3>
          <p className="admin-console-card__desc">Manage org accounts & inventory.</p>
          <span className="admin-console-card__meta">24 orgs</span>
        </Link>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">System Activity</h2>
          <span className="admin-panel__sub">Last 24 hours</span>
        </div>
        <ul className="admin-activity">
          {activity.map((a, i) => (
            <li key={i}>
              <span className={`admin-activity__dot ${a.type ? `admin-activity__dot--${a.type}` : ''}`} />
              <span>{a.text}</span>
              <span className="admin-activity__time">{a.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}