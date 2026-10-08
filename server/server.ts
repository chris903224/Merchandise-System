// app/server/server.ts

/* ============================================
   ✅ LOCAL DEV BACKEND SERVER
   ✅ Para sa local testing ng PayMongo integration
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

if (!PAYMONGO_SECRET_KEY) {
  console.error('❌ PAYMONGO_SECRET_KEY is not set in .env');
  console.error('💡 Please add it to app/.env file');
  process.exit(1);
}

// ✅ Log mode (TEST or LIVE)
console.log(
  `✅ PayMongo Mode: ${
    PAYMONGO_SECRET_KEY.startsWith('sk_test_') ? '🧪 TEST' : '🚀 LIVE'
  }`
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

      // ✅ Validate inputs
      if (!orderId || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid order details' });
      }

      console.log(`[PayMongo] Creating checkout for order: ${orderId}`);
      console.log(`[PayMongo] Amount: ₱${(amount / 100).toFixed(2)}`);

      // ✅ Base64 encode secret key
      const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');

      // ✅ Create PayMongo Checkout Session
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

    // ✅ Base64 encode
    const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');

    // ✅ Fetch checkout session
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

    // ✅ Check status
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
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log('✅ Ready to accept requests');
  console.log('');
});