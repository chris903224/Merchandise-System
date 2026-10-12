// src/pages/CheckoutCancelPage.tsx

import { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useApp } from '../store';

/* ============================================
   ✅ CHECKOUT CANCEL PAGE
   - I-restore ang cart mula sa backup
   - Cleanup pending keys (legacy)
   - Redirect user back to cart or catalog
============================================================ */

export default function CheckoutCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');

  // ✅ IDAGDAG — para ma-restore ang cart
  const { setCart } = useApp();

  useEffect(() => {
    /* ✅ I-RESTORE ANG CART MULA SA BACKUP */
    const backup = sessionStorage.getItem('cartBackup');
    if (backup) {
      try {
        setCart(JSON.parse(backup));
        console.log('[Cancel] ✅ Cart restored from backup');
      } catch (e) {
        console.error('[Cancel] Failed to restore cart:', e);
      }
      sessionStorage.removeItem('cartBackup');
      sessionStorage.removeItem('backupOrderId');
    } else {
      console.log('[Cancel] No cartBackup found — nothing to restore');
    }

    /* ✅ Cleanup legacy pending keys (kung may natira) */
    sessionStorage.removeItem('pendingOrder');
    sessionStorage.removeItem('pendingCart');
    sessionStorage.removeItem('pendingOrderId');
  }, [setCart]);

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
            Order {orderId || ''} was not completed.
            Your cart has been restored.
          </p>
          <p className="checkout-cancel__hint">
            You can try again or continue shopping.
          </p>

          <div className="checkout-cancel__actions">
            <button
              type="button"
              className="button button--primary button--pill"
              onClick={() => navigate('/cart')}
            >
              <ArrowLeft className="react-icon" aria-hidden="true" />
              <span>Back to Cart</span>
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