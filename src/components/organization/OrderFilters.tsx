// src/components/organization/OrderFilters.tsx
import type { OrderFilter } from '../../types/organization';

const FILTERS: { v: OrderFilter; l: string }[] = [
  { v: 'all', l: 'All' },
  { v: 'pending-payment', l: 'Pending payment' },
  { v: 'paid', l: 'Paid' },
  { v: 'pending-order', l: 'Pending order' },
  { v: 'processing', l: 'Processing' },
  { v: 'ready', l: 'Ready' },
  { v: 'claimed', l: 'Claimed' },
  { v: 'cancelled', l: 'Cancelled' },
];

export default function OrderFilters({
  filter, onFilterChange, search, onSearchChange,
}: {
  filter: OrderFilter;
  onFilterChange: (f: OrderFilter) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="glass card flt">
      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.v}
            className={`chip${filter === f.v ? ' on' : ''}`}
            onClick={() => onFilterChange(f.v)}
          >
            {f.l}
          </button>
        ))}
      </div>
      <div className="tb">
        <input
          className="in"
          placeholder="Search order #, customer, or method…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}