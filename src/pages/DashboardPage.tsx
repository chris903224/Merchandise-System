// src/pages/DashboardPage.tsx

import { useEffect, useMemo, useState } from 'react';
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
  Home,
  User,
  Shield,
  ShoppingCart,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
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

const sideNavItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/catalog', label: 'Shop', icon: Store },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/dashboard', label: 'My Orders', icon: Package, active: true },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Shield },
];

export default function DashboardPage() {
  const { session, orders } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const { pendingCount, totalSpent, completedCount, cancelledCount } = useMemo(
    () => ({
      pendingCount: userOrders.filter((order) =>
        ['Pending', 'Processing'].includes(getOrderStatus(order)),
      ).length,
      totalSpent: userOrders.reduce((sum, order) => sum + getOrderTotal(order), 0),
      completedCount: userOrders.filter(
        (order) => getOrderStatus(order) === 'Claimed',
      ).length,
      cancelledCount: userOrders.filter(
        (order) => getOrderStatus(order) === 'Cancelled',
      ).length,
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

  const getInitials = () => {
    const name = session.name || '';
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || 'U'
    );
  };

  return (
    <div className="dashboard-shell">
      {/* ============================================
          SIDEBAR
          ============================================ */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="dashboard-sidebar__top">
          {/* Profile block */}
          <div className="dashboard-sidebar__user">
            <span className="dashboard-sidebar__avatar">
              {session.profilePicture ? (
                <img src={session.profilePicture} alt={session.name} />
              ) : (
                <span className="dashboard-sidebar__initials">{getInitials()}</span>
              )}
            </span>
            <span className="dashboard-sidebar__user-copy">
              <span className="dashboard-sidebar__user-name">{session.name}</span>
              <span className="dashboard-sidebar__user-role">{session.role}</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="dashboard-sidebar__nav">
            {sideNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active || item.to === '/dashboard';
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`dashboard-sidebar__item ${isActive ? 'is-active' : ''}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="react-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="dashboard-sidebar__bottom">
          <p className="dashboard-sidebar__brand">SJCM STORE</p>
          <p className="dashboard-sidebar__motto">
            "Official Merchandise
            <br />
            for a Stronger SJCM"
          </p>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen ? (
        <div
          className="dashboard-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* ============================================
          MAIN AREA
          ============================================ */}
      <div className="dashboard-main">
        {/* Mobile floating menu */}
        <button
          type="button"
          className="dashboard-mobile-menu"
          aria-label="Toggle navigation"
          onClick={() => setIsSidebarOpen((p) => !p)}
        >
          {isSidebarOpen ? (
            <X className="react-icon" aria-hidden="true" />
          ) : (
            <Menu className="react-icon" aria-hidden="true" />
          )}
        </button>

        <div className="dashboard-scroll">
          {/* Notice Banner */}
          {readyOrder && !noticeDismissed ? (
            <div className="notice-banner" role="status">
              <span className="notice-banner__icon">
                <Bell className="react-icon" aria-hidden="true" />
              </span>
              <div className="notice-banner__body">
                <p className="notice-banner__title">You have 1 order ready for pickup!</p>
                <p className="notice-banner__description">
                  Your order #{getOrderId(readyOrder)} is ready at{' '}
                  {session.organization || 'SJCM Main Campus'}.
                </p>
              </div>
              <Link
                to={`/orders/${encodeURIComponent(getOrderId(readyOrder))}`}
                className="notice-banner__action"
              >
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

          {/* Hero banner */}
          <header className="dashboard-hero">
            <div className="dashboard-hero__copy">
              <p className="dashboard-hero__kicker">My Orders</p>
              <h1 className="dashboard-hero__title">Order History</h1>
              <p className="dashboard-hero__description">
                Track your merchandise reservations and pickup status.
              </p>
            </div>
            <div className="dashboard-hero__quote">
              <span>"Faith • Excellence • Service"</span>
              <span>Saint Jude College</span>
            </div>
          </header>

          {/* Toolbar: search + filter */}
          <div className="dashboard-toolbar">
            <div className="dashboard-toolbar__search">
              <input
                type="search"
                placeholder="Search by order ID, item, or date..."
                aria-label="Search orders"
              />
            </div>
            <select
              className="dashboard-toolbar__select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Ready for Pickup">Ready for pickup</option>
              <option value="Claimed">Claimed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Body: orders + summary */}
          <div className="dashboard-body">
            {/* Orders list */}
            <section className="dashboard-orders">
              {filteredOrders.length === 0 ? (
                <div className="dashboard-orders-empty">
                  <PackageOpen className="react-icon" aria-hidden="true" />
                  <p className="dashboard-orders-empty__title">No reservations found</p>
                  <p className="dashboard-orders-empty__description">
                    Your orders will appear here once you place a campus pickup reservation.
                  </p>
                  <Link to="/catalog" className="button button--primary">
                    Browse catalog
                  </Link>
                </div>
              ) : (
                <ul className="order-list">
                  {filteredOrders.map((order) => {
                    const badge = getOrderStatusBadge(getOrderStatus(order));
                    const items = order.items ?? [];
                    const itemCount = items.reduce(
                      (sum, item) => sum + (Number(item.qty) || 0),
                      0,
                    );

                    // Status flags para sa mini-progress
                    const status = getOrderStatus(order);
                    const isOrdered = true;
                    const isProcessing = ['Processing', 'Ready for Pickup', 'Claimed'].includes(status);
                    const isReady = ['Ready for Pickup', 'Claimed'].includes(status);
                    const isClaimed = status === 'Claimed';

                    return (
                      <li className="order-row" key={getOrderId(order)}>
                        {/* Left: order ID + date + items */}
                        <div className="order-row__main">
                          <div className="order-row__head">
                            <span className="order-row__id">
                              Order #{getOrderId(order)}
                            </span>
                            <span className={badge.className}>{badge.text}</span>
                          </div>

                          <div className="order-row__meta">
                            <span>{formatDate(getOrderDate(order))}</span>
                            <span className="order-row__dot" aria-hidden="true" />
                            <span>
                              {itemCount} item{itemCount === 1 ? '' : 's'}
                            </span>
                          </div>

                          {/* Mini progress steps */}
                          <div className="order-row__progress">
                            <span className={`order-row__step ${isOrdered ? 'is-done' : ''}`}>
                              <span className="order-row__step-dot" />
                              <span className="order-row__step-label">Ordered</span>
                            </span>
                            <span className={`order-row__step ${isProcessing ? 'is-done' : ''}`}>
                              <span className="order-row__step-dot" />
                              <span className="order-row__step-label">Processing</span>
                            </span>
                            <span className={`order-row__step ${isReady ? 'is-done' : ''}`}>
                              <span className="order-row__step-dot" />
                              <span className="order-row__step-label">Ready</span>
                            </span>
                            <span className={`order-row__step ${isClaimed ? 'is-done' : ''}`}>
                              <span className="order-row__step-dot" />
                              <span className="order-row__step-label">Claimed</span>
                            </span>
                          </div>
                        </div>

                        {/* Right: total + payment + action */}
                        <div className="order-row__right">
                          <div className="order-row__price">
                            {formatPrice(getOrderTotal(order))}
                          </div>
                          <div className="order-row__payment">
                            Payment: {order.paymentMethod || 'Cash on pickup'}
                          </div>
                          <Link
                            to={`/orders/${encodeURIComponent(getOrderId(order))}`}
                            className="order-row__btn"
                          >
                            <span>View Details</span>
                            <ChevronRight className="react-icon" aria-hidden="true" />
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Pagination */}
              {filteredOrders.length > 0 ? (
                <div className="order-pagination">
                  <span>
                    Showing 1–{filteredOrders.length} of {filteredOrders.length} orders
                  </span>
                  <div className="order-pagination__controls">
                    <button type="button" className="order-pagination__btn" disabled>
                      ‹
                    </button>
                    <button type="button" className="order-pagination__btn is-active">
                      1
                    </button>
                    <button type="button" className="order-pagination__btn" disabled>
                      ›
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            {/* Right rail: Order Summary */}
            <aside className="dashboard-summary">
              <div className="dashboard-summary__card">
                <p className="dashboard-summary__title">Order Summary</p>

                <ul className="dashboard-summary__list">
                  <li className="dashboard-summary__item">
                    <span className="dashboard-summary__icon">
                      <ReceiptText className="react-icon" aria-hidden="true" />
                    </span>
                    <span className="dashboard-summary__label">Total Orders</span>
                    <strong className="dashboard-summary__value">
                      {userOrders.length}
                    </strong>
                  </li>

                  <li className="dashboard-summary__item">
                    <span className="dashboard-summary__icon dashboard-summary__icon--success">
                      <Package className="react-icon" aria-hidden="true" />
                    </span>
                    <span className="dashboard-summary__label">Completed</span>
                    <strong className="dashboard-summary__value">
                      {completedCount}
                    </strong>
                  </li>

                  <li className="dashboard-summary__item">
                    <span className="dashboard-summary__icon dashboard-summary__icon--warning">
                      <Clock3 className="react-icon" aria-hidden="true" />
                    </span>
                    <span className="dashboard-summary__label">Processing</span>
                    <strong className="dashboard-summary__value">
                      {pendingCount}
                    </strong>
                  </li>

                  <li className="dashboard-summary__item">
                    <span className="dashboard-summary__icon dashboard-summary__icon--danger">
                      <X className="react-icon" aria-hidden="true" />
                    </span>
                    <span className="dashboard-summary__label">Cancelled</span>
                    <strong className="dashboard-summary__value">
                      {cancelledCount}
                    </strong>
                  </li>
                </ul>

                <div className="dashboard-summary__divider" />

                <div className="dashboard-summary__total">
                  <span>Total Spent</span>
                  <strong>{formatPrice(totalSpent)}</strong>
                </div>

                <Link to="/catalog" className="dashboard-summary__cta">
                  <Store className="react-icon" aria-hidden="true" />
                  <span>Browse Store</span>
                  <Zap className="react-icon" aria-hidden="true" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}