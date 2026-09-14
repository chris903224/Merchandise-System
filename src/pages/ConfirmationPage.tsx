import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Printer } from 'lucide-react';
import { useOrders } from '../store';
import {
  formatDate,
  formatPrice,
  getOrderClaimDate,
  getOrderCustomerName,
  getOrderEmail,
  getOrderId,
  getOrderStatus,
  getOrderStatusBadge,
  getOrderStudentId,
  getOrderTotal,
} from '../services';

export default function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orders = useOrders();
  const orderId = searchParams.get('id') ?? '';
  const order = orders.find((candidate) => getOrderId(candidate) === orderId);

  if (!order) {
    return (
      <main className="page-shell page-shell--receipt">
        <div className="empty-state">
          <AlertTriangle className="react-icon" aria-hidden="true" />
          <h1 className="empty-state__title">Order record not found</h1>
          <p className="empty-state__description">We couldn't retrieve the specified receipt reference.</p>
          <Link to="/catalog" className="button button--primary">Return to catalog</Link>
        </div>
      </main>
    );
  }

  const badge = getOrderStatusBadge(getOrderStatus(order));

  return (
    <main className="page-shell page-shell--receipt">
      <article className="receipt-card">
        <header className="receipt-header">
          <div className="receipt-header__icon">
            <CheckCircle2 className="react-icon" aria-hidden="true" />
          </div>
          <h1 className="receipt-title">Reservation placed</h1>
          <p className="receipt-reference">
            Reference number: <strong>{getOrderId(order)}</strong>
          </p>
        </header>

        <div className="receipt-summary">
          <div className="receipt-summary__item">
            <span className="receipt-summary__label">Order status</span>
            <span className="receipt-summary__value">
              <span className={badge.className}>{badge.text}</span>
            </span>
          </div>
          <div className="receipt-summary__item">
            <span className="receipt-summary__label">Payment</span>
            <span className="receipt-summary__value">{order.paymentMethod || '—'}</span>
          </div>
          <div className="receipt-summary__item">
            <span className="receipt-summary__label">Claim date</span>
            <span className="receipt-summary__value">{formatDate(getOrderClaimDate(order))}</span>
          </div>
          <div className="receipt-summary__item">
            <span className="receipt-summary__label">Total</span>
            <span className="receipt-summary__value">{formatPrice(getOrderTotal(order))}</span>
          </div>
        </div>

        <section className="receipt-section">
          <h2 className="receipt-section__title">Pickup information</h2>
          <div className="receipt-info-grid">
            <p>Recipient: <strong>{getOrderCustomerName(order)}</strong></p>
            <p>Student ID: <strong>{getOrderStudentId(order)}</strong></p>
            <p>Claim venue: <strong>{order.claimLocation || 'SJCM Supply Office (Main Campus)'}</strong></p>
            <p>Contact: <strong>{order.phone || '—'} · {getOrderEmail(order)}</strong></p>
          </div>
        </section>

        <section className="receipt-section">
          <h2 className="receipt-section__title">Reserved items</h2>
          <div>
            {(order.items ?? []).map((item) => (
              <div className="receipt-line-item" key={`${item.id}-${item.size}`}>
                <div>
                  <p className="receipt-line-item__name">{item.name}</p>
                  <p className="receipt-line-item__meta">
                    Variant: {item.size || 'N/A'} · Qty: {Number(item.qty) || 0}
                  </p>
                </div>
                <span className="receipt-line-item__price">
                  {formatPrice((Number(item.price) || 0) * (Number(item.qty) || 0))}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="receipt-actions print-hidden">
          <button type="button" className="button button--secondary" onClick={() => window.print()}>
            <Printer className="react-icon" aria-hidden="true" />
            <span>Print receipt</span>
          </button>
          <Link to="/dashboard" className="button button--primary">
            <span>View dashboard</span>
            <ArrowRight className="react-icon" aria-hidden="true" />
          </Link>
        </div>
      </article>
    </main>
  );
}
