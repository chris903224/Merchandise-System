// src/services/orders.ts

import { supabase, supabaseAdmin } from '../lib/supabaseClient';
import type { Order, OrderItem } from '../types';
import { getCachedData, invalidateCache } from '../utils/cache';
import { triggerOrderStatusNotifications } from './orderNotifications';

type SupabaseClient = typeof supabase;

/* ============================================
   ✅ PLACE ORDER — UPSERT
============================================ */

export async function placeOrder(
  order: Order,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client.from('orders').upsert(
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
    { onConflict: 'id' }
  );

  if (error) {
    console.error('[Orders] placeOrder error:', error);
    throw new Error(error.message);
  }

  invalidateCache('orders');
  invalidateCache('orders_all');
  invalidateCache('products');
  invalidateCache(`orders_${order.userId}`);
}

/* ============================================
   ✅ FETCH ORDER BY ID
============================================ */

export async function fetchOrderById(
  orderId: string,
  client: SupabaseClient = supabase
): Promise<Order | null> {
  const { data, error } = await client
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    console.error('[Orders] fetchOrderById error:', error);
    return null;
  }

  return data ? mapOrderRow(data) : null;
}

/* ============================================
   FETCH — user-specific
============================================ */

export async function fetchOrders(
  userId: string,
  client: SupabaseClient = supabase
): Promise<Order[]> {
  if (!userId) {
    console.warn('[Orders] fetchOrders called with empty userId');
    return [];
  }

  return getCachedData(
    `orders_${userId}`,
    async () => {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Orders] fetchOrders error:', error);
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

export async function fetchAllOrders(
  client: SupabaseClient = supabase
): Promise<Order[]> {
  return getCachedData(
    'orders_all',
    async () => {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Orders] fetchAllOrders error:', error);
        return [];
      }

      return (data ?? []).map(mapOrderRow);
    },
    3 * 60 * 1000
  );
}

/* ============================================
   ✅ UPDATE ORDER STATUS — optional client
============================================ */

export async function updateOrderStatus(
  orderId: string,
  status: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { data: existing, error: fetchError } = await client
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchError) {
    console.error('[Orders] updateOrderStatus fetch error:', fetchError);
    throw new Error(fetchError.message);
  }

  if (!existing) {
    throw new Error('Order not found');
  }

  const previousStatus = existing.order_status;

  if (previousStatus === status) {
    console.log('[Orders] Status unchanged, skipping');
    return;
  }

  const { error } = await client
    .from('orders')
    .update({ order_status: status })
    .eq('id', orderId);

  if (error) {
    console.error('[Orders] updateOrderStatus error:', error);
    throw new Error(error.message);
  }

  invalidateCache('orders_all');
  invalidateCache('orders');

  if (existing.user_id) {
    invalidateCache(`orders_${existing.user_id}`);
  }

  const items = (existing.items ?? []) as OrderItem[];
  const firstItem = items[0];
  const productId = firstItem?.id;
  const productName = firstItem?.name;

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
  }
}

/* ============================================
   ✅ CANCEL ORDER
============================================ */

export async function cancelOrder(
  orderId: string,
  reason: string = 'Cancelled by user',
  client: SupabaseClient = supabase
): Promise<void> {
  const { data: order, error: fetchError } = await client
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    throw new Error('Order not found');
  }

  if (order.order_status !== 'Pending') {
    throw new Error(
      'Cannot cancel — order is already being processed. Please contact the supply office.'
    );
  }

  const { error: updateError } = await client
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

  invalidateCache('orders_all');
  invalidateCache('orders');
  invalidateCache(`orders_${order.user_id}`);
  invalidateCache('products');

  const items = (order.items ?? []) as OrderItem[];
  const firstItem = items[0];
  const productId = firstItem?.id;
  const productName = firstItem?.name;

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
  paymentStatus: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { data: existing } = await client
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .maybeSingle();

  const { error } = await client
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', orderId);

  if (error) {
    console.error('[Orders] updatePaymentStatus error:', error);
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

export async function refreshOrders(
  userId?: string,
  client: SupabaseClient = supabase
): Promise<Order[]> {
  if (userId) {
    invalidateCache(`orders_${userId}`);
    return fetchOrders(userId, client);
  } else {
    invalidateCache('orders_all');
    return fetchAllOrders(client);
  }
}

/* ============================================
   DATE/TIME FORMATTERS
============================================ */

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

/* ✅ Export supabaseAdmin para sa admin services */
export { supabaseAdmin };