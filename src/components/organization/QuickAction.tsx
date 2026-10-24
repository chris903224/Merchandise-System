// src/components/organization/QuickAction.tsx

import { Link } from 'react-router-dom';
import { Icon } from '../Icon';

interface QuickActionProps {
  to: string;
  color: string;
  icon: string;
  label: string;
}

export default function QuickAction({ to, color, icon, label }: QuickActionProps) {
  return (
    <Link 
      to={to} 
      className="qa" 
      // Kinukuha nito ang --c variable para sa background gradient sa CSS
      style={{ '--c': color } as React.CSSProperties}
    >
      <div className="ic" style={{ backgroundColor: color }}>
        <Icon name={icon} />
      </div>
      <span className="qa-label">{label}</span>
      <Icon name="arrow-right" className="qa-arrow" />
    </Link>
  );
}