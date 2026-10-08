// app/api/paymongo/create-checkout.ts

/* ============================================
   ✅ VERCEL SERVERLESS FUNCTION
   ✅ POST /api/paymongo/create-checkout
   ✅ Gumagawa ng PayMongo Checkout Session
   ✅ Safe ang SECRET key dito (naka-hide sa Vercel env)
============================================================ */

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { orderId, amount, description, email, customerName } = req.body;

    // ✅ Validate inputs
    if (!orderId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid order details' });
    }

    const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

    if (!PAYMONGO_SECRET_KEY) {
      console.error('[PayMongo] Missing PAYMONGO_SECRET_KEY');
      return res
        .status(500)
        .json({ message: 'PayMongo secret key not configured' });
    }

    // ✅ Base64 encode secret key for Basic Auth
    const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');

    // ✅ Create PayMongo Checkout Session
    const paymongoRes = await fetch(
      'https://api.paymongo.com/v1/checkout_sessions',
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
                  amount: amount, // ✅ amount is in centavos
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
      console.error('[PayMongo] API Error:', json);
      return res.status(paymongoRes.status).json({
        message: json.errors?.[0]?.detail || 'PayMongo checkout failed',
      });
    }

    console.log(`✅ PayMongo checkout created: ${orderId}`);

    return res.status(200).json({
      checkoutUrl: json.data.attributes.checkout_url,
      sessionId: json.data.id,
    });
  } catch (error: any) {
    console.error('[PayMongo] Server error:', error);
    return res.status(500).json({ message: error.message });
  }
}