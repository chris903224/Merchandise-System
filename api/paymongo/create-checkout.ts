// app/api/paymongo/create-checkout.ts

/* ============================================
   ✅ VERCEL SERVERLESS FUNCTION
   ✅ POST /api/paymongo/create-checkout
   ✅ Gumagawa ng PayMongo Checkout Session
   ✅ Safe ang SECRET key dito (naka-hide sa Vercel env)
   ✅ Dynamic base URL — auto-detect localhost AND Vercel
   ✅ With DEBUG logs for troubleshooting
============================================================ */

export const config = {
  runtime: 'nodejs',
};

/* ============================================================
   ✅ DYNAMIC BASE URL HELPER
   Auto-detect kung localhost o Vercel based sa request headers.
   
   Priority order:
   1. APP_URL env var (explicit override kung meron)
   2. x-forwarded-proto + x-forwarded-host (Vercel auto-sets)
   3. host header (fallback)
   4. localhost:5173 (last resort)
============================================================ */
function getBaseUrl(req: any): string {
  // 1️⃣ Priority: APP_URL env var (para sa explicit control)
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    return process.env.APP_URL.trim().replace(/\/$/, ''); // strip trailing slash
  }

  // 2️⃣ Auto-detect from request headers (Vercel sets these)
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

    console.log('[PayMongo] ==================== START ====================');
    console.log('[PayMongo] Order ID:', orderId);
    console.log('[PayMongo] Amount (centavos):', amount);
    console.log('[PayMongo] Description:', description);
    console.log('[PayMongo] Email:', email);
    console.log('[PayMongo] Customer:', customerName);

    // ✅ Validate inputs
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

    // ✅ DEBUG: Log secret key info (NOT the actual key!)
    console.log('[PayMongo] ==================== AUTH DEBUG ====================');
    console.log(
      '[PayMongo] Secret key prefix:',
      PAYMONGO_SECRET_KEY.substring(0, 8) + '...'
    );
    console.log('[PayMongo] Secret key length:', PAYMONGO_SECRET_KEY.length);
    console.log(
      '[PayMongo] Secret key has spaces:',
      PAYMONGO_SECRET_KEY.includes(' ')
    );
    console.log(
      '[PayMongo] Secret key has quotes:',
      PAYMONGO_SECRET_KEY.includes('"') || PAYMONGO_SECRET_KEY.includes("'")
    );

    // ✅ Base64 encode secret key for Basic Auth
    const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
    console.log(
      '[PayMongo] Auth header (first 20):',
      auth.substring(0, 20) + '...'
    );

    /* ============================================
       ✅ DYNAMIC URLs — hindi na hardcoded
       Auto-adapt sa localhost AND production
    ============================================ */
    const baseUrl = getBaseUrl(req);
    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?order_id=${orderId}`;

    console.log('[PayMongo] ==================== URL DETECTION ====================');
    console.log('[PayMongo] Detected Base URL:', baseUrl);
    console.log('[PayMongo] Success URL:', successUrl);
    console.log('[PayMongo] Cancel URL:', cancelUrl);
    console.log(
      '[PayMongo] X-Forwarded-Proto:',
      req.headers['x-forwarded-proto']
    );
    console.log(
      '[PayMongo] X-Forwarded-Host:',
      req.headers['x-forwarded-host']
    );
    console.log('[PayMongo] Host header:', req.headers['host']);
    console.log('[PayMongo] APP_URL env:', process.env.APP_URL);

    // ✅ Build the request payload
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
          success_url: successUrl,   // ✅ dynamic
          cancel_url: cancelUrl,     // ✅ dynamic
          reference_number: orderId,
          customer_email: email,
          billing: {
            name: customerName,
            email: email,
          },
        },
      },
    };

    console.log('[PayMongo] ==================== REQUEST ====================');
    console.log('[PayMongo] URL: https://api.paymongo.com/v1/checkout_sessions');
    console.log('[PayMongo] Method: POST');

    // ✅ Create PayMongo Checkout Session
    const paymongoRes = await fetch(
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

    // ✅ DEBUG: Log response info
    console.log('[PayMongo] ==================== RESPONSE ====================');
    console.log('[PayMongo] Response status:', paymongoRes.status);
    console.log('[PayMongo] Response statusText:', paymongoRes.statusText);
    console.log('[PayMongo] Response URL:', paymongoRes.url);
    console.log('[PayMongo] Response type:', paymongoRes.type);
    console.log('[PayMongo] Response ok:', paymongoRes.ok);

    // ✅ Parse JSON response
    let json: any;
    try {
      json = await paymongoRes.json();
      console.log(
        '[PayMongo] Full response:',
        JSON.stringify(json, null, 2)
      );
    } catch (parseError: any) {
      console.error(
        '[PayMongo] ❌ Failed to parse JSON:',
        parseError.message
      );
      const text = await paymongoRes.text().catch(() => 'no text');
      console.error('[PayMongo] Raw response text:', text);
      return res.status(500).json({
        message: 'Invalid JSON response from PayMongo',
        raw: text,
      });
    }

    // ✅ Handle error responses
    if (!paymongoRes.ok) {
      console.error('[PayMongo] ❌ API Error');
      console.error('[PayMongo] Error code:', json?.errors?.[0]?.code);
      console.error('[PayMongo] Error detail:', json?.errors?.[0]?.detail);

      return res.status(paymongoRes.status).json({
        message:
          json.errors?.[0]?.detail || 'PayMongo checkout failed',
        code: json.errors?.[0]?.code,
        fullError: json,
      });
    }

    // ✅ Success
    console.log('[PayMongo] ✅ Checkout session created:', json.data.id);
    console.log(
      '[PayMongo] ✅ Checkout URL:',
      json.data.attributes.checkout_url
    );
    console.log('[PayMongo] ==================== END ====================');

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