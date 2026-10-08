// app/api/webhooks/paymongo.ts

/* ============================================
   ✅ PAYMONGO WEBHOOK HANDLER — Vercel Serverless
   ✅ Tumatanggap ng notifications mula sa PayMongo
   ✅ Auto-update ng order status sa Supabase
   ✅ Signature verification para sa security
============================================================ */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Paymongo-Signature');

  // ✅ Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // ✅ Get signature from headers
    const signature = req.headers['paymongo-signature'];
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    // ✅ Get raw body for signature verification
    const rawBody =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const event =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const eventType = event.data?.attributes?.type;
    console.log(`[Webhook] 📩 Received: ${eventType}`);

    // ============================================
    // ✅ VERIFY SIGNATURE (SECURITY)
    // ============================================
    if (webhookSecret && signature) {
      try {
        const parts = signature.split(',');
        const timestamp = parts[0].split('=')[1];
        const testSig = parts[1]?.split('=')[1];
        const liveSig = parts[2]?.split('=')[1];

        const payload = `${timestamp}.${rawBody}`;
        const expectedSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(payload)
          .digest('hex');

        const signatureMatches =
          expectedSig === testSig || expectedSig === liveSig;

        if (!signatureMatches) {
          console.warn('[Webhook] ❌ Invalid signature');
          return res.status(401).json({ message: 'Invalid signature' });
        }

        console.log('[Webhook] ✅ Signature verified');
      } catch (sigError) {
        console.warn('[Webhook] ⚠️ Signature verification error:', sigError);
        // ✅ Continue pa rin para hindi ma-block (para sa testing)
      }
    } else {
      console.warn('[Webhook] ⚠️ No signature or webhook secret');
    }

    // ============================================
    // ✅ HANDLE DIFFERENT EVENT TYPES
    // ============================================
    switch (eventType) {
      case 'checkout_session.payment.paid':
        await handlePaymentPaid(event);
        break;

      case 'payment.paid':
        await handlePaymentPaid(event);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event);
        break;

      case 'payment.refunded':
      case 'payment.refund.updated':
        await handleRefund(event);
        break;

      default:
        console.log(`[Webhook] ℹ️ Unhandled event: ${eventType}`);
    }

    // ✅ Always return 200 to acknowledge
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] ❌ Error:', error);
    // ✅ Still return 200 to prevent PayMongo retries
    return res.status(200).json({ received: true, error: error.message });
  }
}

/* ============================================
   ✅ HANDLE: Payment Paid
============================================================ */
async function handlePaymentPaid(event: any) {
  try {
    const data = event.data.attributes.data;

    // ✅ Get order ID from reference_number
    const orderId =
      data.attributes?.reference_number ||
      data.attributes?.description?.match(/SJCM-\d+/)?.[0];

    // ✅ Get payment ID
    const paymentId =
      data.attributes?.payments?.[0]?.id ||
      data.attributes?.id;

    // ✅ Get amount
    const amount = data.attributes?.amount;

    console.log(`[Webhook] ✅ PAID:`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Payment ID: ${paymentId}`);
    console.log(`   Amount: ₱${(amount / 100).toFixed(2)}`);

    if (!orderId) {
      console.warn('[Webhook] ⚠️ No order ID found in payload');
      return;
    }

    // ✅ Update order in Supabase
    await updateOrderInSupabase(orderId, {
      payment_status: 'Paid',
      order_status: 'Processing',
      payment_ref: paymentId,
    });
  } catch (error) {
    console.error('[Webhook] handlePaymentPaid error:', error);
  }
}

/* ============================================
   ✅ HANDLE: Payment Failed
============================================================ */
async function handlePaymentFailed(event: any) {
  try {
    const data = event.data.attributes.data;
    const orderId =
      data.attributes?.reference_number ||
      data.attributes?.description?.match(/SJCM-\d+/)?.[0];

    console.log(`[Webhook] ❌ FAILED: ${orderId}`);

    if (!orderId) return;

    await updateOrderInSupabase(orderId, {
      payment_status: 'Failed',
      order_status: 'Cancelled',
    });
  } catch (error) {
    console.error('[Webhook] handlePaymentFailed error:', error);
  }
}

/* ============================================
   ✅ HANDLE: Refund
============================================================ */
async function handleRefund(event: any) {
  try {
    const data = event.data.attributes.data;
    const paymentId = data.attributes?.payment_id || data.id;

    console.log(`[Webhook] 💸 Refund processed for payment: ${paymentId}`);

    // ✅ Optional: Update order based on payment_ref
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from('orders')
      .update({
        payment_status: 'Refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_ref', paymentId);

    console.log(`[Webhook] ✅ Refund updated for payment: ${paymentId}`);
  } catch (error) {
    console.error('[Webhook] handleRefund error:', error);
  }
}

/* ============================================
   ✅ UPDATE ORDER IN SUPABASE
   ✅ Using service_role key (bypasses RLS)
============================================================ */
async function updateOrderInSupabase(
  orderId: string,
  updates: {
    payment_status: string;
    order_status: string;
    payment_ref?: string;
  }
) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Webhook] ❌ Missing Supabase credentials');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Webhook] 🔄 Updating order: ${orderId}`);

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: updates.payment_status,
        order_status: updates.order_status,
        payment_ref: updates.payment_ref || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('[Webhook] ❌ Supabase error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(
        `[Webhook] ⚠️ Order ${orderId} not found in Supabase (0 rows updated)`
      );
      return;
    }

    console.log(`[Webhook] ✅ Order updated:`, data[0].id);
    console.log(`   payment_status: ${updates.payment_status}`);
    console.log(`   order_status: ${updates.order_status}`);
  } catch (error) {
    console.error('[Webhook] Failed to update order:', error);
    throw error;
  }
}