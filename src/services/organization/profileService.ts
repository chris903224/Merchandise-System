// src/services/admin/adminPaymentsService.ts

import { supabase } from '../../lib/supabaseClient';
import type { AdminPayment } from '../../store/adminStore';

/* ============================================
   MAPPER — Supabase row → AdminPayment
   ============================================ */

function mapPaymentRow(row: any): AdminPayment {
  return {
    ref: row.ref,
    customer: row.customer,
    method: row.method as AdminPayment['method'],
    account: row.account ?? '—',
    amount: Number(row.amount),
    status: row.status as AdminPayment['status'],
    date: new Date(row.created_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    orderId: row.order_id ?? undefined,
  };
}

/* ============================================
   READ
   ============================================ */

/**
 * Get all payments, optionally filtered by status.
 * @param filter 'all' | 'Pending' | 'Verified' | 'Paid' | 'Refunded'
 */
export async function getPayments(filter: string = 'all'): Promise<AdminPayment[]> {
  let query = supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Payments] Failed to fetch:', error);
    return [];
  }

  return (data ?? []).map(mapPaymentRow);
}

export async function getAllPayments(): Promise<AdminPayment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Payments] Failed to fetch all:', error);
    return [];
  }

  return (data ?? []).map(mapPaymentRow);
}

/**
 * Find a single payment by reference number.
 * Used by AdminPaymentDetailModal.
 */
export async function getPaymentByRef(ref: string): Promise<AdminPayment | undefined> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('ref', ref)
    .maybeSingle();

  if (error) {
    console.error('[Payments] Failed to fetch by ref:', error);
    return undefined;
  }

  return data ? mapPaymentRow(data) : undefined;
}

/**
 * Aggregated summary — GCash vs COD breakdown.
 */
export async function getPaymentSummary() {
  const { data, error } = await supabase
    .from('payments')
    .select('amount, status, method');

  if (error) {
    console.error('[Payments] Failed to fetch summary:', error);
    return {
      verified: 0,
      verifiedCount: 0,
      pending: 0,
      pendingCount: 0,
      cod: 0,
      codCount: 0,
      refunded: 0,
      refundedCount: 0,
    };
  }

  const rows = data ?? [];

  const sumBy = (status: string) =>
    rows
      .filter((r) => r.status === status)
      .reduce((sum, r) => sum + Number(r.amount), 0);

  const countBy = (status: string) =>
    rows.filter((r) => r.status === status).length;

  const codRows = rows.filter((r) => r.method === 'COD');

  return {
    verified: sumBy('Verified'),
    verifiedCount: countBy('Verified'),
    pending: sumBy('Pending'),
    pendingCount: countBy('Pending'),
    cod: codRows.reduce((sum, r) => sum + Number(r.amount), 0),
    codCount: codRows.length,
    refunded: sumBy('Refunded'),
    refundedCount: countBy('Refunded'),
  };
}

/* ============================================
   WRITE
   ============================================ */

/**
 * Update a payment's status. Returns updated record, or null if not found.
 */
export async function setPaymentStatus(
  ref: string,
  status: AdminPayment['status']
): Promise<AdminPayment | null> {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('ref', ref)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Payments] Failed to update:', error);
    throw new Error(error.message);
  }

  return data ? mapPaymentRow(data) : null;
}

/** Shorthand: mark GCash payment as verified */
export async function verifyPayment(ref: string): Promise<AdminPayment | null> {
  return setPaymentStatus(ref, 'Verified');
}

/** Shorthand: mark payment as refunded/rejected */
export async function rejectPayment(ref: string): Promise<AdminPayment | null> {
  return setPaymentStatus(ref, 'Refunded');
}

/** Shorthand: mark COD payment as paid */
export async function markCodAsPaid(ref: string): Promise<AdminPayment | null> {
  return setPaymentStatus(ref, 'Paid');
}

/**
 * Add a new payment (e.g., from user checkout submission).
 */
export async function addPayment(payment: AdminPayment): Promise<AdminPayment> {
  const { data, error } = await supabase
    .from('payments')
    .insert([
      {
        ref: payment.ref,
        customer: payment.customer,
        method: payment.method,
        account: payment.account === '—' ? null : payment.account,
        amount: payment.amount,
        status: payment.status,
        order_id: payment.orderId ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[Payments] Failed to add:', error);
    throw new Error(error.message);
  }

  return mapPaymentRow(data);
}

/**
 * Delete a payment by reference.
 */
export async function deletePayment(ref: string): Promise<boolean> {
  const { error } = await supabase.from('payments').delete().eq('ref', ref);

  if (error) {
    console.error('[Payments] Failed to delete:', error);
    return false;
  }

  return true;
}