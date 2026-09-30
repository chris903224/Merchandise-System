// src/components/admin/AdminStatCard.tsx

import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  spark?: string;             // SVG polyline points e.g. "0,18 10,14 20,16..."
  sparkColor?: string;
}

export default function AdminStatCard({
  label,
  value,
  delta,
  icon: Icon,
  spark = '0,18 10,14 20,16 30,10 40,12 50,6 60,8',
  sparkColor = '#22915c',
}: Props) {
  return (
    <div className="admin-stat">
      <div className="admin-stat__icon">
        <Icon className="react-icon" aria-hidden="true" />
      </div>

      <div className="admin-stat__body">
        <p className="admin-stat__label">{label}</p>
        <p className="admin-stat__value">{value}</p>
        <div className="admin-stat__meta">
          <span className="admin-stat__delta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            {delta}
          </span>
          <span>vs. last 7 days</span>
        </div>
      </div>

      <svg className="admin-stat__spark" viewBox="0 0 60 24" preserveAspectRatio="none" aria-hidden="true">
        <polyline
          points={spark}
          fill="none"
          stroke={sparkColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}