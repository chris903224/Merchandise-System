// src/services/admin/adminPaymentsService.ts

import type { AdminPayment } from '../../store/adminStore';

/* ============================================
   MOCK DATA
   ============================================ */

let PAYMENTS: AdminPayment[] = [
  {
    ref: 'REF-1002938481',
    customer: 'Juan Dela Cruz',
    method: 'GCash',
    account: '0917 555 0123',
    amount: 1000,
    status: 'Verified',
    date: 'Sep 21, 10:42 AM',
  },
  {
    ref: 'REF-1002938482',
    customer: 'Maria Santos',
    method: 'GCash',
    account: '0917 555 0456',
    amount: 700,
    status: 'Pending',
    date: 'Sep 21, 09:18 AM',
  },
  {
    ref: 'REF-1002938483',
    customer: 'Ralph Mendoza',
    method: 'OTC',
    account: '—',
    amount: 240,
    status: 'Verified',
    date: 'Sep 20, 04:27 PM',
  },
  {
    ref: 'REF-1002938484',
    customer: 'Angela Reyes',
    method: 'GCash',
    account: '0917 555 0321',
    amount: 300,
    status: 'Verified',
    date: 'Sep 20, 01:12 PM',
  },
  {
    ref: 'REF-1002938485',
    customer: 'Lance Cruz',
    method: 'Bank',
    account: '0045 6789 1234',
    amount: 500,
    status: 'Refunded',
    date: 'Sep 20, 11:03 AM',
  },
  {
    ref: 'REF-1002938486',
    customer: 'Bea Aquino',
    method: 'GCash',
    account: '0917 555 0999',
    amount: 1000,
    status: 'Pending',
    date: 'Sep 19, 08:14 PM',
  },
];

/* ============================================
   READ
   ============================================ */

/**
 * Get all payments, optionally filtered by status.
 * @param filter 'all' | 'Pending' | 'Verified' | 'Refunded'
 */
export function getPayments(filter: string = 'all'): AdminPayment[] {
  if (filter === 'all') return [...PAYMENTS];
  return PAYMENTS.filter((p) => p.status === filter);
}

export function getAllPayments(): AdminPayment[] {
  return [...PAYMENTS];
}

/**
 * Find a single payment by reference number.
 * Used by AdminPaymentDetailModal.
 */
export function getPaymentByRef(ref: string): AdminPayment | undefined {
  return PAYMENTS.find((p) => p.ref === ref);
}

/**
 * Aggregated summary for the Payment Management page cards.
 */
export function getPaymentSummary() {
  const sumBy = (status: AdminPayment['status']) =>
    PAYMENTS.filter((p) => p.status === status).reduce(
      (sum, p) => sum + p.amount,
      0
    );

  const countBy = (status: AdminPayment['status']) =>
    PAYMENTS.filter((p) => p.status === status).length;

  const otcPayments = PAYMENTS.filter((p) => p.method === 'OTC');

  return {
    verified: sumBy('Verified'),
    verifiedCount: countBy('Verified'),
    pending: sumBy('Pending'),
    pendingCount: countBy('Pending'),
    refunded: sumBy('Refunded'),
    refundedCount: countBy('Refunded'),
    otc: otcPayments.reduce((sum, p) => sum + p.amount, 0),
    otcCount: otcPayments.length,
  };
}

/* ============================================
   WRITE
   ============================================ */

/**
 * Update a payment's status. Returns the updated record, or null if not found.
 */
export function setPaymentStatus(
  ref: string,
  status: AdminPayment['status']
): AdminPayment | null {
  const payment = PAYMENTS.find((p) => p.ref === ref);
  if (!payment) return null;
  payment.status = status;
  return payment;
}

/** Shorthand: mark payment as verified */
export function verifyPayment(ref: string): AdminPayment | null {
  return setPaymentStatus(ref, 'Verified');
}

/** Shorthand: mark payment as refunded/rejected */
export function rejectPayment(ref: string): AdminPayment | null {
  return setPaymentStatus(ref, 'Refunded');
}

/**
 * Add a new payment (e.g., from user submission).
 */
export function addPayment(payment: AdminPayment): AdminPayment {
  PAYMENTS = [payment, ...PAYMENTS];
  return payment;
}

/**
 * Delete a payment by reference.
 */
export function deletePayment(ref: string): boolean {
  const before = PAYMENTS.length;
  PAYMENTS = PAYMENTS.filter((p) => p.ref !== ref);
  return PAYMENTS.length < before;
}