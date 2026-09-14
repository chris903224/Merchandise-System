import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, MapPin, User } from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import { formatPrice, sumCartItems } from '../services';
import type { Order, OrderItem } from '../types';

const PAYMENT_OTC = 'Over the Counter (Cash)';
const PAYMENT_EWALLET = 'GCash / E-Wallet';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { session, cart, placeOrder } = useApp();

  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_OTC);
  const [paymentRef, setPaymentRef] = useState('');
  /** Suppresses the "cart is empty" guard while we redirect to the receipt. */
  const hasPlacedOrder = useRef(false);

  const isEwallet = paymentMethod === PAYMENT_EWALLET;
  const totalAmount = useMemo(() => sumCartItems(cart), [cart]);

  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  // Access guards live in an effect so they never fire during render.
  useEffect(() => {
    if (hasPlacedOrder.current) return;

    if (!session) {
      toast('Please sign in to access checkout.', 'warning');
      navigate('/login', { replace: true });
      return;
    }
    if (cart.length === 0) {
      toast('Your cart is empty.', 'warning');
      navigate('/cart', { replace: true });
    }
  }, [session, cart.length, navigate, toast]);

  if (!session || cart.length === 0) {
    return (
      <main className="page-shell">
        <div className="empty-state">
          <p className="empty-state__title">
            {session ? 'Your cart is empty' : 'Please sign in to continue'}
          </p>
        </div>
      </main>
    );
  }

  const handlePlaceOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEwallet && !paymentRef.trim()) {
      toast('Please provide your GCash reference number.', 'warning');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const orderId = `ORD-${new Date().getFullYear()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

    const items: OrderItem[] = cart.map((item) => ({
      id: item.id,
      name: item.name,
      organization: item.organization,
      price: item.price,
      qty: item.qty,
      size: item.size,
    }));

    const newOrder: Order = {
      id: orderId,
      userId: session.id,
      customerName: String(formData.get('cust-name') ?? '').trim(),
      studentId: String(formData.get('cust-id') ?? '').trim(),
      email: String(formData.get('cust-email') ?? '').trim(),
      phone: String(formData.get('cust-phone') ?? '').trim(),
      items,
      totalAmount,
      paymentMethod,
      paymentRef: paymentRef.trim() || null,
      paymentStatus: isEwallet ? 'Verification Pending' : 'Unpaid (OTC)',
      orderStatus: 'Pending',
      claimLocation: String(formData.get('claim-location') ?? ''),
      claimDate: String(formData.get('claim-date') ?? ''),
      createdAt: new Date().toISOString(),
    };

    hasPlacedOrder.current = true;
    // Records the order, decrements stock and clears the cart in one commit.
    placeOrder(newOrder);
    toast('Reservation placed successfully.', 'success');
    navigate(`/confirmation?id=${encodeURIComponent(orderId)}`, { replace: true });
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <Link to="/cart" className="text-link" style={{ marginBottom: '1rem' }}>
            <ArrowLeft className="react-icon" aria-hidden="true" />
            <span>Back to cart</span>
          </Link>
          <p className="section-kicker">Final review</p>
          <h1 className="page-title">Confirm your reservation</h1>
          <p className="page-description">Add your pickup details and choose how you'll pay at collection.</p>
        </div>
      </header>

      <form className="checkout-layout" onSubmit={handlePlaceOrder}>
        <div className="checkout-sections">
          <section className="checkout-section" aria-labelledby="customer-title">
            <div className="checkout-section__heading">
              <User className="react-icon" aria-hidden="true" />
              <h2 id="customer-title" className="checkout-section__title">Customer details</h2>
            </div>
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="cust-name">Full name</label>
                <input type="text" id="cust-name" name="cust-name" className="field-control" required autoComplete="name" defaultValue={session.name} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cust-id">Student / ID number</label>
                <input type="text" id="cust-id" name="cust-id" className="field-control" required autoComplete="off" defaultValue={session.idNumber || session.id} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cust-email">Email address</label>
                <input type="email" id="cust-email" name="cust-email" className="field-control" required autoComplete="email" defaultValue={session.email} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cust-phone">Contact number</label>
                <input type="tel" id="cust-phone" name="cust-phone" className="field-control" placeholder="0917 000 0000" required autoComplete="tel" />
              </div>
            </div>
          </section>

          <section className="checkout-section" aria-labelledby="pickup-title">
            <div className="checkout-section__heading">
              <MapPin className="react-icon" aria-hidden="true" />
              <h2 id="pickup-title" className="checkout-section__title">On-campus pickup details</h2>
            </div>
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="claim-location">Pickup location</label>
                <select id="claim-location" name="claim-location" className="field-control">
                  <option value="SJCM Supply Office (Main Campus)">SJCM Supply Office (Main Campus)</option>
                  <option value="School Cashier Counter B">School Cashier Counter B</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="claim-date">Target claim date</label>
                <input type="date" id="claim-date" name="claim-date" className="field-control" required min={minDate} defaultValue={minDate} />
                <p className="field__hint">Choose a date from tomorrow onward.</p>
              </div>
            </div>
          </section>

          <section className="checkout-section" aria-labelledby="payment-title">
            <div className="checkout-section__heading">
              <CreditCard className="react-icon" aria-hidden="true" />
              <h2 id="payment-title" className="checkout-section__title">Payment method</h2>
            </div>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={PAYMENT_OTC}
                  checked={paymentMethod === PAYMENT_OTC}
                  onChange={() => setPaymentMethod(PAYMENT_OTC)}
                />
                <span>
                  <span className="payment-option__title">Over the counter (cash)</span>
                  <span className="payment-option__description">Pay directly when you collect your order.</span>
                </span>
              </label>
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={PAYMENT_EWALLET}
                  checked={isEwallet}
                  onChange={() => setPaymentMethod(PAYMENT_EWALLET)}
                />
                <span>
                  <span className="payment-option__title">GCash / e-wallet</span>
                  <span className="payment-option__description">Transfer online and provide the reference number.</span>
                </span>
              </label>
            </div>
            {isEwallet && (
              <div className="ewallet-info">
                <p>
                  Transfer payment to <strong>0917-888-SJCM (Saint Jude Store)</strong>, then enter your reference number.
                </p>
                <div className="field">
                  <label className="field-label" htmlFor="payment-ref">GCash reference number</label>
                  <input
                    type="text"
                    id="payment-ref"
                    className="field-control"
                    placeholder="1002938481"
                    autoComplete="off"
                    value={paymentRef}
                    onChange={(event) => setPaymentRef(event.target.value)}
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="summary-panel" aria-labelledby="checkout-summary-title">
          <h2 id="checkout-summary-title" className="summary-panel__title">Order items</h2>
          <div className="checkout-items">
            {cart.map((item) => (
              <div className="checkout-item" key={`${item.id}-${item.size}`}>
                <div>
                  <p className="checkout-item__name">{item.name}</p>
                  <p className="checkout-item__meta">Size: {item.size || 'N/A'} × {item.qty}</p>
                </div>
                <span className="checkout-item__total">
                  {formatPrice((Number(item.price) || 0) * (Number(item.qty) || 0))}
                </span>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <span>Total payable</span>
            <strong className="summary-total__value">{formatPrice(totalAmount)}</strong>
          </div>
          <button type="submit" className="button button--primary button--block">
            <CheckCircle2 className="react-icon" aria-hidden="true" />
            <span>Confirm &amp; place order</span>
          </button>
        </aside>
      </form>
    </main>
  );
}
