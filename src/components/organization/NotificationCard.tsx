// src/components/organization/NotificationCard.tsx
import { Link } from 'react-router-dom';
import { Icon } from '../Icon';

// Ito ay base sa shape ng notification mo sa database
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
  actionLabel?: string;
}

export default function NotificationCard({
  notification,
  onMarkRead,
  onRemove,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const map: Record<string, { icon: string; c: string }> = {
    order: { icon: 'cart', c: 'g2' },
    stock: { icon: 'box', c: 'g4' },
    system: { icon: 'gear', c: 'g1' },
  };
  const meta = map[notification.type] ?? map.system;

  return (
    <article className={`glass nc${notification.read ? '' : ' un'}`}>
      <span className="pm sm" style={{ '--pc': '#4b8bff' } as any}>
        <i className={`ic ${meta.c}`}><Icon name={meta.icon} /></i>
      </span>

      <div className="nb">
        <b>{notification.title}</b>
        {!notification.read && <span className="dot2" />}
        <p>{notification.message}</p>
        <small>{new Date(notification.created_at).toLocaleString()} · {notification.type.toUpperCase()}</small>
      </div>

      <div className="nact">
        {notification.link && (
          <Link className="btn sm gh" to={notification.link}>
            {notification.actionLabel ?? 'View'}
          </Link>
        )}
        {!notification.read && (
          <button className="ibtn" onClick={() => onMarkRead(notification.id)}>
            <Icon name="check" />
          </button>
        )}
        <button className="ibtn" onClick={() => onRemove(notification.id)}>
          <Icon name="x" />
        </button>
      </div>
    </article>
  );
}