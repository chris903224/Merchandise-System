// src/pages/OrderDetailsPage.tsx

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  MapPin,
  Printer,
  Package,
  Home,
  Store,
  BookOpen,
  ShoppingCart,
  User,
  Shield,
  ChevronRight,
  Clock,
  Check,
  Mail,
  CreditCard,
  Calendar,
  Building2,
  GraduationCap,
  LifeBuoy,
  Menu,
  X,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import {
  formatDate,
  formatPrice,
  getOrderClaimDate,
  getOrderCustomerName,
  getOrderDate,
  getOrderEmail,
  getOrderId,
  getOrderStatus,
  getOrderStatusBadge,
  getOrderStudentId,
  getOrderTotal,
} from '../services';

const sideNavItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/catalog', label: 'Shop', icon: Store },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/dashboard', label: 'My Orders', icon: Package, active: true },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Shield },
];

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { session, orders } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);

  const sidebarRef = useRef<HTMLElement>(null);
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!session) {
      toast('Please sign in to view order details.', 'warning');
      const timer = window.setTimeout(() => navigate('/login', { replace: true }), 500);
      return () => window.clearTimeout(timer);
    }
  }, [session, navigate, toast]);

  // Hover-to-open sidebar (desktop only)
  useEffect(() => {
    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
    if (!isDesktop()) return;

    const openSidebar = () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsSidebarOpen(true);
    };

    const scheduleClose = () => {
      if (isSidebarPinned) return;
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = window.setTimeout(() => {
        setIsSidebarOpen(false);
      }, 150);
    };

    const zone = hoverZoneRef.current;
    const sidebar = sidebarRef.current;
    if (!zone || !sidebar) return;

    zone.addEventListener('mouseenter', openSidebar);
    sidebar.addEventListener('mouseenter', openSidebar);
    sidebar.addEventListener('mouseleave', scheduleClose);
    zone.addEventListener('mouseleave', scheduleClose);

    return () => {
      zone.removeEventListener('mouseenter', openSidebar);
      sidebar.removeEventListener('mouseenter', openSidebar);
      sidebar.removeEventListener('mouseleave', scheduleClose);
      zone.removeEventListener('mouseleave', scheduleClose);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, [isSidebarPinned, session]);

  if (!session) {
    return null;
  }

  const order = orders.find((candidate) => getOrderId(candidate) === id);

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

  // Not found state
  if (!order || order.userId !== session.id) {
    return (
      <div className={`order-page ${isSidebarOpen ? 'is-sidebar-open' : ''}`}>
        <div
          ref={hoverZoneRef}
          className="order-hover-zone"
          aria-hidden="true"
        />

        <aside
          ref={sidebarRef}
          className={`order-sidebar-nav ${isSidebarOpen ? 'is-open' : ''}`}
        >
          <div className="order-sidebar-nav__top">
            <button
              type="button"
              className="order-sidebar-nav__pin"
              onClick={() => setIsSidebarPinned((p) => !p)}
              aria-label={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              title={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            >
              {isSidebarPinned ? (
                <X className="react-icon" />
              ) : (
                <ChevronRight className="react-icon" />
              )}
            </button>
            <Link to="/" className="order-sidebar-nav__brand" onClick={() => setIsSidebarOpen(false)}>
              <span className="order-sidebar-nav__brand-mark">SJ</span>
              <span className="order-sidebar-nav__brand-copy">
                <span className="order-sidebar-nav__brand-name">SJCM STORE</span>
                <span className="order-sidebar-nav__brand-tag">Official School Merchandise</span>
              </span>
            </Link>
            <nav className="order-sidebar-nav__list">
              {sideNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.active || item.to === '/dashboard';
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`order-sidebar-nav__item ${isActive ? 'is-active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className="react-icon" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="order-sidebar-nav__bottom">
            <p className="order-sidebar-nav__brand-label">SJCM STORE</p>
            <p className="order-sidebar-nav__brand-quote">
              "Wear your<br />Saint Jude Pride"
            </p>
          </div>
        </aside>

        {isSidebarOpen && (
          <div className="order-backdrop" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
        )}

        <div className="order-main-wrap">
          <button
            type="button"
            className="order-mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setIsSidebarOpen((p) => !p)}
          >
            {isSidebarOpen ? <X className="react-icon" /> : <Menu className="react-icon" />}
          </button>

          <main className="order-container">
            <Link to="/dashboard" className="order-back">
              <ArrowLeft className="react-icon" aria-hidden="true" />
              <span>Back to My Orders</span>
            </Link>
            <div className="order-not-found">
              <AlertCircle className="react-icon" aria-hidden="true" />
              <h2 className="order-not-found__title">Order not found</h2>
              <p className="order-not-found__description">
                The specified reservation does not exist or is not part of your account.
              </p>
              <Link to="/dashboard" className="button button--primary">
                Return to My Orders
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const badge = getOrderStatusBadge(getOrderStatus(order));
  const items = order.items ?? [];
  const totalItems = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const status = getOrderStatus(order);

  const steps = [
    { key: 'Pending', label: 'Pending', desc: 'Your order is being reviewed by the seller.' },
    { key: 'Processing', label: 'Processing', desc: "Admin is preparing your items." },
    { key: 'Ready for Pickup', label: 'For Pickup', desc: 'Your order is ready for pickup.' },
    { key: 'Claimed', label: 'Completed', desc: 'Order has been successfully claimed.' },
  ];
  const statusOrder = ['Pending', 'Processing', 'Ready for Pickup', 'Claimed'];
  const currentIndex = Math.max(0, statusOrder.indexOf(status));

  return (
    <div className={`order-page ${isSidebarOpen ? 'is-sidebar-open' : ''}`}>
      <div
        ref={hoverZoneRef}
        className="order-hover-zone"
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        className={`order-sidebar-nav ${isSidebarOpen ? 'is-open' : ''}`}
      >
        <div className="order-sidebar-nav__top">
          <button
            type="button"
            className="order-sidebar-nav__pin"
            onClick={() => setIsSidebarPinned((p) => !p)}
            aria-label={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            title={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            {isSidebarPinned ? (
              <X className="react-icon" />
            ) : (
              <ChevronRight className="react-icon" />
            )}
          </button>
          <Link to="/" className="order-sidebar-nav__brand" onClick={() => setIsSidebarOpen(false)}>
            <span className="order-sidebar-nav__brand-mark">SJ</span>
            <span className="order-sidebar-nav__brand-copy">
              <span className="order-sidebar-nav__brand-name">SJCM STORE</span>
              <span className="order-sidebar-nav__brand-tag">Official School Merchandise</span>
            </span>
          </Link>
          <nav className="order-sidebar-nav__list">
            {sideNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active || item.to === '/dashboard';
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`order-sidebar-nav__item ${isActive ? 'is-active' : ''}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="react-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="order-sidebar-nav__bottom">
          <p className="order-sidebar-nav__brand-label">SJCM STORE</p>
          <p className="order-sidebar-nav__brand-quote">
            "Wear your<br />Saint Jude Pride"
          </p>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="order-backdrop" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
      )}

      <div className="order-main-wrap">
        <button
          type="button"
          className="order-mobile-menu"
          aria-label="Toggle navigation"
          onClick={() => setIsSidebarOpen((p) => !p)}
        >
          {isSidebarOpen ? <X className="react-icon" /> : <Menu className="react-icon" />}
        </button>

        <main className="order-container">
          <Link to="/dashboard" className="order-back">
            <ArrowLeft className="react-icon" aria-hidden="true" />
            <span>Back to My Orders</span>
          </Link>

          <div className="order-body">
            <div className="order-left">
              <section className="order-hero">
                <div className="order-hero__badge-row">
                  <span className={`order-hero__badge ${badge.className}`}>
                    {badge.text}
                  </span>
                </div>
                <h1 className="order-hero__id">{getOrderId(order)}</h1>
                <p className="order-hero__date">
                  Placed on {formatDate(getOrderDate(order))}
                </p>
                <button
                  type="button"
                  className="order-hero__print print-hidden"
                  onClick={() => window.print()}
                >
                  <Printer className="react-icon" aria-hidden="true" />
                  <span>Print Receipt</span>
                </button>
              </section>

              <section className="order-panel">
                <header className="order-panel__header">
                  <span className="order-panel__icon">
                    <Package className="react-icon" aria-hidden="true" />
                  </span>
                  <h2 className="order-panel__title">
                    Order Items ({totalItems})
                  </h2>
                </header>
                <ul className="order-items-list">
                  {items.map((item) => (
                    <li className="order-item-row" key={`${item.id}-${item.size}`}>
                      <div className="order-item-row__media">
                        <Package className="react-icon" aria-hidden="true" />
                      </div>
                      <div className="order-item-row__main">
                        <p className="order-item-row__name">{item.name}</p>
                        <p className="order-item-row__meta">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.organization && <span>· {item.organization}</span>}
                        </p>
                        <p className="order-item-row__qty">
                          Qty <strong>{Number(item.qty) || 0}</strong>
                        </p>
                      </div>
                      <div className="order-item-row__price">
                        {formatPrice((Number(item.price) || 0) * (Number(item.qty) || 0))}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="order-items-footer">
                  <div className="order-items-footer__cell">
                    <span className="order-items-footer__label">
                      <Package className="react-icon" aria-hidden="true" />
                      Total Items
                    </span>
                    <strong className="order-items-footer__value">{totalItems}</strong>
                  </div>
                  <div className="order-items-footer__cell">
                    <span className="order-items-footer__label">
                      <CreditCard className="react-icon" aria-hidden="true" />
                      Order Total
                    </span>
                    <strong className="order-items-footer__value order-items-footer__value--brand">
                      {formatPrice(getOrderTotal(order))}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="order-panel">
                <header className="order-panel__header">
                  <span className="order-panel__icon">
                    <MapPin className="react-icon" aria-hidden="true" />
                  </span>
                  <h2 className="order-panel__title">Pickup Information</h2>
                </header>

                <div className="order-pickup">
                  <div className="order-pickup__left">
                    <div className="order-pickup__row">
                      <span className="order-pickup__row-icon">
                        <Building2 className="react-icon" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="order-pickup__row-title">SJCM Main Campus</p>
                        <p className="order-pickup__row-text">
                          Finance &amp; Property Office
                        </p>
                        <p className="order-pickup__row-text">
                          Monday – Friday · 8:00 AM – 4:00 PM
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="order-pickup__note">
                    <Shield className="react-icon" aria-hidden="true" />
                    <span>
                      Please present this receipt together with your Student ID at the
                      campus merchandise counter.
                    </span>
                  </div>
                </div>
              </section>

              <section className="order-panel">
                <header className="order-panel__header">
                  <span className="order-panel__icon">
                    <User className="react-icon" aria-hidden="true" />
                  </span>
                  <h2 className="order-panel__title">Customer Information</h2>
                </header>

                <div className="order-customer">
                  <div className="order-customer__identity">
                    <span className="order-customer__avatar">
                      {session.profilePicture ? (
                        <img src={session.profilePicture} alt={session.name} />
                      ) : (
                        <span className="order-customer__initials">
                          {getInitials()}
                        </span>
                      )}
                    </span>
                    <div className="order-customer__info">
                      <p className="order-customer__name">
                        {getOrderCustomerName(order)}
                      </p>
                      <p className="order-customer__meta">
                        {session.role} · {session.organization || 'SJCM General'}
                      </p>
                      <p className="order-customer__meta">
                        ID Number: {getOrderStudentId(order) || '—'}
                      </p>
                      <p className="order-customer__meta">
                        Email: {getOrderEmail(order)}
                      </p>
                    </div>
                  </div>

                  <ul className="order-customer__details">
                    <li>
                      <span className="order-customer__details-label">
                        <GraduationCap className="react-icon" aria-hidden="true" />
                        Year Level
                      </span>
                      <span className="order-customer__details-value">—</span>
                    </li>
                    <li>
                      <span className="order-customer__details-label">
                        <BookOpen className="react-icon" aria-hidden="true" />
                        Course / Strand
                      </span>
                      <span className="order-customer__details-value">—</span>
                    </li>
                    <li>
                      <span className="order-customer__details-label">
                        <Calendar className="react-icon" aria-hidden="true" />
                        Date of Birth
                      </span>
                      <span className="order-customer__details-value">—</span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            <aside className="order-right">
              <section className="order-rail-card">
                <h2 className="order-rail-card__title">Order Summary</h2>

                <div className="order-rail-summary">
                  <div className="order-rail-summary__line">
                    <span>Items ({totalItems})</span>
                    <strong>{formatPrice(getOrderTotal(order))}</strong>
                  </div>
                  <div className="order-rail-summary__line">
                    <span>Shipping / Pickup</span>
                    <strong className="order-rail-summary__free">FREE</strong>
                  </div>
                  <div className="order-rail-summary__total">
                    <span>Total</span>
                    <strong>{formatPrice(getOrderTotal(order))}</strong>
                  </div>
                </div>
              </section>

              <section className="order-rail-card">
                <h2 className="order-rail-card__title">
                  <Clock className="react-icon" aria-hidden="true" />
                  Order Status
                </h2>

                <ol className="order-timeline">
                  {steps.map((step, index) => {
                    const isDone = index <= currentIndex;
                    const isActive = index === currentIndex;
                    return (
                      <li
                        key={step.key}
                        className={`order-timeline__step ${
                          isDone ? 'is-done' : ''
                        } ${isActive ? 'is-active' : ''}`}
                      >
                        <span className="order-timeline__marker">
                          {isDone ? (
                            <Check className="react-icon" aria-hidden="true" />
                          ) : null}
                        </span>
                        <div className="order-timeline__content">
                          <p className="order-timeline__label">{step.label}</p>
                          <p className="order-timeline__desc">{step.desc}</p>
                          {isActive && (
                            <p className="order-timeline__time">
                              {formatDate(getOrderDate(order))}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <section className="order-rail-card">
                <h2 className="order-rail-card__title">
                  <LifeBuoy className="react-icon" aria-hidden="true" />
                  Need Help?
                </h2>
                <p className="order-rail-card__text">
                  Have questions about your order? We're here to help.
                </p>
                <a
                  href="mailto:suppliesjc@gmail.com"
                  className="order-rail-card__cta"
                >
                  <Mail className="react-icon" aria-hidden="true" />
                  <span>Contact Support</span>
                  <ChevronRight className="react-icon" aria-hidden="true" />
                </a>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}