// src/pages/organization/NotificationsPage.tsx
// (Palitan lang ang return section, pahawakan ang logic sa taas)

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { session, setOrderStatus, refreshOrders } = useApp(); 
  const navigate = useNavigate(); 
  const userId = session?.id ?? '';

  const [items, setItems] = useState<Notif[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  async function load() {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchUserNotifications(userId);
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

  useEffect(() => { load(); }, [userId]);

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

  const handleValidateOrder = async (notifId: string, link?: string) => {
    const orderId = link?.split('/').pop();
    if (orderId) {
      try {
        await setOrderStatus(orderId, 'Processing');
        await refreshOrders();
      } catch (err) {
        console.error('Failed to validate order', err);
      }
    }
    await markUserNotificationAsRead(notifId);
    navigate('/org/orders');
  };

  const handleCancelOrder = async (notifId: string, link?: string) => {
    const orderId = link?.split('/').pop();
    if (orderId) {
      try {
        await setOrderStatus(orderId, 'Cancelled');
        await refreshOrders();
      } catch (err) {
        console.error('Failed to cancel order', err);
      }
    }
    await markUserNotificationAsRead(notifId);
    navigate('/org/orders');
  };

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
          {filtered.map((n) => {
            const isOrderNotif = n.type === 'order' || n.title.toLowerCase().includes('order');

            return (
              <div key={n.id} className="notif-item-container">
                <NotificationCard
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onRemove={handleRemove}
                />
                
                {/* ✅ DITO NATIN ILALAGAY ANG ORDER ACTIONS (Sa loob ng card layout) */}
                {isOrderNotif && (
                  <div className="notif-order-actions">
                    <button 
                      className="btn sm" 
                      onClick={() => handleValidateOrder(n.id, n.link)}
                    >
                      <Icon name="check" /> Validate Order
                    </button>
                    <button 
                      className="btn sm gh danger" 
                      onClick={() => handleCancelOrder(n.id, n.link)}
                    >
                      <Icon name="x" /> Cancel Order
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}