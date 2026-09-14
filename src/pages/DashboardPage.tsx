// src/pages/DashboardPage.tsx

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  Clock3,
  Package,
  PackageOpen,
  ReceiptText,
  Store,
  X,
  Zap,
  Mail,
  Building,
  CreditCard,

} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import ProfilePicture from '../components/ProfilePicture';
import {
  formatDate,
  formatPrice,
  getOrderDate,
  getOrderId,
  getOrderStatus,
  getOrderStatusBadge,
  getOrderTotal,
} from '../services';

type StatusFilter = 'ALL' | 'Pending' | 'Processing' | 'Ready for Pickup' | 'Claimed' | 'Cancelled';

export default function DashboardPage() {
  const { session, orders } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  useEffect(() => {
    if (!session) {
      toast('Please sign in to view your dashboard.', 'warning');
      const timer = window.setTimeout(() => navigate('/login', { replace: true }), 500);
      return () => window.clearTimeout(timer);
    }
  }, [session, navigate, toast]);

  const userOrders = useMemo(
    () => (session ? orders.filter((order) => order.userId === session.id) : []),
    [orders, session],
  );

  const filteredOrders = useMemo(
    () =>
      userOrders.filter(
        (order) => statusFilter === 'ALL' || getOrderStatus(order) === statusFilter,
      ),
    [userOrders, statusFilter],
  );

  const { pendingCount, totalSpent } = useMemo(
    () => ({
      pendingCount: userOrders.filter((order) =>
        ['Pending', 'Processing'].includes(getOrderStatus(order)),
      ).length,
      totalSpent: userOrders.reduce((sum, order) => sum + getOrderTotal(order), 0),
    }),
    [userOrders],
  );

  const readyOrder = useMemo(
    () => userOrders.find((order) => getOrderStatus(order) === 'Ready for Pickup'),
    [userOrders],
  );

  if (!session) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">Please sign in to continue</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Notice Banner */}
      {readyOrder && !noticeDismissed ? (
        <div className="notice-banner" role="status">
          <span className="notice-banner__icon">
            <Bell className="react-icon" aria-hidden="true" />
          </span>
          <div className="notice-banner__body">
            <p className="notice-banner__title">You have 1 order ready for pickup!</p>
            <p className="notice-banner__description">
              Your order #{getOrderId(readyOrder)} is ready at {session.organization || 'SJCM Main Campus'}.
            </p>
          </div>
          <Link to={`/orders/${encodeURIComponent(getOrderId(readyOrder))}`} className="notice-banner__action">
            View order <ArrowUpRight className="react-icon" aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="notice-banner__dismiss"
            aria-label="Dismiss notification"
            onClick={() => setNoticeDismissed(true)}
          >
            <X className="react-icon" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {/* Profile Card */}
      <div className="dashboard-profile-card">
        <div className="dashboard-profile-row">
          {/* Avatar */}
          <div className="dashboard-avatar-wrapper">
            <ProfilePicture
              name={session.name}
              imageUrl={session.profilePicture || null}
              size="xl"
              bordered={true}
            />
          </div>

          {/* User Info */}
          <div className="dashboard-user-info">
            <h1 className="dashboard-user-name">{session.name}</h1>
            <span className="dashboard-user-role">{session.role}</span>
            <div className="dashboard-user-details">
              <span><Mail className="react-icon" aria-hidden="true" /> {session.email}</span>
              <span><Building className="react-icon" aria-hidden="true" /> {session.organization || 'SJCM General'}</span>
              <span><CreditCard className="react-icon" aria-hidden="true" /> {session.idNumber || session.id}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="dashboard-actions-wrapper">
            <Link to="/catalog" className="button button--primary">
              <Store className="react-icon" aria-hidden="true" />
              <span>Browse store</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card" style={{ '--metric-color': 'var(--color-info)' } as CSSProperties}>
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Total orders</span>
            <span className="dashboard-stat-icon"><Package className="react-icon" aria-hidden="true" /></span>
          </div>
          <strong className="dashboard-stat-value">{userOrders.length}</strong>
        </div>

        <div className="dashboard-stat-card" style={{ '--metric-color': 'var(--color-warning)' } as CSSProperties}>
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Pending pickup</span>
            <span className="dashboard-stat-icon"><Clock3 className="react-icon" aria-hidden="true" /></span>
          </div>
          <strong className="dashboard-stat-value">{pendingCount}</strong>
        </div>

        <div className="dashboard-stat-card" style={{ '--metric-color': 'var(--color-success)' } as CSSProperties}>
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Total spent</span>
            <span className="dashboard-stat-icon"><ReceiptText className="react-icon" aria-hidden="true" /></span>
          </div>
          <strong className="dashboard-stat-value">{formatPrice(totalSpent)}</strong>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-quick-actions">
        <div className="dashboard-quick-label">
          <Zap className="react-icon" aria-hidden="true" />
          <div>
            <p className="dashboard-quick-title">Quick actions</p>
            <p className="dashboard-quick-note">Get to what you need, faster.</p>
          </div>
        </div>
        <div className="dashboard-quick-buttons">
          <Link to="/catalog" className="button button--secondary">
            <Store className="react-icon" aria-hidden="true" />
            <span>Browse Store</span>
          </Link>
          <Link to="/orders" className="button button--secondary">
            <Package className="react-icon" aria-hidden="true" />
            <span>My Orders</span>
          </Link>
        </div>
      </div>

      {/* Order History */}
      <div className="dashboard-orders-panel">
        <div className="dashboard-orders-header">
          <div>
            <p className="dashboard-section-kicker">Your activity</p>
            <h2 className="dashboard-section-title">Order history</h2>
            <p className="dashboard-section-description">Track merchandise reservations and pickup status.</p>
          </div>
          <div className="dashboard-filter">
            <label htmlFor="order-status-filter">Filter status</label>
            <select
              id="order-status-filter"
              className="dashboard-filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="ALL">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Ready for Pickup">Ready for pickup</option>
              <option value="Claimed">Claimed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th className="dashboard-table-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="dashboard-empty-state">
                      <PackageOpen className="react-icon" aria-hidden="true" />
                      <p className="dashboard-empty-title">No reservations found</p>
                      <p className="dashboard-empty-description">
                        Your orders will appear here once you place a campus pickup reservation.
                      </p>
                      <Link to="/catalog" className="button button--primary">Browse catalog</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getOrderStatusBadge(getOrderStatus(order));
                  const itemCount = (order.items ?? []).reduce(
                    (sum, item) => sum + (Number(item.qty) || 0),
                    0,
                  );
                  return (
                    <tr key={getOrderId(order)}>
                      <td><span className="dashboard-order-id">{getOrderId(order)}</span></td>
                      <td>{formatDate(getOrderDate(order))}</td>
                      <td>{itemCount} item{itemCount === 1 ? '' : 's'}</td>
                      <td className="dashboard-order-total">{formatPrice(getOrderTotal(order))}</td>
                      <td><span className={badge.className}>{badge.text}</span></td>
                      <td className="dashboard-table-action">
                        <Link to={`/orders/${encodeURIComponent(getOrderId(order))}`} className="dashboard-action-link">
                          Details <ArrowUpRight className="react-icon" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}