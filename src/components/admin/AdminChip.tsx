// src/components/admin/AdminChip.tsx

interface Props {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}

export default function AdminChip({ label, active = false, onClick, count }: Props) {
  return (
    <button
      type="button"
      className={`admin-chip ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className="admin-chip__count">{count}</span>
      )}
    </button>
  );
}