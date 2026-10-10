// app/api/paymongo/verify.ts

/* ============================================
   ✅ VERCEL SERVERLESS FUNCTION
   ✅ GET /api/paymongo/verify?session_id=xxx
   ✅ I-verify kung bayad na ang session
============================================================ */

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ message: 'Missing session_id' });
    }

    const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

    if (!PAYMONGO_SECRET_KEY) {
      console.error('[PayMongo] Missing PAYMONGO_SECRET_KEY');
      return res
        .status(500)
        .json({ message: 'PayMongo secret key not configured' });
    }

    // ✅ Base64 encode
    const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');

    // ✅ Fetch checkout session status
    const paymongoRes = await fetch(
      `https://api.paymongo.com/v1/checkout_sessions/${session_id}`,
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

    // ✅ Check payment status
    const paymentStatus =
      json.data.attributes.payment_intent?.attributes?.status;
    const paid = paymentStatus === 'succeeded';

    console.log(`✅ Session ${session_id}: ${paymentStatus}`);

    return res.status(200).json({
      paid,
      status: paymentStatus || 'pending',
    });
  } catch (error: any) {
    console.error('[PayMongo] Verify error:', error);
    return res.status(500).json({ message: error.message });
  }
}