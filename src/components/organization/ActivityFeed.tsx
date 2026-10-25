// src/components/organization/ActivityFeed.tsx
import { Icon } from '../Icon';
import type { ActivityItem } from '../../types/organization';

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <p style={{ color: 'var(--mu)' }}>No recent activity.</p>;

  return (
    <>
      {items.map((a) => (
        <div className="li" key={a.id}>
          {/* 👈 PINALITAN: Kung may image, ipakita. Kung wala, icon. */}
          <span className={`ic ${a.color}`} style={{ overflow: 'hidden' }}>
            {(a as any).image ? (
              <img 
                src={(a as any).image} 
                alt={a.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} 
              />
            ) : (
              <Icon name={a.icon} />
            )}
          </span>
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