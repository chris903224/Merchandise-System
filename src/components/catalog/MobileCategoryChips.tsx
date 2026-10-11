// src/components/home/MobileCategoryChips.tsx
// ✅ Horizontal scroll chips — TikTok style

import { Link } from 'react-router-dom';
import {
  Shirt,
  Badge,
  Package2,
  Grid2x2,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All items', icon: Grid2x2, to: '/catalog' },
  { id: 'uniform', label: 'Uniforms', icon: Shirt, to: '/catalog?search=Uniform' },
  { id: 'id-lace', label: 'ID Lace', icon: Badge, to: '/catalog?search=ID%20Lace' },
  { id: 'org', label: 'Organization', icon: Shirt, to: '/catalog?search=Organization' },
  { id: 'pe', label: 'PE Uniform', icon: Shirt, to: '/catalog?search=PE' },
  { id: 'other', label: 'Others', icon: Package2, to: '/catalog' },
];

export default function MobileCategoryChips() {
  return (
    <div className="mobile-category-chips" role="list">
      {CATEGORIES.map(({ id, label, icon: Icon, to }) => (
        <Link
          key={id}
          to={to}
          className="mobile-category-chip"
          role="listitem"
        >
          <Icon className="react-icon" aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </div>
  );
}