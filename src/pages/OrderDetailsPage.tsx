// src/pages/OrderDetailsPage.tsx

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, MapPin, Printer, Package, Home, Store,
  BookOpen, ShoppingCart, User, Shield, ChevronRight, Clock, Check,
  Mail, CreditCard, Calendar, Building2, GraduationCap, LifeBuoy,
  Menu, X, Pencil,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import ProductImage from '../components/ProductImage';
import {
  formatDate, formatPrice, getOrderCustomerName, getOrderDate,
  getOrderEmail, getOrderId, getOrderStatus, getOrderStatusBadge,
  getOrderStudentId, getOrderTotal,
} from '../services';
import { fetchOrders } from '../services/orders';
import { fetchProducts } from '../services/products';
import type { Order, Product } from '../types';

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
  const { session } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (!session || !id) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    const loadData = async () => {
      setIsLoading(true);
      const [ordersData, productsData] = await Promise.all([
        fetchOrders(session.id),
        fetchProducts(),
      ]);
      if (!cancelled) {
        const foundOrder = ordersData.find(
          (o) => getOrderId(o) === id && o.userId === session.id
        );
        setOrder(foundOrder ?? null);
        setProducts(productsData);
        setIsLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [session, id]);

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
      closeTimerRef.current = window.setTimeout(() => setIsSidebarOpen(false), 150);
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

  if (!session) return null;

  const getInitials = () => {
    const name = session.name || '';
    return name.split(' ').filter(Boolean).slice(0, 2)
      .map((p) => p[0]?.toUpperCase()).join('') || 'U';
  };

  const Sidebar = () => (
    <>
      <div ref={hoverZoneRef} className="order-hover-zone" aria-hidden="true" />
      <aside ref={sidebarRef} className={`order-sidebar-nav ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="order-sidebar-nav__top">
          <button
            type="button"
            className="order-sidebar-nav__pin"
            onClick={() => setIsSidebarPinned((p) => !p)}
            aria-label={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            {isSidebarPinned ? <X className="react-icon" /> : <ChevronRight className="react-icon" />}
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
                  data-label={item.label}
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
          <p className="order-sidebar-nav__brand-quote">"Wear your<br />Saint Jude Pride"</p>
        </div>
      </aside>
      {isSidebarOpen && (
        <div className="order-backdrop" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
      )}
    </>
  );

  if (isLoading) {
    return (
      <div className={`order-page ${isSidebarOpen ? 'is-sidebar-open' : ''}`}>
        <Sidebar />
        <div className="order-main-wrap">
          <main className="order-container">
            <Link to="/dashboard" className="order-back">
              <ArrowLeft className="react-icon" aria-hidden="true" />
              <span>Back to My Orders</span>
            </Link>
            <div className="order-not-found">
              <Clock className="react-icon" aria-hidden="true" />
              <h2 className="order-not-found__title">Loading order...</h2>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`order-page ${isSidebarOpen ? 'is-sidebar-open' : ''}`}>
        <Sidebar />
        <div className="order-main-wrap">
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
    { key: 'Processing', label: 'Processing', desc: 'Admin is preparing your items.' },
    { key: 'Ready for Pickup', label: 'For Pickup', desc: 'Your order is ready for pickup.' },
    { key: 'Claimed', label: 'Completed', desc: 'Order has been successfully claimed.' },
  ];
  const statusOrder = ['Pending', 'Processing', 'Ready for Pickup', 'Claimed'];
  const currentIndex = Math.max(0, statusOrder.indexOf(status));

  return (
    <div className={`order-page ${isSidebarOpen ? 'is-sidebar-open' : ''}`}>
      <Sidebar />

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

          <div className="od-layout">
            {/* ============================================
                LEFT COLUMN
                ============================================ */}
            <div className="od-main">
              {/* HERO */}
              <section className="od-hero">
                <div className="od-hero__bg" aria-hidden="true" />
                <div className="od-hero__body">
                  <span className={`od-hero__status ${badge.className}`}>
                    <span className="od-hero__status-dot" />
                    {badge.text}
                  </span>
                  <h1 className="od-hero__id">{getOrderId(order)}</h1>
                  <p className="od-hero__date">
                    Placed on {formatDate(getOrderDate(order))} · 8:24 AM
                  </p>
                </div>
                <button
                  type="button"
                  className="od-hero__print"
                  onClick={() => window.print()}
                >
                  <Printer className="react-icon" aria-hidden="true" />
                  <span>Print Receipt</span>
                </button>
              </section>

              {/* ORDER ITEMS */}
              <section className="od-card">
                <header className="od-card__head">
                  <span className="od-card__head-icon">
                    <Package className="react-icon" aria-hidden="true" />
                  </span>
                  <h2 className="od-card__head-title">
                    Order Items ({totalItems})
                  </h2>
                </header>

                <ul className="od-items">
                  {items.map((item) => {
                    const product = products.find((p) => p.id === item.id);
                    return (
                      <li className="od-item" key={`${item.id}-${item.size}`}>
                        <Link
                          to={`/products/${encodeURIComponent(item.id)}`}
                          className="od-item__thumb"
                        >
                          {product ? (
                            <ProductImage
                              product={product}
                              className="od-item__thumb-img"
                              width={120}
                              height={120}
                            />
                          ) : (
                            <Package className="react-icon" aria-hidden="true" />
                          )}
                        </Link>

                        <div className="od-item__info">
                          <p className="od-item__name">{item.name}</p>
                          <p className="od-item__meta">
                            {item.size && <>Size: {item.size}</>}
                            {item.size && item.organization && <> · </>}
                            {item.organization && <>Color: <strong>Maroon</strong></>}
                          </p>
                        </div>

                        <div className="od-item__qty">
                          <span className="od-item__qty-label">Qty</span>
                          <span className="od-item__qty-value">{Number(item.qty) || 0}</span>
                        </div>

                        <div className="od-item__price">
                          {formatPrice((Number(item.price) || 0) * (Number(item.qty) || 0))}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="od-items-footer">
                  <div className="od-items-footer__left">
                    <span className="od-items-footer__label">
                      <Package className="react-icon" aria-hidden="true" />
                      Total Items
                    </span>
                    <strong className="od-items-footer__value">{totalItems}</strong>
                  </div>
                  <div className="od-items-footer__right">
                    <span className="od-items-footer__label">Order Total</span>
                    <strong className="od-items-footer__value od-items-footer__value--brand">
                      {formatPrice(getOrderTotal(order))}
                    </strong>
                  </div>
                </div>
              </section>

              {/* PICKUP INFO */}
              <section className="od-card">
                <header className="od-card__head">
                  <span className="od-card__head-icon">
                    <MapPin className="react-icon" aria-hidden="true" />
                  </span>
                  <h2 className="od-card__head-title">Pickup Information</h2>
                </header>

                <div className="od-pickup">
                  <div className="od-pickup__location">
                    <span className="od-pickup__location-icon">
                      <Building2 className="react-icon" aria-hidden="true" />
                    </span>
                    <div className="od-pickup__location-info">
                      <p className="od-pickup__location-title">SJCM Main Campus</p>
                      <p className="od-pickup__location-text">Finance &amp; Property Office</p>
                      <p className="od-pickup__location-text">Monday – Friday · 8:00 AM – 4:00 PM</p>
                    </div>
                  </div>
                  <div className="od-pickup__note">
                    <Shield className="react-icon" aria-hidden="true" />
                    <span>
                      Please present this receipt together with your Student ID at the
                      campus merchandise counter.
                    </span>
                  </div>
                </div>
              </section>

              {/* CUSTOMER INFO */}
              <section className="od-card">
                <header className="od-card__head">
                  <span className="od-card__head-icon">
                    <User className="react-icon" aria-hidden="true" />
                  </span>
                  <h2 className="od-card__head-title">Customer Information</h2>
                  <button type="button" className="od-card__edit">
                    <Pencil className="react-icon" aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                </header>

                <div className="od-customer">
                  <div className="od-customer__identity">
                    <span className="od-customer__avatar">
                      {session.profilePicture ? (
                        <img src={session.profilePicture} alt={session.name} />
                      ) : (
                        <span className="od-customer__initials">{getInitials()}</span>
                      )}
                    </span>
                    <div className="od-customer__info">
                      <p className="od-customer__name">{getOrderCustomerName(order)}</p>
                      <p className="od-customer__meta">
                        {session.role} · BS Information Technology
                      </p>
                      <p className="od-customer__meta">
                        ID Number: {getOrderStudentId(order) || '—'}
                      </p>
                      <p className="od-customer__meta">
                        Email: {getOrderEmail(order)}
                      </p>
                    </div>
                  </div>

                  <ul className="od-customer__details">
                    <li>
                      <span className="od-customer__details-label">
                        <GraduationCap className="react-icon" aria-hidden="true" />
                        Year Level
                      </span>
                      <span className="od-customer__details-value">2nd Year</span>
                    </li>
                    <li>
                      <span className="od-customer__details-label">
                        <BookOpen className="react-icon" aria-hidden="true" />
                        Course / Strand
                      </span>
                      <span className="od-customer__details-value">BS Information Technology</span>
                    </li>
                    <li>
                      <span className="od-customer__details-label">
                        <Calendar className="react-icon" aria-hidden="true" />
                        Date of Birth
                      </span>
                      <span className="od-customer__details-value">—</span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            {/* ============================================
                RIGHT RAIL
                ============================================ */}
            <aside className="od-rail">
              {/* SUMMARY */}
              <section className="od-rail-card">
                <h2 className="od-rail-card__title">
                  <CreditCard className="react-icon" aria-hidden="true" />
                  Order Summary
                </h2>
                <div className="od-summary">
                  <div className="od-summary__line">
                    <span>Items ({totalItems})</span>
                    <strong>{formatPrice(getOrderTotal(order))}</strong>
                  </div>
                  <div className="od-summary__line">
                    <span>Shipping / Pickup</span>
                    <strong className="od-summary__free">FREE</strong>
                  </div>
                  <div className="od-summary__total">
                    <span>Total</span>
                    <strong>{formatPrice(getOrderTotal(order))}</strong>
                  </div>
                </div>
              </section>

              {/* STATUS */}
              <section className="od-rail-card">
                <h2 className="od-rail-card__title">
                  <Clock className="react-icon" aria-hidden="true" />
                  Order Status
                </h2>
                <ol className="od-timeline">
                  {steps.map((step, index) => {
                    const isDone = index <= currentIndex;
                    const isActive = index === currentIndex;
                    return (
                      <li
                        key={step.key}
                        className={`od-timeline__step ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}`}
                      >
                        <span className="od-timeline__marker">
                          {isDone ? <Check className="react-icon" aria-hidden="true" /> : null}
                        </span>
                        <div className="od-timeline__content">
                          <p className="od-timeline__label">{step.label}</p>
                          <p className="od-timeline__desc">{step.desc}</p>
                          {isActive && (
                            <p className="od-timeline__time">
                              {formatDate(getOrderDate(order))} · 8:24 AM
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>

              {/* HELP */}
              <section className="od-rail-card">
                <h2 className="od-rail-card__title">
                  <LifeBuoy className="react-icon" aria-hidden="true" />
                  Need Help?
                </h2>
                <p className="od-rail-card__text">
                  Have questions about your order? We're here to help.
                </p>
                <a href="mailto:suppliesjc@gmail.com" className="od-rail-card__cta">
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