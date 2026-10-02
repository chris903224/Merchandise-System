// src/components/admin/AdminBellDropdown.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader2 } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToAdminNotifications,
} from '../../services/admin';

interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function AdminBellDropdown({ open, onToggle }: Props) {
  const navigate = useNavigate();
  const {
    notifications,
    setNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAdminStore();

  const [isLoading, setIsLoading] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  /* ============================================
     INITIAL LOAD + REAL-TIME
     ============================================ */
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    // 1. Initial load
    getAdminNotifications()
      .then((data) => {
        if (!cancelled) setNotifications(data);
      })
      .catch((err) => console.error('[AdminBell]', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    // 2. Real-time subscription
    const unsubscribe = subscribeToAdminNotifications((newNotif) => {
      // ✅ Prepend sa existing
      useAdminStore.setState((state) => ({
        notifications: [newNotif, ...state.notifications],
      }));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [setNotifications]);

  /* ============================================
     HANDLERS
     ============================================ */
  const handleClick = async (id: string, link?: string) => {
    // Optimistic
    markNotificationRead(id);

    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error('[AdminBell] Mark read failed:', err);
    }

    // Navigate kung may link
    if (link) {
      navigate(link);
      onToggle();
    }
  };

  const handleMarkAll = async () => {
    markAllNotificationsRead();
    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error('[AdminBell] Mark all failed:', err);
    }
  };

  return (
    <>
      <button
        type="button"
        className="admin-topbar__bell"
        onClick={onToggle}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="react-icon" aria-hidden="true" />
        {unread > 0 && (
          <span className="admin-topbar__bell-count">{unread}</span>
        )}
      </button>

      {open && (
        <div className="admin-dropdown admin-dropdown--notif" role="menu">
          <div className="admin-dropdown__header">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button
                type="button"
                className="admin-dropdown__link"
                onClick={handleMarkAll}
              >
                Mark all as read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="admin-dropdown__empty">
              <Loader2
                className="react-icon animate-spin"
                style={{ width: 20, height: 20, margin: '0 auto 8px' }}
              />
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="admin-dropdown__empty">
              <Bell
                className="react-icon"
                style={{ width: 24, height: 24, margin: '0 auto 8px', opacity: 0.5 }}
              />
              No notifications
            </div>
          ) : (
            <ul className="admin-notif-list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`admin-notif-item ${n.read ? 'admin-notif-item--read' : ''}`}
                  onClick={() => handleClick(n.id, n.link)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="admin-notif-item__dot" />
                  <div className="admin-notif-item__body">
                    <p className="admin-notif-item__title">{n.title}</p>
                    <p className="admin-notif-item__desc">{n.desc}</p>
                    <span className="admin-notif-item__time">{n.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}