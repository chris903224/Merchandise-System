// src/services/orders.ts

import { supabase } from '../lib/supabaseClient';
import type { Order, OrderItem } from '../types';
import { getCachedData, invalidateCache } from '../utils/cache';
import { triggerOrderStatusNotifications } from './orderNotifications';

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
   ✅ UPDATE ORDER STATUS — WITH PRODUCT INFO FOR NOTIFICATIONS
   ============================================ */

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<void> {
  // ✅ Fetch full order
  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching order:', fetchError);
    throw new Error(fetchError.message);
  }

  if (!existing) {
    throw new Error('Order not found');
  }

  const previousStatus = existing.order_status;

  // ✅ Skip kung walang change
  if (previousStatus === status) {
    console.log('[Orders] Status unchanged, skipping');
    return;
  }

  // ✅ Update order status
  const { error } = await supabase
    .from('orders')
    .update({ order_status: status })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error(error.message);
  }

  // ✅ Invalidate caches
  invalidateCache('orders_all');
  invalidateCache('orders');

  if (existing.user_id) {
    invalidateCache(`orders_${existing.user_id}`);
  }

  /* ============================================
     ✅ EXTRACT PRODUCT INFO FOR NOTIFICATION IMAGES
     ============================================ */
  const items = (existing.items ?? []) as OrderItem[];
  const firstItem = items[0];
  const productId = firstItem?.id;
  const productName = firstItem?.name;

  console.log('[Orders] Triggering notification with productId:', productId);

  // ✅ Trigger notifications with productId (para sa product image)
  try {
    await triggerOrderStatusNotifications({
      orderId: existing.id,
      orderCode: existing.id,
      userId: existing.user_id,
      email: existing.email || '',
      customerName: existing.customer_name,
      previousStatus: previousStatus as any,
      newStatus: status as any,
      claimLocation: existing.claim_location || undefined,
      productId,
      productName,
    });
  } catch (notifError) {
    console.error('[Orders] Notification trigger failed:', notifError);
    // Don't throw — hindi dapat mag-block sa order update
  }
}

/* ============================================
   ✅ CANCEL ORDER — with stock restoration via trigger
   ============================================ */

export async function cancelOrder(
  orderId: string,
  reason: string = 'Cancelled by user'
): Promise<void> {
  // ✅ Fetch current order
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    throw new Error('Order not found');
  }

  // ✅ Check kung Pending pa lang
  if (order.order_status !== 'Pending') {
    throw new Error(
      'Cannot cancel — order is already being processed. Please contact the supply office.'
    );
  }

  // ✅ Update status to Cancelled
  // ✅ Supabase trigger `on_order_cancelled` will auto-restore stock
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      order_status: 'Cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // ✅ Invalidate caches (products too kasi nag-restore ang stock)
  invalidateCache('orders_all');
  invalidateCache('orders');
  invalidateCache(`orders_${order.user_id}`);
  invalidateCache('products');

  /* ============================================
     ✅ EXTRACT PRODUCT INFO FOR NOTIFICATION
     ============================================ */
  const items = (order.items ?? []) as OrderItem[];
  const firstItem = items[0];
  const productId = firstItem?.id;
  const productName = firstItem?.name;

  console.log('[Order] Cancel notification with productId:', productId);

  // ✅ Send notification (fire-and-forget)
  try {
    await triggerOrderStatusNotifications({
      orderId: order.id,
      orderCode: order.id,
      userId: order.user_id,
      email: order.email || '',
      customerName: order.customer_name,
      previousStatus: order.order_status as any,
      newStatus: 'Cancelled',
      claimLocation: order.claim_location || undefined,
      productId,
      productName,
    });
  } catch (err) {
    console.error('[Order] Cancel notification failed:', err);
  }
}

/* ============================================
   UPDATE PAYMENT STATUS
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
   ✅ DATE/TIME FORMATTERS
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