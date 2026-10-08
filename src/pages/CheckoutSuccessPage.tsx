// src/pages/CheckoutSuccessPage.tsx

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Loader, XCircle } from 'lucide-react';
import { fetchOrders } from '../services/orders';
import { placeOrder as placeOrderService } from '../services/orders';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');

  const [isVerifying, setIsVerifying] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        console.log('[Success] Order ID:', orderId);
        console.log('[Success] Session ID:', sessionId);

        // ✅ Step 1: Update order status from 'Pending' to 'Paid'
        if (orderId) {
          // Fetch existing orders (localStorage-based)
          const orders = await fetchOrders('');
          const existingOrder = orders.find((o) => o.id === orderId);

          if (existingOrder) {
            // ✅ Update order status
            const updatedOrder = {
              ...existingOrder,
              paymentStatus: 'Paid',
              orderStatus: 'Processing',
              paymentRef: sessionId || existingOrder.paymentRef,
            };

            await placeOrderService(updatedOrder);
            console.log('[Success] Order updated:', orderId);
            setIsPaid(true);
          } else {
            console.warn('[Success] Order not found in DB');
          }
        }
      } catch (error) {
        console.error('[Success] Verify failed:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    void verify();
  }, [orderId, sessionId]);

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-empty">
          {isVerifying ? (
            <>
              <Loader
                className="react-icon"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <h2 className="checkout-empty__title">Verifying payment...</h2>
              <p className="checkout-empty__description">
                Please wait while we confirm your order.
              </p>
            </>
          ) : isPaid ? (
            <>
              <CheckCircle
                className="react-icon"
                style={{ color: 'var(--theme-success)' }}
              />
              <h2 className="checkout-empty__title">
                Payment Successful! ✅
              </h2>
              <p className="checkout-empty__description">
                Your order <strong>{orderId}</strong> has been confirmed.
                You'll receive a confirmation email shortly.
              </p>
              <Link to="/dashboard" className="checkout-empty__cta">
                <Package className="react-icon" />
                <span>View My Orders</span>
              </Link>
            </>
          ) : (
            <>
              <XCircle
                className="react-icon"
                style={{ color: 'var(--theme-warning)' }}
              />
              <h2 className="checkout-empty__title">Verifying...</h2>
              <p className="checkout-empty__description">
                We're still processing your payment. Please check your
                dashboard in a few moments.
              </p>
              <Link to="/dashboard" className="checkout-empty__cta">
                <Package className="react-icon" />
                <span>View My Orders</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}