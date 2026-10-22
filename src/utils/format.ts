// src/utils/format.ts

export const peso = (n: number): string => {
  if (n === undefined || n === null || isNaN(n)) return '₱0';
  return '₱' + n.toLocaleString('en-PH', { maximumFractionDigits: 2 });
};

export const formatDate = (iso: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

export const formatDateTime = (iso: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
};