// src/components/admin/AdminBellDropdown.tsx

import { Bell } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function AdminBellDropdown({ open, onToggle }: Props) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAdminStore();

  const unread = notifications.filter((n) => !n.read).length;

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
                onClick={markAllNotificationsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="admin-dropdown__empty">No notifications yet</div>
          ) : (
            <ul className="admin-notif-list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`admin-notif-item ${n.read ? 'admin-notif-item--read' : ''}`}
                  onClick={() => markNotificationRead(n.id)}
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