// src/components/organization/UpcomingList.tsx
import { Link } from 'react-router-dom';
import { Icon } from '../Icon';
import type { ActivityItem } from '../../types/organization';

export default function UpcomingList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <p style={{ color: 'var(--mu)' }}>Nothing upcoming.</p>;

  return (
    <>
      {items.map((a) => (
        <Link key={a.id} to="/org/orders" className="li" data-go>
          <span className={`ic ${a.color}`}><Icon name={a.icon} /></span>
          <div>
            <b>{a.title}</b>
            <small>{a.subtitle}</small>
          </div>
          <Icon name="right" style={{ width: 16, height: 16 }} />
        </Link>
      ))}
    </>
  );
}