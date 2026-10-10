// src/services/orderNotifications.ts

import { supabase } from '../lib/supabaseClient';
import { createNotification } from './notifications';
import type { NotificationType } from '../types/notification';

/* ============================================================
   ✅ ORDER NOTIFICATION ORCHESTRATOR
   Updated: Product images sa notifications
============================================================ */

export type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled';

type TriggerParams = {
  orderId: string;
  orderCode: string;
  userId: string;
  email: string;
  customerName: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  claimLocation?: string;
  productId?: string;
  productImage?: string;
  productName?: string;
};

/* ============================================
   ✅ MAIN TRIGGER
   ============================================ */

export async function triggerOrderStatusNotifications(
  params: TriggerParams
): Promise<void> {
  /* ✅ Read user prefs */
  const { data: prefs } = await supabase
    .from('user_notification_prefs')
    .select('*')
    .eq('user_id', params.userId)
    .maybeSingle();

  const emailOn = prefs?.email_notifications ?? true;
  const orderUpdatesOn = prefs?.order_updates ?? true;
  const readyForDeliveryOn = prefs?.ready_for_delivery ?? true;
  const pickupRemindersOn = prefs?.pickup_reminders ?? true;

  const isDeliveryStatus =
    params.newStatus === 'Out for Delivery' ||
    params.newStatus === 'Ready for Pickup';

  /* ============================================
     ✅ IN-APP NOTIFICATIONS
     ============================================ */

  /* 1️⃣ Order Updates */
  if (orderUpdatesOn && params.newStatus !== 'Pending') {
    try {
      await createNotification(params.userId, {
        type: getNotificationType(params.newStatus),
        title: getStatusTitle(params.newStatus),
        message: getStatusMessage(params.newStatus, params.orderCode),
        link: `/orders/${params.orderId}`,
        actionLabel: 'View Order',
        metadata: {
          orderId: params.orderId,
          status: params.newStatus,
          previousStatus: params.previousStatus,
          productId: params.productId,
          productImage: params.productImage,
          productName: params.productName,
        },
      });
      console.log('[OrderNotif] ✅ In-app (order_updates)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[OrderNotif] ❌ In-app failed:', message);
    }
  }

  /* 2️⃣ Ready for Delivery */
  if (readyForDeliveryOn && isDeliveryStatus && !orderUpdatesOn) {
    try {
      await createNotification(params.userId, {
        type: 'pickup',
        title:
          params.newStatus === 'Out for Delivery'
            ? 'Out for Delivery!'
            : 'Ready for Pickup!',
        message: `Order ${params.orderCode} is ${params.newStatus.toLowerCase()}.`,
        link: `/orders/${params.orderId}`,
        actionLabel: 'View Order',
        metadata: {
          orderId: params.orderId,
          status: params.newStatus,
          productId: params.productId,
          productImage: params.productImage,
          productName: params.productName,
        },
      });
      console.log('[OrderNotif] ✅ In-app (ready_for_delivery)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[OrderNotif] ❌ In-app failed:', message);
    }
  }

  /* ============================================
     ✅ EMAIL NOTIFICATIONS
     ============================================ */

  if (!emailOn) {
    console.log('[OrderNotif] Email disabled by user prefs');
    return;
  }

  const shouldEmailOrderUpdates =
    orderUpdatesOn && params.newStatus !== 'Pending';
  const shouldEmailReadyForDelivery =
    readyForDeliveryOn && isDeliveryStatus;
  const shouldEmailPickupReminder =
    pickupRemindersOn && params.newStatus === 'Ready for Pickup';

  if (
    !shouldEmailOrderUpdates &&
    !shouldEmailReadyForDelivery &&
    !shouldEmailPickupReminder
  ) {
    console.log('[OrderNotif] No email trigger matched');
    return;
  }

  const template = getEmailTemplate(params.newStatus);

  try {
    const response = await fetch('/api/notifications/send-order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: params.orderId,
        orderCode: params.orderCode,
        userId: params.userId,
        email: params.email,
        customerName: params.customerName,
        template,
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
        claimLocation: params.claimLocation,
        productImage: params.productImage,
        productName: params.productName,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Email API failed: ${response.status}`);
    }

    console.log('[OrderNotif] ✅ Email sent:', template);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Email failed';
    console.error('[OrderNotif] ❌ Email failed:', message);
  }
}

/* ============================================
   ✅ HELPERS
   ============================================ */

function getNotificationType(status: OrderStatus): NotificationType {
  if (status === 'Cancelled') return 'system';
  if (status === 'Completed') return 'order';
  if (status === 'Ready for Pickup' || status === 'Out for Delivery')
    return 'pickup';
  return 'order';
}

function getStatusTitle(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Pending: 'Order Received',
    Processing: 'Order Being Processed',
    'Ready for Pickup': 'Ready for Pickup!',
    'Out for Delivery': 'Out for Delivery!',
    Completed: 'Order Completed',
    Cancelled: 'Order Cancelled',
  };
  return map[status] ?? 'Order Updated';
}

function getStatusMessage(status: OrderStatus, code: string): string {
  const map: Record<OrderStatus, string> = {
    Pending: `Order ${code} has been received.`,
    Processing: `Order ${code} is being prepared.`,
    'Ready for Pickup': `Order ${code} is ready for pickup at the supply office.`,
    'Out for Delivery': `Order ${code} is out for delivery.`,
    Completed: `Order ${code} is complete. Thank you!`,
    Cancelled: `Order ${code} has been cancelled.`,
  };
  return map[status] ?? `Order ${code} status updated.`;
}

function getEmailTemplate(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Pending: 'order_confirmed',
    Processing: 'order_processing',
    'Ready for Pickup': 'order_ready_pickup',
    'Out for Delivery': 'order_out_for_delivery',
    Completed: 'order_completed',
    Cancelled: 'order_cancelled',
  };
  return map[status] ?? 'order_updated';
}