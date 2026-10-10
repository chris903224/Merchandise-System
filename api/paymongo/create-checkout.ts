// app/api/paymongo/create-checkout.ts

export const config = {
  runtime: 'nodejs',
};

/* ============================================================
   ✅ DYNAMIC BASE URL HELPER
   Priority:
   1. APP_URL env var (validated — hindi localhost sa production)
   2. x-forwarded-proto + x-forwarded-host (Vercel auto-sets)
   3. host header (fallback)
   4. localhost:5173 (last resort)
============================================================ */
function getBaseUrl(req: any): string {
  const appUrl = process.env.APP_URL?.trim();
  const isProduction =
    process.env.VERCEL_ENV === 'production' ||
    process.env.NODE_ENV === 'production';
  const isLocalhostUrl =
    appUrl?.includes('localhost') || appUrl?.includes('127.0.0.1');

  /* ✅ Priority 1: APP_URL — pero hindi kung localhost sa production */
  if (appUrl && !(isProduction && isLocalhostUrl)) {
    return appUrl.replace(/\/$/, '');
  }

  /* ✅ Priority 2: Auto-detect from headers */
  const proto =
    req.headers['x-forwarded-proto'] ||
    (req.headers['x-forwarded-ssl'] === 'on' ? 'https' : 'http');

  const host =
    req.headers['x-forwarded-host'] ||
    req.headers['host'] ||
    'localhost:5173';

  return `${proto}://${host}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { orderId, amount, description, email, customerName } = req.body;

    console.log('[PayMongo] ==================== START ====================');
    console.log('[PayMongo] Order ID:', orderId);
    console.log('[PayMongo] Amount (centavos):', amount);
    console.log('[PayMongo] Description:', description);
    console.log('[PayMongo] Email:', email);
    console.log('[PayMongo] Customer:', customerName);

    if (!orderId || !amount || amount <= 0) {
      console.error('[PayMongo] ❌ Invalid order details');
      return res.status(400).json({ message: 'Invalid order details' });
    }

    const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

    if (!PAYMONGO_SECRET_KEY) {
      console.error('[PayMongo] ❌ Missing PAYMONGO_SECRET_KEY');
      return res
        .status(500)
        .json({ message: 'PayMongo secret key not configured' });
    }

    console.log('[PayMongo] Secret key prefix:', PAYMONGO_SECRET_KEY.substring(0, 8) + '...');
    console.log('[PayMongo] Secret key length:', PAYMONGO_SECRET_KEY.length);

    const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');

    /* ✅ DYNAMIC URLs */
    const baseUrl = getBaseUrl(req);
    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?order_id=${orderId}`;

    console.log('[PayMongo] ==================== URL DETECTION ====================');
    console.log('[PayMongo] Detected Base URL:', baseUrl);
    console.log('[PayMongo] Success URL:', successUrl);
    console.log('[PayMongo] Cancel URL:', cancelUrl);
    console.log('[PayMongo] X-Forwarded-Proto:', req.headers['x-forwarded-proto']);
    console.log('[PayMongo] X-Forwarded-Host:', req.headers['x-forwarded-host']);
    console.log('[PayMongo] Host header:', req.headers['host']);
    console.log('[PayMongo] APP_URL env:', process.env.APP_URL);
    console.log('[PayMongo] VERCEL_ENV:', process.env.VERCEL_ENV);

    const requestPayload = {
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
          payment_method_types: ['gcash', 'paymaya', 'card', 'qrph'],
          success_url: successUrl,
          cancel_url: cancelUrl,
          reference_number: orderId,
          customer_email: email,
          billing: {
            name: customerName,
            email: email,
          },
        },
      },
    };

    /* ✅ Fetch with network error handling */
    let paymongoRes: Response;
    try {
      paymongoRes = await fetch(
        'https://api.paymongo.com/v1/checkout_sessions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify(requestPayload),
        }
      );
    } catch (fetchError: any) {
      console.error('[PayMongo] ❌ Network error:', fetchError.message);
      return res.status(502).json({
        message: 'Cannot reach PayMongo. Please try again.',
        detail: fetchError.message,
      });
    }

    console.log('[PayMongo] Response status:', paymongoRes.status);

    let json: any;
    try {
      json = await paymongoRes.json();
      console.log('[PayMongo] Full response:', JSON.stringify(json, null, 2));
    } catch (parseError: any) {
      console.error('[PayMongo] ❌ Failed to parse JSON:', parseError.message);
      const text = await paymongoRes.text().catch(() => 'no text');
      return res.status(500).json({
        message: 'Invalid JSON response from PayMongo',
        raw: text,
      });
    }

    if (!paymongoRes.ok) {
      console.error('[PayMongo] ❌ API Error');
      console.error('[PayMongo] Error code:', json?.errors?.[0]?.code);
      console.error('[PayMongo] Error detail:', json?.errors?.[0]?.detail);

      return res.status(paymongoRes.status).json({
        message: json.errors?.[0]?.detail || 'PayMongo checkout failed',
        code: json.errors?.[0]?.code,
        /* ✅ Only include fullError sa development */
        ...(process.env.NODE_ENV === 'development' && { fullError: json }),
      });
    }

    console.log('[PayMongo] ✅ Checkout session created:', json.data.id);
    console.log('[PayMongo] ✅ Checkout URL:', json.data.attributes.checkout_url);

    return res.status(200).json({
      checkoutUrl: json.data.attributes.checkout_url,
      sessionId: json.data.id,
    });
  } catch (error: any) {
    console.error('[PayMongo] ❌ Server error:', error);
    console.error('[PayMongo] Error stack:', error.stack);
    return res.status(500).json({
      message: error.message,
      stack:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}