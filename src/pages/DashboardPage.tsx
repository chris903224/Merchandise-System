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
  ChevronRight,
  Lock,
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
import { fetchOrders } from '../services/orders';
import {
  fetchNotifications,
  markNotificationAsRead,
} from '../services/notifications';
import ProductImage from '../components/ProductImage';
import type { Order, Product } from '../types';
import type { Notification } from '../types/notification';

type StatusFilter =
  | 'ALL'
  | 'Pending'
  | 'Processing'
  | 'Ready for Pickup'
  | 'Claimed'
  | 'Cancelled';

const sideNavItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/catalog', label: 'Shop', icon: Store },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/dashboard', label: 'My Orders', icon: Package, active: true },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Shield },
];

/* ============================================
   ORDER CARD
============================================ */
function OrderCard({
  order,
  products,
}: {
  order: Order;
  products: Product[];
}) {
  const badge = getOrderStatusBadge(getOrderStatus(order));
  const items = order.items ?? [];
  const itemCount = items.reduce(
    (sum, item) => sum + (Number(item.qty) || 0),
    0
  );
  const status = getOrderStatus(order);

  const isOrdered = true;
  const isProcessing = ['Processing', 'Ready for Pickup', 'Claimed'].includes(status);
  const isReady = ['Ready for Pickup', 'Claimed'].includes(status);
  const isClaimed = status === 'Claimed';

  const firstItem = items[0];
  const firstProduct = firstItem
    ? products.find((p) => p.id === firstItem.id)
    : undefined;

  const statusClass =
    status === 'Claimed'
      ? 'is-completed'
      : status === 'Ready for Pickup'
      ? 'is-shipped'
      : status === 'Processing'
      ? 'is-processing'
      : status === 'Cancelled'
      ? 'is-cancelled'
      : 'is-pending';

  return (
    <li className="order-card">
      <div className="order-card__thumb">
        {firstProduct ? (
          <ProductImage
            product={firstProduct}
            className="order-card__thumb-img"
            width={120}
            height={120}
          />
        ) : (
          <Package className="react-icon" aria-hidden="true" />
        )}
      </div>

      <div className="order-card__body">
        <div className="order-card__head">
          <span className="order-card__id">Order #{getOrderId(order)}</span>
          <span className={`order-card__badge ${badge.className} ${statusClass}`}>
            {badge.text}
          </span>
        </div>

        <div className="order-card__meta">
          <span className="order-card__meta-item">
            <Clock3 className="react-icon" aria-hidden="true" />
            {formatDate(getOrderDate(order))}
          </span>
          <span className="order-card__meta-divider">•</span>
          <span className="order-card__meta-item">
            <Package className="react-icon" aria-hidden="true" />
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
        </div>

        <div className="order-card__progress">
          <span className={`order-progress-step ${isOrdered ? 'is-done' : ''}`}>
            <span className="order-progress-step__dot" />
            <span className="order-progress-step__label">Ordered</span>
            {isOrdered && (
              <span className="order-progress-step__date">
                {formatDate(getOrderDate(order))}
              </span>
            )}
          </span>
          <span className={`order-progress-step ${isProcessing ? 'is-done' : ''}`}>
            <span className="order-progress-step__dot" />
            <span className="order-progress-step__label">Processing</span>
          </span>
          <span className={`order-progress-step ${isReady ? 'is-done' : ''}`}>
            <span className="order-progress-step__dot" />
            <span className="order-progress-step__label">Shipped</span>
          </span>
          <span className={`order-progress-step ${isClaimed ? 'is-done' : ''}`}>
            <span className="order-progress-step__dot" />
            <span className="order-progress-step__label">Completed</span>
          </span>
        </div>
      </div>

      <div className="order-card__right">
        <div className="order-card__price">
          {formatPrice(getOrderTotal(order))}
        </div>
        <div className="order-card__payment">
          Payment: {order.paymentMethod || 'Cash on pickup'}
        </div>
        <Link
          to={`/orders/${encodeURIComponent(getOrderId(order))}`}
          className="order-card__btn"
        >
          <span>View Details</span>
          <ChevronRight className="react-icon" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

/* ============================================
   DASHBOARD PAGE
============================================ */
export default function DashboardPage() {
  const { session } = useApp();
  const toast = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  /* ✅ GATE — check kung may unverified order */
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [hasPendingVerification, setHasPendingVerification] = useState(false);

  /* ✅ BANNER — galing sa Supabase notifications */
  const [pickupNotification, setPickupNotification] =
    useState<Notification | null>(null);

  /* ============================================
     ✅ GATE 1: CHECK VERIFICATION BEFORE RENDER
     Kung may unverified order → redirect sa /verify-email
  ============================================ */
  useEffect(() => {
    if (!session) {
      setIsCheckingVerification(false);
      return;
    }

    /* ✅ Get last order ID from sessionStorage */
    const lastOrderId = sessionStorage.getItem('lastOrderId');
    const pendingOrderId = sessionStorage.getItem('pendingOrderId');
    const checkOrderId = lastOrderId || pendingOrderId;

    if (!checkOrderId) {
      /* Walang pending order — OK lang pumasok */
      setIsCheckingVerification(false);
      setHasPendingVerification(false);
      return;
    }

    /* ✅ Check kung naka-verify na */
    const isVerified = sessionStorage.getItem(`order_verified_${checkOrderId}`) === 'true';

    if (!isVerified) {
      /* ❌ Hindi naka-verify — hindi papasukin */
      console.log('[Dashboard] Order not verified, redirecting to verify-email');
      setHasPendingVerification(true);
      setIsCheckingVerification(false);
      return;
    }

    /* ✅ Verified — OK lang pumasok */
    setHasPendingVerification(false);
    setIsCheckingVerification(false);
  }, [session]);

  /* Redirect kapag walang session */
  useEffect(() => {
    if (!session) {
      toast('Please sign in to view your dashboard.', 'warning');
      const timer = window.setTimeout(
        () => navigate('/login', { replace: true }),
        500
      );
      return () => window.clearTimeout(timer);
    }
  }, [session, navigate, toast]);

  /* Fetch orders + products — ONLY if verified */
  useEffect(() => {
    if (!session || hasPendingVerification) {
      setOrders([]);
      setIsLoadingOrders(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setIsLoadingOrders(true);

      const [ordersData, productsData] = await Promise.all([
        fetchOrders(session.id),
        import('../services/products').then((m) => m.fetchProducts()),
      ]);

      if (!cancelled) {
        setOrders(ordersData);
        setProducts(productsData);
        setIsLoadingOrders(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [session, hasPendingVerification]);

  /* ✅ BANNER — fetch latest unread pickup notification */
  useEffect(() => {
    if (!session?.id || hasPendingVerification) {
      setPickupNotification(null);
      return;
    }

    let cancelled = false;

    const loadPickupNotification = async () => {
      try {
        const notifications = await fetchNotifications(session.id);
        const latestPickup = notifications.find(
          (n) => n.type === 'pickup' && !n.read
        );
        if (!cancelled) {
          setPickupNotification(latestPickup ?? null);
        }
      } catch (error) {
        console.error(
          '[Dashboard] Failed to fetch pickup notification:',
          error
        );
        if (!cancelled) setPickupNotification(null);
      }
    };

    loadPickupNotification();

    const handleUpdate = (e: CustomEvent) => {
      const { userId } = e.detail;
      if (!userId || userId === session.id) {
        loadPickupNotification();
      }
    };

    window.addEventListener(
      'notifications-updated',
      handleUpdate as EventListener
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        'notifications-updated',
        handleUpdate as EventListener
      );
    };
  }, [session?.id, hasPendingVerification]);

  const userOrders = useMemo(
    () =>
      session ? orders.filter((order) => order.userId === session.id) : [],
    [orders, session]
  );

  const filteredOrders = useMemo(
    () =>
      userOrders.filter(
        (order) =>
          statusFilter === 'ALL' || getOrderStatus(order) === statusFilter
      ),
    [userOrders, statusFilter]
  );

  const { pendingCount, totalSpent, completedCount, cancelledCount } =
    useMemo(
      () => ({
        pendingCount: userOrders.filter((order) =>
          ['Pending', 'Processing'].includes(getOrderStatus(order))
        ).length,
        totalSpent: userOrders.reduce(
          (sum, order) => sum + getOrderTotal(order),
          0
        ),
        completedCount: userOrders.filter(
          (order) => getOrderStatus(order) === 'Claimed'
        ).length,
        cancelledCount: userOrders.filter(
          (order) => getOrderStatus(order) === 'Cancelled'
        ).length,
      }),
      [userOrders]
    );

  const handleDismissBanner = async () => {
    if (!pickupNotification) return;

    setPickupNotification(null);

    try {
      await markNotificationAsRead(pickupNotification.id);
    } catch (error) {
      console.error('[Dashboard] Failed to dismiss banner:', error);
      setPickupNotification(pickupNotification);
    }
  };

  /* ============================================
     ✅ LOADING STATE — Habang Nag-Check
  ============================================ */
  if (isCheckingVerification) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-main">
          <div className="dashboard-verify-loading">
            <Clock3 className="react-icon animate-spin" aria-hidden="true" />
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">Please sign in to continue</p>
      </div>
    );
  }

  /* ============================================
     ✅ GATE 2: HINDI NAKA-VERIFY — Show Gate Screen
  ============================================ */
  if (hasPendingVerification) {
    const lastOrderId = sessionStorage.getItem('lastOrderId') || sessionStorage.getItem('pendingOrderId');
    const email = session.email || '';

    return (
      <div className="dashboard-shell">
        <div className="dashboard-main">
          <div className="dashboard-gate">
            <div className="dashboard-gate__icon">
              <Lock className="react-icon" aria-hidden="true" />
            </div>

            <h1 className="dashboard-gate__title">
              Verify Your Email First
            </h1>

            <p className="dashboard-gate__description">
              To protect your account and prevent fake orders, you must
              verify your email before accessing your order history.
            </p>

            <div className="dashboard-gate__info">
              <div className="dashboard-gate__info-item">
                <span className="dashboard-gate__info-label">Order ID</span>
                <strong className="dashboard-gate__info-value">
                  {lastOrderId}
                </strong>
              </div>
              <div className="dashboard-gate__info-item">
                <span className="dashboard-gate__info-label">
                  Verification sent to
                </span>
                <strong className="dashboard-gate__info-value">
                  {email.replace(/(.{2}).*@/, '$1***@')}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="dashboard-gate__btn dashboard-gate__btn--primary"
              onClick={() =>
                navigate(
                  `/verify-email?order=${encodeURIComponent(lastOrderId || '')}&email=${encodeURIComponent(email)}`
                )
              }
            >
              <Shield className="react-icon" aria-hidden="true" />
              <span>Verify Email Now</span>
            </button>

            <Link to="/catalog" className="dashboard-gate__btn dashboard-gate__btn--ghost">
              <Store className="react-icon" aria-hidden="true" />
              <span>Back to Catalog</span>
            </Link>

            <p className="dashboard-gate__hint">
              💡 Check your email inbox for the 6-digit verification code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================
     ✅ RENDER — User Is Verified
  ============================================ */
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__top">
          <nav className="dashboard-sidebar__nav">
            {sideNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active || item.to === '/dashboard';
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`dashboard-sidebar__item ${
                    isActive ? 'is-active' : ''
                  }`}
                  data-label={item.label}
                >
                  <Icon className="react-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="dashboard-main">
        <div className="dashboard-scroll">
          {/* BANNER */}
          {pickupNotification ? (
            <div className="notice-banner" role="status">
              <span className="notice-banner__icon">
                <Bell className="react-icon" aria-hidden="true" />
              </span>
              <div className="notice-banner__body">
                <p className="notice-banner__title">
                  {pickupNotification.title}
                </p>
                <p className="notice-banner__description">
                  {pickupNotification.message}
                </p>
              </div>
              {pickupNotification.link && (
                <Link
                  to={pickupNotification.link}
                  className="notice-banner__action"
                  onClick={handleDismissBanner}
                >
                  {pickupNotification.actionLabel || 'View order'}
                  <ArrowUpRight className="react-icon" aria-hidden="true" />
                </Link>
              )}
              <button
                type="button"
                className="notice-banner__dismiss"
                aria-label="Dismiss notification"
                onClick={handleDismissBanner}
              >
                <X className="react-icon" aria-hidden="true" />
              </button>
            </div>
          ) : null}

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
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
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

          <div className="dashboard-body">
            <section className="dashboard-orders">
              {isLoadingOrders ? (
                <div className="dashboard-orders-empty">
                  <Clock3 className="react-icon" aria-hidden="true" />
                  <p className="dashboard-orders-empty__title">
                    Loading orders...
                  </p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="dashboard-orders-empty">
                  <PackageOpen className="react-icon" aria-hidden="true" />
                  <p className="dashboard-orders-empty__title">
                    No reservations found
                  </p>
                  <p className="dashboard-orders-empty__description">
                    Your orders will appear here once you place a campus
                    pickup reservation.
                  </p>
                  <Link to="/catalog" className="button button--primary">
                    Browse catalog
                  </Link>
                </div>
              ) : (
                <ul className="order-list">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={getOrderId(order)}
                      order={order}
                      products={products}
                    />
                  ))}
                </ul>
              )}

              {filteredOrders.length > 0 ? (
                <div className="order-pagination">
                  <span>
                    Showing 1–{filteredOrders.length} of{' '}
                    {filteredOrders.length} orders
                  </span>
                  <div className="order-pagination__controls">
                    <button
                      type="button"
                      className="order-pagination__btn"
                      disabled
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="order-pagination__btn is-active"
                    >
                      1
                    </button>
                    <button
                      type="button"
                      className="order-pagination__btn"
                      disabled
                    >
                      ›
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            <aside className="dashboard-summary">
              <div className="dashboard-summary__card">
                <p className="dashboard-summary__title">Order Summary</p>
                <ul className="dashboard-summary__list">
                  <li className="dashboard-summary__item">
                    <span className="dashboard-summary__icon">
                      <ReceiptText
                        className="react-icon"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="dashboard-summary__label">
                      Total Orders
                    </span>
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
                    <span className="dashboard-summary__label">
                      Processing
                    </span>
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