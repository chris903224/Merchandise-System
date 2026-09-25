// src/pages/NotificationsPage.tsx

import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Check, X, Trash2, Inbox, Package, ShoppingBag, Tag,
  Settings, Info, Home, Store, ShoppingCart, User, Shield, ChevronRight, Menu,
} from 'lucide-react';
import { useApp, useProducts } from '../store';
import { useToast } from '../toast';
import { useNotificationStore } from '../store/notificationStore';
import ProductImage from '../components/ProductImage';
import type { Notification } from '../types/notification';
import './NotificationsPage.css';

type FilterTab = 'all' | 'unread' | 'read';

// ✅ side nav items (same sa Settings)
const sideNavItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/catalog', label: 'Shop', icon: Store },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/dashboard', label: 'My Orders', icon: Package },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Shield },
];

export default function NotificationsPage() {
  const { session } = useApp();
  const products = useProducts();
  const navigate = useNavigate();
  const toast = useToast();

  // ✅ sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);

  const sidebarRef = useRef<HTMLElement>(null);
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    subscribeToRealtime,
    unsubscribeFromRealtime,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [isClearing, setIsClearing] = useState(false);

  // ============================================
  // LOAD + SUBSCRIBE
  // ============================================
  useEffect(() => {
    if (!session?.id) {
      navigate('/login');
      return;
    }

    void loadNotifications(session.id);
    subscribeToRealtime(session.id);

    return () => {
      unsubscribeFromRealtime();
    };
  }, [session?.id, loadNotifications, subscribeToRealtime, unsubscribeFromRealtime, navigate]);

  // ✅ hover-to-open sidebar (same sa Settings)
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

  // ============================================
  // FILTERED NOTIFICATIONS
  // ============================================
  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'read') return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filter]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  // ✅ FIX: pass session.id to markAllAsRead
  const handleMarkAllAsRead = async () => {
    if (!session?.id) return;
    await markAllAsRead(session.id);
    toast('All notifications marked as read', 'success');
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleClearAll = async () => {
    if (!session?.id) return;
    if (notifications.length === 0) {
      toast('Walang notifications na i-clear.', 'info');
      return;
    }

    if (!window.confirm('Clear all notifications? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      await clearAll(session.id);
      toast('All notifications cleared', 'success');
    } catch (error) {
      console.error('Failed to clear all:', error);
      toast('Failed to clear notifications.', 'danger');
    } finally {
      setIsClearing(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationProduct = (notification: Notification) => {
    const productId = notification.metadata?.productId;
    if (!productId) return null;
    return products.find((p) => p.id === productId) ?? null;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, typeof Bell> = {
      order: Package,
      pickup: ShoppingBag,
      promo: Tag,
      system: Settings,
      info: Info,
    };
    return icons[type] || Bell;
  };

  if (!session) return null;

  return (
    <div className={`notifications-shell ${isSidebarOpen ? 'is-sidebar-open' : ''}`}>
      {/* ✅ HOVER ZONE */}
      <div
        ref={hoverZoneRef}
        className="notifications-hover-zone"
        aria-hidden="true"
      />

      {/* ✅ SIDEBAR — same sa Settings */}
      <aside
        ref={sidebarRef}
        className={`notifications-sidebar ${isSidebarOpen ? 'is-open' : ''}`}
      >
        <div className="notifications-sidebar__top">
          <button
            type="button"
            className="notifications-sidebar__pin"
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

          <Link
            to="/"
            className="notifications-sidebar__brand"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="notifications-sidebar__brand-mark">SJ</span>
            <span className="notifications-sidebar__brand-copy">
              <span className="notifications-sidebar__brand-name">SJCM STORE</span>
              <span className="notifications-sidebar__brand-tag">Official School Merchandise</span>
            </span>
          </Link>

          <nav className="notifications-sidebar__nav">
            {sideNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.to === '/notifications';
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`notifications-sidebar__item ${isActive ? 'is-active' : ''}`}
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

        <div className="notifications-sidebar__bottom">
          <p className="notifications-sidebar__motto">"Faith • Excellence • Service"</p>
          <p className="notifications-sidebar__campus">Saint Jude College</p>
        </div>
      </aside>

      {/* ✅ BACKDROP — mobile */}
      {isSidebarOpen ? (
        <div
          className="notifications-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* ✅ MAIN AREA */}
      <div className="notifications-main">
        <button
          type="button"
          className="notifications-mobile-menu"
          aria-label="Toggle navigation"
          onClick={() => setIsSidebarOpen((p) => !p)}
        >
          {isSidebarOpen ? (
            <X className="react-icon" aria-hidden="true" />
          ) : (
            <Menu className="react-icon" aria-hidden="true" />
          )}
        </button>

        <div className="notifications-scroll">
          <Link to="/dashboard" className="notifications-back">
            <ArrowLeft className="react-icon" aria-hidden="true" />
            <span>Back to Dashboard</span>
          </Link>

          {/* HERO */}
          <header className="notifications-hero">
            <div className="notifications-hero__copy">
              <p className="notifications-hero__kicker">Activity Center</p>
              <h1 className="notifications-hero__title">Notifications</h1>
              <p className="notifications-hero__description">
                Track your orders, favorites, and important updates.
              </p>
            </div>

            {unreadCount > 0 && (
              <div className="notifications-hero__count">
                <Bell className="react-icon" aria-hidden="true" />
                <span>{unreadCount}</span>
              </div>
            )}
          </header>

          {/* TOOLBAR */}
          <div className="notifications-toolbar">
            <div className="notifications-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'all'}
                className={`notifications-tab ${filter === 'all' ? 'is-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
                <span className="notifications-tab__count">{notifications.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'unread'}
                className={`notifications-tab ${filter === 'unread' ? 'is-active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread
                <span className="notifications-tab__count">{unreadCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'read'}
                className={`notifications-tab ${filter === 'read' ? 'is-active' : ''}`}
                onClick={() => setFilter('read')}
              >
                Read
                <span className="notifications-tab__count">
                  {notifications.length - unreadCount}
                </span>
              </button>
            </div>

            <div className="notifications-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notifications-btn notifications-btn--ghost"
                  onClick={handleMarkAllAsRead}
                >
                  <Check className="react-icon" aria-hidden="true" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                className="notifications-btn notifications-btn--danger"
                onClick={handleClearAll}
                disabled={notifications.length === 0 || isClearing}
              >
                <Trash2 className="react-icon" aria-hidden="true" />
                <span>{isClearing ? 'Clearing...' : 'Clear all'}</span>
              </button>
            </div>
          </div>

          {/* CONTENT */}
          {isLoading ? (
            <div className="notifications-empty">
              <Bell className="react-icon" aria-hidden="true" />
              <h2>Loading notifications...</h2>
            </div>
          ) : filtered.length === 0 ? (
            <div className="notifications-empty">
              <Inbox className="react-icon" aria-hidden="true" />
              <h2>
                {filter === 'unread'
                  ? 'No unread notifications'
                  : filter === 'read'
                  ? 'No read notifications'
                  : 'No notifications yet'}
              </h2>
              <p>
                {filter === 'all'
                  ? "You'll see updates about your orders, favorites, and more here."
                  : 'Try switching filters to see more.'}
              </p>
              {filter === 'all' && (
                <Link to="/catalog" className="notifications-empty__cta">
                  <ShoppingBag className="react-icon" aria-hidden="true" />
                  <span>Browse Catalog</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="notifications-list">
              {filtered.map((notification) => {
                const product = getNotificationProduct(notification);
                const TypeIcon = getTypeIcon(notification.type);

                return (
                  <article
                    key={notification.id}
                    className={`notification-card ${
                      !notification.read ? 'notification-card--unread' : ''
                    }`}
                  >
                    <div className="notification-card__media">
                      {product ? (
                        <ProductImage
                          product={product}
                          className="notification-card__image"
                          width={80}
                          height={80}
                        />
                      ) : (
                        <div className="notification-card__emoji">
                          <TypeIcon className="react-icon" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="notification-card__body">
                      <div className="notification-card__head">
                        <h3 className="notification-card__title">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="notification-card__unread-dot" />
                        )}
                      </div>
                      <p className="notification-card__message">{notification.message}</p>
                      <div className="notification-card__meta">
                        <span className="notification-card__time">
                          {formatTime(notification.createdAt)}
                        </span>
                        <span className="notification-card__type">
                          {notification.type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="notification-card__actions">
                      {notification.link && (
                        <Link
                          to={notification.link}
                          className="notification-card__link"
                          onClick={() => {
                            if (!notification.read) markAsRead(notification.id);
                          }}
                        >
                          {notification.actionLabel || 'View'}
                        </Link>
                      )}
                      {!notification.read && (
                        <button
                          type="button"
                          className="notification-card__action"
                          onClick={() => handleMarkAsRead(notification.id)}
                          aria-label="Mark as read"
                        >
                          <Check className="react-icon" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="notification-card__action notification-card__action--delete"
                        onClick={() => handleDelete(notification.id)}
                        aria-label="Delete notification"
                      >
                        <X className="react-icon" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}