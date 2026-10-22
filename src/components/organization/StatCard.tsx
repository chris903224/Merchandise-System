// src/components/organization/StatCard.tsx
import { Icon } from '../Icon';

export default function StatCard({
  color,
  icon,
  label,
  value,
  sub,
}: {
  color: 'g1' | 'g2' | 'g3' | 'g4' | 'g5';
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="glass stat">
      <span className={`ic ${color}`}>
        <Icon name={icon} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {sub && <small style={{ marginTop: 4, display: 'block' }}>{sub}</small>}
      </div>
      <Icon name="dots" className="dots" style={{ position: 'absolute', top: 16, right: 16, color: 'var(--mu)', width: 18, height: 18 }} />
    </div>
  );
}