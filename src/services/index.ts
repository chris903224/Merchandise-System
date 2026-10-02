// src/services/index.ts

export * from './orders';
export * from './products';

/* ============================================
   ✅ BAGO — date/time formatter
   ============================================ */

/**
 * Format date + time — e.g. "Oct 2, 2026 · 8:24 AM"
 */
export function formatDateTime(iso: string): string {
  if (!iso) return '—';

  try {
    const date = new Date(iso);

    const datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${datePart} · ${timePart}`;
  } catch {
    return iso;
  }
}