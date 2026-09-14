import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, MapPin, Printer } from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import {
  formatDate,
  formatPrice,
  getOrderClaimDate,
  getOrderCustomerName,
  getOrderDate,
  getOrderEmail,
  getOrderId,
  getOrderStatus,
  getOrderStatusBadge,
  getOrderStudentId,
  getOrderTotal,
} from '../services';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { session, orders } = useApp();

  useEffect(() => {
    if (!session) {
      toast('Please sign in to view order details.', 'warning');
      const timer = window.setTimeout(() => navigate('/login', { replace: true }), 500);
      return () => window.clearTimeout(timer);
    }
  }, [session, navigate, toast]);

  if (!session) {
    return (
      <main className="page-shell page-shell--narrow">
        <div className="empty-state">
          <p className="empty-state__title">Please sign in to continue</p>
        </div>
      </main>
    );
  }

  const order = orders.find((candidate) => getOrderId(candidate) === id);

  if (!order || order.userId !== session.id) {
    return (
      <main className="page-shell page-shell--narrow">
        <Link to="/dashboard" className="text-link print-hidden" style={{ marginBottom: '1.25rem' }}>
          <ArrowLeft className="react-icon" aria-hidden="true" />
          <span>Back to dashboard</span>
        </Link>
        <div className="empty-state">
          <AlertCircle className="react-icon" aria-hidden="true" />
          <h2 className="empty-state__title">Order not found</h2>
          <p className="empty-state__description">
            The specified reservation does not exist or is not part of your account.
          </p>
          <Link to="/dashboard" className="button button--primary">Return to dashboard</Link>
        </div>
      </main>
    );
  }

  const badge = getOrderStatusBadge(getOrderStatus(order));
  const items = order.items ?? [];

  return (
    <main className="page-shell page-shell--narrow">
      <Link to="/dashboard" className="text-link print-hidden" style={{ marginBottom: '1.25rem' }}>
        <ArrowLeft className="react-icon" aria-hidden="true" />
        <span>Back to dashboard</span>
      </Link>

      <div className="order-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <h1 className="order-id">{getOrderId(order)}</h1>
            <span className={badge.className}>{badge.text}</span>
          </div>
          <p className="order-header__date">Reserved on {formatDate(getOrderDate(order))}</p>
        </div>
        <button type="button" className="button button--secondary print-hidden" onClick={() => window.print()}>
          <Printer className="react-icon" aria-hidden="true" />
          <span>Print receipt</span>
        </button>
      </div>

      <div className="order-layout">
        <div className="order-items">
          <section className="panel panel--raised" style={{ padding: '1.25rem' }}>
            <h2 className="summary-box__title">Reserved merchandise</h2>
            <div>
              {items.map((item) => (
                <div className="order-item" key={`${item.id}-${item.size}`}>
                  <div>
                    <p className="order-item__name">{item.name}</p>
                    <p className="order-item__meta">
                      <span>Org: {item.organization || 'General'}</span>
                      <span>Size: {item.size || 'N/A'}</span>
                      <span>Qty: {Number(item.qty) || 0}</span>
                    </p>
                  </div>
                  <span className="order-item__price">
                    {formatPrice((Number(item.price) || 0) * (Number(item.qty) || 0))}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel panel--raised" style={{ padding: '1.25rem' }}>
            <h2 className="summary-box__title">Claiming instructions</h2>
            <p className="page-description">
              Present this receipt together with your SJCM Student or Employee ID at the campus merchandise counter.
            </p>
            <div className="instruction-callout" style={{ marginTop: '1rem' }}>
              <MapPin className="react-icon" aria-hidden="true" />
              <span>
                Pickup at <strong>{order.claimLocation || 'SJCM Main Campus - Finance & Property Office'}</strong>
                <br />
                Monday – Friday · 8:00 AM – 4:00 PM
              </span>
            </div>
          </section>
        </div>

        <aside className="order-sidebar">
          <section className="payment-summary">
            <h2 className="summary-box__title">Payment summary</h2>
            <div className="summary-box__line">
              <span>Payment method</span>
              <strong>{order.paymentMethod || '—'}</strong>
            </div>
            <div className="summary-box__line">
              <span>Claiming date</span>
              <strong>{formatDate(getOrderClaimDate(order))}</strong>
            </div>
            <div className="summary-box__total">
              <span>Total due</span>
              <span className="summary-total__value">{formatPrice(getOrderTotal(order))}</span>
            </div>
          </section>

          <section className="customer-summary">
            <h2 className="summary-box__title">Customer information</h2>
            <div className="summary-box__line">
              <span>Name</span>
              <strong>{getOrderCustomerName(order)}</strong>
            </div>
            <div className="summary-box__line">
              <span>ID number</span>
              <strong>{getOrderStudentId(order)}</strong>
            </div>
            <div className="summary-box__line">
              <span>Email</span>
              <strong>{getOrderEmail(order)}</strong>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
