// src/pages/NotificationsPage.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Circle, Trash2 } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { Notification } from '../types/notification';


export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotificationStore();

  const filteredNotifications = notifications.filter((n: Notification) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

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

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
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
    <main className="notifications-page">
      <div className="notifications-container">
        <header className="notifications-header">
          <Link to="/dashboard" className="notifications-back">
            <ArrowLeft className="react-icon" aria-hidden="true" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="notifications-header__right">
            <h1 className="notifications-title">Notifications</h1>
            {unreadCount > 0 && (
              <span className="notifications-count">{unreadCount} unread</span>
            )}
          </div>
        </header>

        <div className="notifications-toolbar">
          <div className="notifications-filters">
            <button
              type="button"
              className={`notifications-filter ${filter === 'all' ? 'notifications-filter--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`notifications-filter ${filter === 'unread' ? 'notifications-filter--active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
            <button
              type="button"
              className={`notifications-filter ${filter === 'read' ? 'notifications-filter--active' : ''}`}
              onClick={() => setFilter('read')}
            >
              Read
            </button>
          </div>
          <div className="notifications-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="notifications-action"
                onClick={markAllAsRead}
              >
                <Check className="react-icon" aria-hidden="true" />
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                className="notifications-action notifications-action--danger"
                onClick={clearAll}
              >
                <Trash2 className="react-icon" aria-hidden="true" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty__icon">📬</div>
            <h3 className="notifications-empty__title">No notifications</h3>
            <p className="notifications-empty__description">
              {filter === 'all'
                ? 'You have no notifications yet.'
                : filter === 'unread'
                ? 'You have no unread notifications.'
                : 'You have no read notifications.'}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'notification-item--unread' : ''}`}
              >
                <div className="notification-item__icon" style={{ color: getTypeColor(notification.type) }}>
                  {getTypeIcon(notification.type)}
                </div>
                <div className="notification-item__content">
                  <div className="notification-item__header">
                    <span className="notification-item__title">{notification.title}</span>
                    <span className="notification-item__time">{formatTime(notification.createdAt)}</span>
                  </div>
                  <p className="notification-item__message">{notification.message}</p>
                  <div className="notification-item__meta">
                    <span className="notification-item__date">{formatDate(notification.createdAt)}</span>
                    <span className="notification-item__type">{notification.type}</span>
                  </div>
                  <div className="notification-item__actions">
                    {!notification.read && (
                      <button
                        type="button"
                        className="notification-item__mark-read"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="react-icon" aria-hidden="true" />
                        Mark as read
                      </button>
                    )}
                    {notification.link && (
                      <Link
                        to={notification.link}
                        className="notification-item__link"
                        onClick={() => {
                          if (!notification.read) markAsRead(notification.id);
                        }}
                      >
                        {notification.actionLabel || 'View'}
                      </Link>
                    )}
                    <button
                      type="button"
                      className="notification-item__delete"
                      onClick={() => deleteNotification(notification.id)}
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
            ))}
          </div>
        )}
      </div>
    </main>
  );
}