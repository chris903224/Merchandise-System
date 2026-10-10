// src/services/paymongo.ts

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/* ============================================
   ✅ CREATE CHECKOUT
============================================================ */
export async function createPayMongoCheckout(params: {
  orderId: string;
  amount: number;
  description: string;
  email: string;
  customerName: string;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const url = BACKEND_URL
    ? `${BACKEND_URL}/api/paymongo/create-checkout`
    : '/api/paymongo/create-checkout';

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: params.orderId,
      amount: Math.round(params.amount * 100), // ✅ Convert to centavos
      description: params.description,
      email: params.email,
      customerName: params.customerName,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create PayMongo checkout');
  }

  return response.json();
}

/* ============================================
   ✅ VERIFY PAYMENT
============================================================ */
export async function verifyPayMongoPayment(sessionId: string): Promise<{
  paid: boolean;
  status: string;
}> {
  const url = BACKEND_URL
    ? `${BACKEND_URL}/api/paymongo/verify?session_id=${encodeURIComponent(sessionId)}`
    : `/api/paymongo/verify?session_id=${encodeURIComponent(sessionId)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to verify payment');
  }

  return response.json();
}