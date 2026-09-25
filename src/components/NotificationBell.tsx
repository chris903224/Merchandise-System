// src/components/NotificationBell.tsx

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, X, Circle } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { Notification } from '../types/notification';
import { useApp, useProducts } from '../store';
import ProductImage from './ProductImage';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { session } = useApp();
  const products = useProducts();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  } = useNotificationStore();

  // ============================================
  // LOAD NOTIFICATIONS ON MOUNT
  // ============================================
  useEffect(() => {
    if (session?.id) {
      void loadNotifications(session.id);
    }
  }, [session?.id, loadNotifications]);

  // ============================================
  // REAL-TIME SUBSCRIPTION via store
  // ============================================
  useEffect(() => {
    if (!session?.id) return;

    subscribeToRealtime(session.id);

    return () => {
      unsubscribeFromRealtime();
    };
  }, [session?.id, subscribeToRealtime, unsubscribeFromRealtime]);

  // ============================================
  // CLOSE DROPDOWN — click outside
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // CLOSE DROPDOWN — Escape key
  // ============================================
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleMarkAsRead = (id: string) => {
    void markAsRead(id);
  };

  // ✅ FIX: pass session.id to markAllAsRead
  const handleMarkAllAsRead = () => {
    if (!session?.id) return;
    void markAllAsRead(session.id);
  };

  const handleDelete = (id: string) => {
    void deleteNotification(id);
  };

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
    return `${diffDays}d ago`;
  };

  // ============================================
  // FIND PRODUCT FROM NOTIFICATION METADATA
  // ============================================
  const getNotificationProduct = (notification: Notification) => {
    const productId = notification.metadata?.productId;
    if (!productId) return null;
    return products.find((p) => p.id === productId) ?? null;
  };

  const getTypeEmoji = (type: string) => {
    const icons: Record<string, string> = {
      order: '📦',
      pickup: '📋',
      promo: '🎉',
      system: '⚙️',
      info: 'ℹ️',
    };
    return icons[type] || '📬';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      order: 'var(--color-info)',
      pickup: 'var(--color-success)',
      promo: 'var(--color-brand)',
      system: 'var(--color-text-muted)',
      info: 'var(--color-info)',
    };
    return colors[type] || 'var(--color-text-muted)';
  };

  return (
    <div className={`notification-bell ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell__button"
        onClick={toggleDropdown}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="react-icon" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <span className="notification-bell__title">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-bell__mark-all"
                onClick={handleMarkAllAsRead}
              >
                <Check className="react-icon" aria-hidden="true" />
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notification-bell__empty">
              <Bell className="react-icon" aria-hidden="true" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notification-bell__list">
              {notifications.slice(0, 10).map((notification: Notification) => {
                const product = getNotificationProduct(notification);

                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'notification-item--unread' : ''}`}
                  >
                    <div className="notification-item__media">
                      {product ? (
                        <ProductImage
                          product={product}
                          className="notification-item__image"
                          width={80}
                          height={80}
                        />
                      ) : (
                        <span
                          className="notification-item__emoji"
                          style={{ color: getTypeColor(notification.type) }}
                        >
                          {getTypeEmoji(notification.type)}
                        </span>
                      )}
                    </div>

                    <div className="notification-item__content">
                      <div className="notification-item__header">
                        <span className="notification-item__title">
                          {notification.title}
                        </span>
                        <span className="notification-item__time">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="notification-item__message">{notification.message}</p>
                      <div className="notification-item__actions">
                        {!notification.read && (
                          <button
                            type="button"
                            className="notification-item__mark-read"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as read
                          </button>
                        )}
                        {notification.link && (
                          <Link
                            to={notification.link}
                            className="notification-item__link"
                            onClick={() => {
                              if (!notification.read) markAsRead(notification.id);
                              setIsOpen(false);
                            }}
                          >
                            {notification.actionLabel || 'View'}
                          </Link>
                        )}
                        <button
                          type="button"
                          className="notification-item__delete"
                          onClick={() => handleDelete(notification.id)}
                          aria-label="Delete notification"
                        >
                          <X className="react-icon" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {!notification.read && (
                      <div className="notification-item__unread-dot">
                        <Circle className="react-icon" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="notification-bell__footer">
              <Link to="/notifications" onClick={() => setIsOpen(false)}>
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}