// src/pages/CheckoutSuccessPage.tsx

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Loader, XCircle } from 'lucide-react';
import { fetchOrderById, placeOrder, updateOrderStatus } from '../services/orders';
import { useApp } from '../store';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId =
    searchParams.get('order_id') ||
    searchParams.get('ref') ||
    searchParams.get('reference');
  const sessionId = searchParams.get('session_id');

  const [isVerifying, setIsVerifying] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

  // ✅ IDAGDAG — para ma-clear ang cart
  const { setCart } = useApp();

  useEffect(() => {
    const verify = async () => {
      try {
        console.log('[Success] Order ID:', orderId);
        console.log('[Success] Session ID:', sessionId);

        if (!orderId) {
          console.warn('[Success] Walang order_id sa URL');
          setIsVerifying(false);
          return;
        }

        // ✅ Hanapin ang existing order sa Supabase via ID
        const existingOrder = await fetchOrderById(orderId);

        if (existingOrder) {
          console.log('[Success] Order found:', existingOrder.id);
          console.log('[Success] Current status:', existingOrder.orderStatus);

          // ✅ Update order — maging 'Paid' at 'Processing'
          const updatedOrder = {
            ...existingOrder,
            paymentStatus: 'Paid',
            orderStatus: 'Processing',
            paymentRef: sessionId || existingOrder.paymentRef,
          };

          await placeOrder(updatedOrder);
          console.log('[Success] ✅ Order updated to Paid:', orderId);

          // ✅ I-CLEAR ANG CART — dito safe na kasi bayad na
          setCart([]);
          console.log('[Success] ✅ Cart cleared!');

          // ✅ Trigger notification
          try {
            await updateOrderStatus(orderId, 'Processing');
          } catch (err) {
            console.warn('[Success] Notification trigger failed:', err);
          }

          setIsPaid(true);
        } else {
          console.warn('[Success] ❌ Order not found:', orderId);
          setIsPaid(false);
        }
      } catch (error) {
        console.error('[Success] Verify failed:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    void verify();
  }, [orderId, sessionId, setCart]);   // ✅ IDAGDAG ang setCart sa deps

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