// src/components/organization/ActivityFeed.tsx
import { Icon } from '../Icon';
import type { ActivityItem } from '../../types/organization';

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <p style={{ color: 'var(--mu)' }}>No recent activity.</p>;

  return (
    <>
      {items.map((a) => (
        <div className="li" key={a.id}>
          <span className={`ic ${a.color}`}><Icon name={a.icon} /></span>
          <div>
            <b>{a.title}</b>
            <small>{a.subtitle}</small>
          </div>
          <time>{new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
        </div>
      ))}
    </>
  );
}