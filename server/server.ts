// app/server/server.ts

/* ============================================
   ✅ LOCAL DEV BACKEND SERVER
   ✅ Para sa local testing ng PayMongo + Brevo
   ✅ Ito ay TULAD ng Vercel serverless functions,
      pero tumatakbo sa localhost:3001
============================================================ */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// ✅ Load environment variables from .env
dotenv.config();

const app = express();

/* ============================================
   ✅ MIDDLEWARE
   ============================================ */
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://merchandise-system.vercel.app',
      process.env.FRONTEND_URL || '',
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());

/* ============================================
   ✅ ENV VARIABLES
   ============================================ */
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'SJCM Store';

if (!PAYMONGO_SECRET_KEY) {
  console.error('❌ PAYMONGO_SECRET_KEY is not set in .env');
  console.error('💡 Please add it to app/.env file');
  process.exit(1);
}

// ✅ Log modes
console.log(
  `✅ PayMongo Mode: ${
    PAYMONGO_SECRET_KEY.startsWith('sk_test_') ? '🧪 TEST' : '🚀 LIVE'
  }`
);
console.log(
  `✅ Brevo: ${BREVO_API_KEY ? '✅ Configured' : '❌ Missing BREVO_API_KEY'}`
);

/* ============================================
   ✅ HEALTH CHECK
   ============================================ */
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'SJCM Store Backend is running',
    paymongoMode: PAYMONGO_SECRET_KEY.startsWith('sk_test_')
      ? 'test'
      : 'live',
    brevoConfigured: !!BREVO_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

/* ============================================
   ✅ POST /api/paymongo/create-checkout
   ✅ Gumagawa ng PayMongo Checkout Session
============================================================ */
app.post(
  '/api/paymongo/create-checkout',
  async (req: Request, res: Response) => {
    try {
      const { orderId, amount, description, email, customerName } = req.body;

      if (!orderId || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid order details' });
      }

      console.log(`[PayMongo] Creating checkout for order: ${orderId}`);
      console.log(`[PayMongo] Amount: ₱${(amount / 100).toFixed(2)}`);

      const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');

      const paymongoRes = await fetch(
        `${PAYMONGO_BASE_URL}/checkout_sessions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            data: {
              attributes: {
                send_email_receipt: true,
                show_description: true,
                show_line_items: true,
                description: description,
                line_items: [
                  {
                    currency: 'PHP',
                    amount: amount,
                    name: description,
                    quantity: 1,
                  },
                ],
                payment_method_types: [
                  'gcash',
                  'paymaya',
                  'card',
                  'qrph',
                ],
                success_url: `${process.env.SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
                cancel_url: `${process.env.CANCEL_URL}?order_id=${orderId}`,
                reference_number: orderId,
                customer_email: email,
                billing: {
                  name: customerName,
                  email: email,
                },
              },
            },
          }),
        }
      );

      const json: any = await paymongoRes.json();

      if (!paymongoRes.ok) {
        console.error('[PayMongo] API Error:', JSON.stringify(json, null, 2));
        return res.status(paymongoRes.status).json({
          message: json.errors?.[0]?.detail || 'PayMongo checkout failed',
        });
      }

      console.log(`✅ Checkout session created: ${json.data.id}`);

      return res.status(200).json({
        checkoutUrl: json.data.attributes.checkout_url,
        sessionId: json.data.id,
      });
    } catch (error: any) {
      console.error('[PayMongo] Server error:', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

/* ============================================
   ✅ GET /api/paymongo/verify
   ✅ Verify payment status
============================================================ */
app.get('/api/paymongo/verify', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ message: 'Missing session_id' });
    }

    console.log(`[PayMongo] Verifying session: ${session_id}`);

    const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');

    const paymongoRes = await fetch(
      `${PAYMONGO_BASE_URL}/checkout_sessions/${session_id}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const json: any = await paymongoRes.json();

    if (!paymongoRes.ok) {
      console.error('[PayMongo] Verify error:', json);
      return res.status(paymongoRes.status).json({
        message: json.errors?.[0]?.detail || 'Verification failed',
      });
    }

    const paymentStatus =
      json.data.attributes.payment_intent?.attributes?.status;
    const paid = paymentStatus === 'succeeded';

    console.log(`[PayMongo] Session ${session_id}: ${paymentStatus}`);

    return res.status(200).json({
      paid,
      status: paymentStatus || 'pending',
    });
  } catch (error: any) {
    console.error('[PayMongo] Verify error:', error);
    return res.status(500).json({ message: error.message });
  }
});

/* ============================================
   ✅ BREVO — Order Notification Emails
   ✅ Free 300 emails/day
   ✅ Sends to ANY recipient (no domain verification needed)
============================================================ */

type EmailPayload = {
  orderId: string;
  orderCode: string;
  userId: string;
  email: string;
  customerName: string;
  template: string;
  previousStatus?: string;
  newStatus: string;
  claimLocation?: string;
};

/* ✅ Template renderer */
function renderEmail(
  template: string,
  data: EmailPayload
): { subject: string; html: string } {
  const { orderCode, customerName, claimLocation } = data;

  const templates: Record<string, { subject: string; html: string }> = {
    order_confirmed: {
      subject: `✅ Order Confirmed — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> has been received and is now pending.</p>
          <p>We'll notify you once it's ready for pickup.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
    order_processing: {
      subject: `⏳ Order Being Processed — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> is now being processed.</p>
          <p>We'll notify you once it's ready.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
    order_ready_pickup: {
      subject: `📦 Ready for Pickup — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> is now ready for pickup!</p>
          <p><strong>Pickup Location:</strong> ${claimLocation || 'SJCM Supply Office'}</p>
          <p>Please bring a valid school ID.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
    order_out_for_delivery: {
      subject: `🚚 Out for Delivery — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> is now out for delivery.</p>
          <p><strong>Delivery to:</strong> ${claimLocation || 'Your registered address'}</p>
          <p>Please be available to receive it.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
    order_completed: {
      subject: `✨ Order Completed — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> is now complete. Thank you!</p>
          <p>We hope to serve you again soon.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
    order_cancelled: {
      subject: `❌ Order Cancelled — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> has been cancelled.</p>
          <p>If you have questions, please contact the supply office.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
  };

  return templates[template] ?? {
    subject: `Order Update — ${orderCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hi ${customerName},</h2>
        <p>Your order status has been updated.</p>
        <p>— SJCM Store Team</p>
      </div>
    `,
  };
}

app.post(
  '/api/notifications/send-order-email',
  async (req: Request, res: Response) => {
    try {
      const payload: EmailPayload = req.body;

      console.log('[Email API] Received:', {
        orderCode: payload.orderCode,
        template: payload.template,
        to: payload.email,
      });

      /* ✅ Validate */
      if (!payload.email || !payload.template || !payload.orderCode) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
        console.error('[Email API] ❌ Missing Brevo config');
        return res
          .status(500)
          .json({ message: 'Email service not configured' });
      }

      /* ✅ Render template */
      const { subject, html } = renderEmail(payload.template, payload);

      /* ✅ Send via Brevo */
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: BREVO_SENDER_EMAIL,
            name: BREVO_SENDER_NAME,
          },
          to: [
            {
              email: payload.email,
              name: payload.customerName,
            },
          ],
          subject,
          htmlContent: html,
        }),
      });

      const json: any = await brevoRes.json();

      if (!brevoRes.ok) {
        console.error('[Email API] ❌ Brevo error:', json);
        return res.status(brevoRes.status).json({
          message: json.message || 'Email send failed',
        });
      }

      console.log('[Email API] ✅ Sent via Brevo:', json.messageId);
      return res.status(200).json({ success: true, id: json.messageId });
    } catch (error: any) {
      console.error('[Email API] ❌ Error:', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

/* ============================================
   ✅ ERROR HANDLER
   ============================================ */
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[Server Error]', err);
  res.status(500).json({ message: 'Internal server error' });
});

/* ============================================
   ✅ 404 HANDLER
   ============================================ */
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.path}` });
});

/* ============================================
   ✅ START SERVER
   ============================================ */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  🚀 SJCM Store Backend Server              ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  Port:      http://localhost:${PORT}         ║`);
  console.log(`║  Frontend:  ${process.env.FRONTEND_URL || 'http://localhost:5173'}  ║`);
  console.log(`║  PayMongo:  ${
    PAYMONGO_SECRET_KEY.startsWith('sk_test_') ? 'TEST Mode 🧪' : 'LIVE Mode 🚀     '
  }           ║`);
  console.log(`║  Brevo:     ${
    BREVO_API_KEY ? '✅ Configured   ' : '❌ Missing      '
  }           ║`);
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log('✅ Ready to accept requests');
  console.log('');
});