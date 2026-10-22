// src/components/organization/OrderStatusPill.tsx
export default function OrderStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: 'wa',
    Processing: 'wa',
    'Ready for Pickup': 'ok',
    Claimed: 'ok',
    Cancelled: 'no',
  };
  return <span className={`pill ${map[status] ?? 'wa'}`}>{status}</span>;
}