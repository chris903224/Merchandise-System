// src/services/admin/adminExport.ts

import type { AdminPayment, AdminOrder, AdminProduct } from '../../store/adminStore';

/* ============================================
   CSV HELPERS
   ============================================ */

export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`;

  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map((row) => row.map(escape).join(','));

  return [headerLine, ...dataLines].join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* ============================================
   SPECIFIC EXPORTS
   ============================================ */

export function exportPaymentsCSV(payments: AdminPayment[]): void {
  const headers = ['Reference', 'Customer', 'Method', 'Account', 'Amount', 'Status', 'Date'];
  const rows = payments.map((p) => [p.ref, p.customer, p.method, p.account, p.amount, p.status, p.date]);
  downloadCSV(toCSV(headers, rows), 'sjcm-payments.csv');
}

export function exportOrdersCSV(orders: AdminOrder[]): void {
  const headers = ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Time'];
  const rows = orders.map((o) => [
    o.id,
    o.customer.name,
    o.items.map((it) => `${it.name} ×${it.qty}`).join('; '),
    o.items.reduce((sum, it) => sum + it.qty * it.price, 0),
    o.status,
    o.date,
    o.time,
  ]);
  downloadCSV(toCSV(headers, rows), 'sjcm-orders.csv');
}

export function exportProductsCSV(products: AdminProduct[]): void {
  const headers = ['ID', 'Name', 'Category', 'Price', 'Stock', 'Status'];
  const rows = products.map((p) => [p.id, p.name, p.category, p.price, p.stock, p.stockState]);
  downloadCSV(toCSV(headers, rows), 'sjcm-products.csv');
}