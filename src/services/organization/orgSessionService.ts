// src/services/organization/orgOrdersService.ts

import { supabase } from '../../lib/supabaseClient';
import type { Order } from '../../types';
import { triggerOrderStatusNotifications } from '../orderNotifications';
import { invalidateCache } from '../../utils/cache';

/* ============================================
   ✅ ORG SESSION SERVICE (Para hindi bumalik sa Pending)
   ============================================ */

const ORG_SESSION_KEY = 'sjcm_org_session';

export interface OrgSession {
  userId: string;
  email: string;
  role: string;
  name: string;
  organization: string;
}

export function saveOrgSession(session: OrgSession) {
  localStorage.setItem(ORG_SESSION_KEY, JSON.stringify(session));
  console.log('[OrgSession] ✅ Session saved:', session);
}

export function getOrgSession(): OrgSession | null {
  const raw = localStorage.getItem(ORG_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrgSession;
  } catch {
    return null;
  }
}

export function clearOrgSession() {
  localStorage.removeItem(ORG_SESSION_KEY);
  console.log('[OrgSession] 🗑️ Session cleared');
}

/* ============================================
   ✅ TYPES
   ============================================ */

export type OrgOrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Ready for Pickup'
  | 'Claimed'
  | 'Cancelled';

export interface OrgOrderCounts {
  pending: number;
  processing: number;
  ready: number;
  claimed: number;
  cancelled: number;
}

export const ORG_ORDER_FLOW: OrgOrderStatus[] = [
  'Pending',
  'Processing',
  'Ready for Pickup',
  'Claimed',
];

/* ============================================
   ✅ HELPERS
   ============================================ */

function findProductImage(order: Order, products: any[]): string | null {
  const firstItem = order.items[0];
  if (!firstItem) return null;

  const itemId =
    (firstItem as any).productId ||
    (firstItem as any).id ||
    (firstItem as any)._id ||
    (firstItem as any).product_id;

  if (!itemId) return null;

  const product = products.find((p) => String(p.id) === String(itemId));
  return product?.image ?? null;
}

export function mapOrderToOrg(o: Order, products: any[]): Order & { img: string | null } {
  return {
    ...o,
    img: findProductImage(o, products),
  };
}

/* ============================================
   ✅ FETCH: Direct sa Supabase (NO CACHE)
   ============================================ */
export async function fetchFreshOrgOrders(): Promise<Array<Order & { img: string | null }>> {
  // 1. I-force bura ang cache para walang lumang data
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sjcm_cache_orders')) {
      localStorage.removeItem(key);
    }
  });

  // 2. Kunin ang orders
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('[OrgOrders] Failed to fetch orders:', ordersError);
    return [];
  }

  // 3. Kunin ang products para sa image
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('id, image, name');

  if (productsError) {
    console.error('[OrgOrders] Failed to fetch products:', productsError);
  }

  const products = (productsData ?? []) as any[]; 

  // 4. I-map ang data
  return (ordersData ?? []).map((row) => {
    const order: Order = {
      id: row.id,
      userId: row.user_id,
      customerName: row.customer_name,
      studentId: row.student_id ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      items: row.items ?? [],
      totalAmount: Number(row.total_amount),
      paymentMethod: row.payment_method ?? '',
      paymentRef: row.payment_ref ?? null,
      paymentStatus: row.payment_status ?? '',
      orderStatus: row.order_status ?? '',
      claimLocation: row.claim_location ?? '',
      claimDate: row.claim_date ?? '',
      createdAt: row.created_at,
    };

    return mapOrderToOrg(order, products);
  });
}

export async function getOrgOrders(
  filter: string = 'all'
): Promise<Array<Order & { img: string | null }>> {
  const orders = await fetchFreshOrgOrders();
  if (filter === 'all') return orders;
  return orders.filter((o) => o.orderStatus === filter);
}

export async function getOrgOrderCounts(): Promise<OrgOrderCounts> {
  const orders = await fetchFreshOrgOrders();
  return {
    pending: orders.filter((o) => o.orderStatus === 'Pending').length,
    processing: orders.filter((o) => o.orderStatus === 'Processing').length,
    ready: orders.filter((o) => o.orderStatus === 'Ready for Pickup').length,
    claimed: orders.filter((o) => o.orderStatus === 'Claimed').length,
    cancelled: orders.filter((o) => o.orderStatus === 'Cancelled').length,
  };
}

/* ============================================
   ✅ NOTIFICATION HELPER (Non-fatal)
   ============================================ */

async function triggerOrgNotification(
  orderId: string,
  previousStatus: string,
  newStatus: string
): Promise<void> {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      console.warn('[OrgOrders] Order not found for notification:', orderId);
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

    console.log(`[OrgOrders] ✅ Notification: ${previousStatus} → ${newStatus}`);
  } catch (err) {
    console.warn('[OrgOrders] ⚠️ Notification failed (non-fatal):', err);
  }
}

/* ============================================
   ✅ WRITE: SET STATUS (Cache-free & Session Check)
   ============================================ */

export async function setOrgOrderStatus(
  id: string,
  status: OrgOrderStatus
): Promise<void> {
  // 1. Kunin ang session (para sure na Organization ka)
  const session = getOrgSession();
  if (!session || session.role !== 'Organization') {
    throw new Error('Unauthorized: Organization session required.');
  }

  // 2. Kunin ang kasalukuyang order
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !order) {
    throw new Error(`Order ${id} not found.`);
  }

  const previousStatus = order.order_status;

  if (previousStatus === status) {
    console.log('[OrgOrders] Status unchanged, skipping');
    return;
  }

  // 3. I-update ang status sa database
  const { error: updateError } = await supabase
    .from('orders')
    .update({ order_status: status })
    .eq('id', id);

  if (updateError) throw new Error(updateError.message);

  // 4. I-invalidate ang cache
  invalidateCache('orders');
  invalidateCache('orders_all');
  invalidateCache(`orders_${order.user_id}`);

  console.log(`[OrgOrders] Status updated: ${previousStatus} → ${status}`);

  // 5. I-trigger ang notification (non-fatal)
  await triggerOrgNotification(id, previousStatus, status);
}

export async function advanceOrgOrder(id: string): Promise<OrgOrderStatus | null> {
  const session = getOrgSession();
  if (!session || session.role !== 'Organization') {
    throw new Error('Unauthorized: Organization session required.');
  }

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !order) throw new Error(`Order ${id} not found.`);

  const currentStatus = order.order_status as OrgOrderStatus;
  const idx = ORG_ORDER_FLOW.indexOf(currentStatus);
  if (idx === -1 || idx >= ORG_ORDER_FLOW.length - 1) return null;

  const next = ORG_ORDER_FLOW[idx + 1];

  await setOrgOrderStatus(id, next);

  return next;
}

export async function cancelOrgOrder(id: string): Promise<void> {
  await setOrgOrderStatus(id, 'Cancelled');
}

export async function forceRefreshOrgOrders(): Promise<Array<Order & { img: string | null }>> {
  invalidateCache('orders');
  invalidateCache('orders_all');
  return fetchFreshOrgOrders();
}