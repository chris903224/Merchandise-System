// src/pages/CheckoutCancelPage.tsx

import { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingBag } from 'lucide-react';

/* ============================================
   ✅ CHECKOUT CANCEL PAGE
   - Cleans up pending order from sessionStorage
   - Shows cancel state
   - Redirects user back to checkout or catalog
============================================================ */

export default function CheckoutCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    /* ✅ Cleanup sessionStorage — walang naka-save sa DB kaya safe lang */
    sessionStorage.removeItem('pendingOrder');
    sessionStorage.removeItem('pendingCart');
    sessionStorage.removeItem('pendingOrderId');
  }, []);

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-cancel">
          <XCircle
            className="react-icon checkout-cancel__icon"
            aria-hidden="true"
          />
          <h1 className="checkout-cancel__title">Payment Cancelled</h1>
          <p className="checkout-cancel__desc">
            Order {orderId || ''} was not completed. Your cart is still saved.
          </p>
          <p className="checkout-cancel__hint">
            You can try again or continue shopping.
          </p>

          <div className="checkout-cancel__actions">
            <button
              type="button"
              className="button button--primary button--pill"
              onClick={() => navigate('/checkout')}
            >
              <ArrowLeft className="react-icon" aria-hidden="true" />
              <span>Try Again</span>
            </button>

            <Link
              to="/catalog"
              className="button button--secondary button--pill"
            >
              <ShoppingBag className="react-icon" aria-hidden="true" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}