// src/services/orders.ts

import { supabase } from '../lib/supabaseClient';
import type { Order, OrderItem } from '../types';
import { getCachedData, invalidateCache } from '../utils/cache';

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
  invalidateCache('products');
  invalidateCache(`orders_${order.userId}`);
}

/**
 * Fetch orders for specific user — with cache (3 min TTL)
 */
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
    3 * 60 * 1000 // 3 minutes
  );
}

/**
 * Fetch all orders (admin) — with cache (3 min TTL)
 */
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
    3 * 60 * 1000 // 3 minutes
  );
}

/**
 * Update order status — invalidate cache
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ order_status: status })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error(error.message);
  }

  invalidateCache('orders_all');
  invalidateCache('orders');
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: string
): Promise<void> {
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
}

/**
 * Force refresh orders (bypass cache)
 */
export async function refreshOrders(userId?: string): Promise<Order[]> {
  if (userId) {
    invalidateCache(`orders_${userId}`);
    return fetchOrders(userId);
  } else {
    invalidateCache('orders_all');
    return fetchAllOrders();
  }
}

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