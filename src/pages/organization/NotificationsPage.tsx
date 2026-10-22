// src/pages/organization/NotificationsPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store';
import NotificationCard from '../../components/organization/NotificationCard';
import { Icon } from '../../components/Icon';
import {
  fetchUserNotifications,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
  deleteUserNotification,
  clearAllUserNotifications,
} from '../../services/userNotifications';
import '../../styles/organization/notifications.css';

// ✅ Required na ang created_at (walang ?)
type Notif = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string; 
  link?: string;
  actionLabel?: string;
};

type Filter = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const { session } = useApp();
  const userId = session?.id ?? '';

  const [items, setItems] = useState<Notif[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  async function load() {
    if (!userId) return;
    setLoading(true);
    try {
      // Isang argumento lang para umayon sa service mo
      const data = await fetchUserNotifications(userId);
      
      // ✅ I-mapa natin para may fallback kung walang created_at
      const mapped = (data ?? []).map((n: any) => ({
        id: n.id,
        type: n.type || 'system',
        title: n.title || 'Notification',
        message: n.message || '',
        read: !!n.read,
        created_at: n.created_at || new Date().toISOString(), 
        link: n.link,
        actionLabel: n.actionLabel,
      }));

      setItems(mapped as Notif[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [userId]);

  const filtered = useMemo(() => {
    if (filter === 'unread') return items.filter((n) => !n.read);
    if (filter === 'read') return items.filter((n) => n.read);
    return items;
  }, [items, filter]);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  async function handleMarkRead(id: string) {
    await markUserNotificationAsRead(id);
    await load();
  }

  async function handleMarkAll() {
    await markAllUserNotificationsAsRead(userId);
    await load();
  }

  async function handleRemove(id: string) {
    await deleteUserNotification(id);
    await load();
  }

  async function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    await clearAllUserNotifications(userId);
    setConfirmClear(false);
    await load();
  }

  if (loading) return <div className="org-loading">Loading notifications…</div>;

  return (
    <section className="page-notifications">
      <div className="ph">
        <div>
          <h2>Notifications</h2>
          <p>Stock alerts, orders, and payment updates.</p>
        </div>
      </div>

      <div className="ph">
        <div className="seg">
          <button className={`btn sm gh${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>
            All <b>{items.length}</b>
          </button>
          <button className={`btn sm gh${filter === 'unread' ? ' on' : ''}`} onClick={() => setFilter('unread')}>
            Unread <b>{unread}</b>
          </button>
          <button className={`btn sm gh${filter === 'read' ? ' on' : ''}`} onClick={() => setFilter('read')}>
            Read <b>{items.length - unread}</b>
          </button>
        </div>

        <div className="seg">
          {unread > 0 && (
            <button className="btn sm gh" onClick={handleMarkAll}>
              <Icon name="check" /> Mark all read
            </button>
          )}
          <button className="btn sm gh" onClick={handleClear} disabled={items.length === 0}>
            <Icon name="trash" />
            {confirmClear ? 'Click again to clear' : 'Clear all'}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass card empty">
          <Icon name="inbox" />
          <h2>
            {filter === 'unread' ? 'No unread notifications'
              : filter === 'read' ? 'No read notifications'
              : 'No notifications yet'}
          </h2>
          <p>
            {filter === 'all'
              ? 'Stock alerts and order updates will show up here.'
              : 'Try switching filters to see more.'}
          </p>
        </div>
      ) : (
        <div className="stack">
          {filtered.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkRead={handleMarkRead}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </section>
  );
}