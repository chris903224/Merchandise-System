// src/services/orders.ts

import { supabase } from '../lib/supabaseClient';
import type { Order, OrderItem } from '../types';
import { getCachedData, invalidateCache } from '../utils/cache';

/* ============================================
   PLACE ORDER
   ============================================ */

export async function placeOrder(order: Order): Promise<void> {
  const { error } = await supabase.from('orders').insert([
    {
      id: order.id,
      user_id: order.userId,
      customer_name: order.customerName,
      student_id: order.studentId,
      email: order.email,
      phone: order.phone,
      items: order.items,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      payment_ref: order.paymentRef,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      claim_location: order.claimLocation,
      claim_date: order.claimDate,
      created_at: order.createdAt,
    },
  ]);

  if (error) {
    console.error('Error placing order:', error);
    throw new Error(error.message);
  }

  // ✅ Invalidate caches
  invalidateCache('orders');
  invalidateCache('orders_all');
  invalidateCache('products');
  invalidateCache(`orders_${order.userId}`);
}

/* ============================================
   FETCH — user-specific
   ============================================ */

export async function fetchOrders(userId: string): Promise<Order[]> {
  return getCachedData(
    `orders_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }

      return (data ?? []).map(mapOrderRow);
    },
    3 * 60 * 1000
  );
}

/* ============================================
   FETCH — all orders (admin)
   ============================================ */

export async function fetchAllOrders(): Promise<Order[]> {
  return getCachedData(
    'orders_all',
    async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all orders:', error);
        return [];
      }

      return (data ?? []).map(mapOrderRow);
    },
    3 * 60 * 1000
  );
}

/* ============================================
   UPDATE ORDER STATUS — with FULL cache invalidation
   ============================================ */

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<void> {
  // ✅ Kunin yung user_id BEFORE update para ma-invalidate yung user cache
  const { data: existing } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .maybeSingle();

  const { error } = await supabase
    .from('orders')
    .update({ order_status: status })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error(error.message);
  }

  // ✅ Invalidate LAHAT ng caches
  invalidateCache('orders_all');
  invalidateCache('orders');

  if (existing?.user_id) {
    invalidateCache(`orders_${existing.user_id}`);
  }
}

/* ============================================
   UPDATE PAYMENT STATUS — with FULL cache invalidation
   ============================================ */

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: string
): Promise<void> {
  const { data: existing } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .maybeSingle();

  const { error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating payment status:', error);
    throw new Error(error.message);
  }

  invalidateCache('orders_all');
  invalidateCache('orders');

  if (existing?.user_id) {
    invalidateCache(`orders_${existing.user_id}`);
  }
}

/* ============================================
   REFRESH — bypass cache
   ============================================ */

export async function refreshOrders(userId?: string): Promise<Order[]> {
  if (userId) {
    invalidateCache(`orders_${userId}`);
    return fetchOrders(userId);
  } else {
    invalidateCache('orders_all');
    return fetchAllOrders();
  }
}

/* ============================================
   ✅ BAGO — DATE/TIME FORMATTERS
   ============================================ */

/**
 * Format date — e.g. "Oct 2, 2026"
 */
export function formatDate(iso: string): string {
  if (!iso) return '—';

  try {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

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

/* ============================================
   MAPPER
   ============================================ */

function mapOrderRow(row: any): Order {
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    studentId: row.student_id ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    items: (row.items ?? []) as OrderItem[],
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method ?? '',
    paymentRef: row.payment_ref ?? null,
    paymentStatus: row.payment_status ?? '',
    orderStatus: row.order_status ?? '',
    claimLocation: row.claim_location ?? '',
    claimDate: row.claim_date ?? '',
    createdAt: row.created_at,
  };
}