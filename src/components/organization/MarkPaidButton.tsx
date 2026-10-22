// src/components/organization/MarkPaidButton.tsx
import { useState } from 'react';

export default function MarkPaidButton({
  orderId,
  onMarkPaid,
  disabled = false, // ✅ Receive disabled prop
}: {
  orderId: string;
  onMarkPaid: (id: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await onMarkPaid(orderId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button 
      className="btn sm" 
      onClick={handleClick} 
      disabled={busy || disabled} // ✅ Disable if busy or global updating
    >
      {busy ? 'Saving…' : 'Mark paid'}
    </button>
  );
}