// src/services/admin/adminOrdersService.ts

import {
  fetchAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  refreshOrders,
} from '../orders';
import { fetchProducts } from '../products';
import { triggerOrderStatusNotifications } from '../orderNotifications';

// ✅ PALITAN: supabase → supabaseAdmin
import { supabaseAdmin } from '../../lib/supabaseClient';

import type { Order, OrderItem, Product } from '../../types';
import type { AdminOrder, AdminOrderStatus } from '../../store/adminStore';

/* ============================================
   HELPERS
============================================ */

export const ORDER_FLOW: AdminOrderStatus[] = [
  'Pending',
  'Processing',
  'Ready for Pickup',
  'Completed',
];

function formatDate(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  } catch {
    return { date: iso, time: '' };
  }
}

function findProductImage(order: Order, products: Product[]): string | null {
  const firstItem = order.items[0];
  if (!firstItem) return null;
  const productId = (firstItem as any).id;
  if (!productId) return null;
  const product = products.find((p) => p.id === productId);
  return product?.image ?? null;
}

function mapOrderToAdmin(o: Order, products: Product[]): AdminOrder {
  const { date, time } = formatDate(o.createdAt);
  const image = findProductImage(o, products);

  return {
    id: o.id,
    status: o.orderStatus as AdminOrderStatus,
    customer: {
      name: o.customerName,
      studentId: o.studentId,
      email: o.email,
      phone: o.phone,
    },
    shipping: {
      method: 'Campus Pickup',
      location: o.claimLocation,
      date: o.claimDate,
    },
    payment: {
      method: o.paymentMethod,
      ref: o.paymentRef ?? '—',
      status: o.paymentStatus,
    },
    items: o.items.map((it: OrderItem) => ({
      name: it.name,
      qty: it.qty,
      price: it.price,
    })),
    date,
    time,
    img: image,
  };
}

/* ============================================
   READ — lahat gumagamit ng supabaseAdmin
============================================ */

export async function getOrders(filter: string = 'all'): Promise<AdminOrder[]> {
  const [orders, products] = await Promise.all([
    fetchAllOrders(supabaseAdmin),   // ✅ ADMIN CLIENT
    fetchProducts(),
  ]);
  const mapped = orders.map((o) => mapOrderToAdmin(o, products));
  if (filter === 'all') return mapped;
  return mapped.filter((o) => o.status === filter);
}

export async function getAllOrders(): Promise<AdminOrder[]> {
  const [orders, products] = await Promise.all([
    fetchAllOrders(supabaseAdmin),   // ✅ ADMIN CLIENT
    fetchProducts(),
  ]);
  return orders.map((o) => mapOrderToAdmin(o, products));
}

export async function getOrderById(id: string): Promise<AdminOrder | null> {
  const [orders, products] = await Promise.all([
    fetchAllOrders(supabaseAdmin),   // ✅ ADMIN CLIENT
    fetchProducts(),
  ]);
  const found = orders.find((o) => o.id === id);
  return found ? mapOrderToAdmin(found, products) : null;
}

export async function getOrderCounts() {
  const orders = await fetchAllOrders(supabaseAdmin);   // ✅ ADMIN CLIENT
  return {
    pending:    orders.filter((o) => o.orderStatus === 'Pending').length,
    processing: orders.filter((o) => o.orderStatus === 'Processing').length,
    ready:      orders.filter((o) => o.orderStatus === 'Ready for Pickup').length,
    completed:  orders.filter((o) => o.orderStatus === 'Completed').length,
    cancelled:  orders.filter((o) => o.orderStatus === 'Cancelled').length,
  };
}

/* ============================================
   ✅ SALES CHART DATA
============================================ */

export interface SalesChartPoint {
  label: string;
  value: number;
}

export async function getSalesChartData(
  days: number = 7
): Promise<SalesChartPoint[]> {
  const orders = await fetchAllOrders(supabaseAdmin);   // ✅ ADMIN CLIENT
  const now = new Date();
  const points: SalesChartPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayLabel = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayTotal = orders
      .filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= date && orderDate < nextDay;
      })
      .reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0);

    points.push({
      label: dayLabel,
      value: dayTotal,
    });
  }

  return points;
}

/* ============================================
   ✅ TOP SELLING PRODUCTS
============================================ */

export interface TopSellingProduct {
  id: string;
  name: string;
  category: string;
  image: string | null;
  totalQty: number;
  totalRevenue: number;
}

export async function getTopSellingProducts(
  limit: number = 4
): Promise<TopSellingProduct[]> {
  const [orders, products] = await Promise.all([
    fetchAllOrders(supabaseAdmin),   // ✅ ADMIN CLIENT
    fetchProducts(),
  ]);

  const tally = new Map<string, { qty: number; revenue: number }>();

  orders.forEach((order) => {
    order.items.forEach((item: any) => {
      const productId = item.id;
      if (!productId) return;

      const existing = tally.get(productId) ?? { qty: 0, revenue: 0 };
      existing.qty += Number(item.qty) || 0;
      existing.revenue += (Number(item.qty) || 0) * (Number(item.price) || 0);
      tally.set(productId, existing);
    });
  });

  const sorted = Array.from(tally.entries())
    .map(([id, stats]) => {
      const product = products.find((p) => p.id === id);
      return {
        id,
        name: product?.name ?? 'Unknown Product',
        category: product?.category ?? '—',
        image: product?.image ?? null,
        totalQty: stats.qty,
        totalRevenue: stats.revenue,
      };
    })
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, limit);

  return sorted;
}

/* ============================================
   HELPERS
============================================ */

export function orderTotal(order: AdminOrder): number {
  return order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

export function orderItemCount(order: AdminOrder): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}

/* ============================================
   ✅ NOTIFICATION HELPER — supabaseAdmin
============================================ */

async function triggerStatusNotification(
  orderId: string,
  previousStatus: string,
  newStatus: string
): Promise<void> {
  try {
    // ✅ PALITAN: supabase → supabaseAdmin
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      console.warn('[AdminOrders] Order not found for notification:', orderId);
      return;
    }

    const items = order.items ?? [];
    const firstItem = items[0];

    await triggerOrderStatusNotifications({
      orderId: order.id,
      orderCode: order.id,
      userId: order.user_id,
      email: order.email || '',
      customerName: order.customer_name,
      previousStatus: previousStatus as any,
      newStatus: newStatus as any,
      claimLocation: order.claim_location || undefined,
      productId: firstItem?.id,
      productName: firstItem?.name,
    });

    console.log(
      `[AdminOrders] ✅ Notification triggered: ${previousStatus} → ${newStatus}`
    );
  } catch (err) {
    console.error('[AdminOrders] ❌ Notification failed:', err);
    // Don't throw — hindi dapat mag-block sa order update
  }
}

/* ============================================
   ✅ WRITE — supabaseAdmin
============================================ */

export async function advanceOrder(id: string): Promise<void> {
  // ✅ ADMIN CLIENT
  const orders = await fetchAllOrders(supabaseAdmin);
  const order = orders.find((o) => o.id === id);
  if (!order) throw new Error(`Order ${id} not found.`);

  const idx = ORDER_FLOW.indexOf(order.orderStatus as AdminOrderStatus);
  if (idx === -1 || idx >= ORDER_FLOW.length - 1) return;

  const next = ORDER_FLOW[idx + 1];
  const previousStatus = order.orderStatus;

  // ✅ Update sa DB gamit ang ADMIN client
  await updateOrderStatus(id, next, supabaseAdmin);

  // ✅ Trigger notification + email
  await triggerStatusNotification(id, previousStatus, next);
}

export async function setOrderStatus(
  id: string,
  status: AdminOrderStatus
): Promise<void> {
  // ✅ ADMIN CLIENT — kunin ang current status
  const orders = await fetchAllOrders(supabaseAdmin);
  const order = orders.find((o) => o.id === id);

  if (!order) {
    console.error('[AdminOrders] Order not found:', id);
    throw new Error(`Order ${id} not found.`);
  }

  const previousStatus = order.orderStatus;

  // ✅ Skip kung walang change
  if (previousStatus === status) {
    console.log('[AdminOrders] Status unchanged, skipping');
    return;
  }

  // ✅ Update sa DB gamit ang ADMIN client
  await updateOrderStatus(id, status, supabaseAdmin);

  console.log(`[AdminOrders] Status updated: ${previousStatus} → ${status}`);

  // ✅ Trigger notification + email
  await triggerStatusNotification(id, previousStatus, status);
}

export async function cancelOrder(id: string): Promise<void> {
  await setOrderStatus(id, 'Cancelled');
}

export async function updateOrderPaymentStatus(
  id: string,
  paymentStatus: string
): Promise<void> {
  // ✅ ADMIN CLIENT
  await updatePaymentStatus(id, paymentStatus, supabaseAdmin);
}

/* ============================================
   FORCE REFRESH
============================================ */

export async function forceRefreshOrders(): Promise<AdminOrder[]> {
  const [orders, products] = await Promise.all([
    refreshOrders(undefined, supabaseAdmin),   // ✅ ADMIN CLIENT
    fetchProducts(),
  ]);
  return orders.map((o) => mapOrderToAdmin(o, products));
}