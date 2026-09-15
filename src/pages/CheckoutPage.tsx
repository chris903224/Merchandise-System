// src/pages/CheckoutPage.tsx

import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  User,
  Mail,
  Phone,
  ShoppingBag,
  ShieldCheck,
  Check,
  Store,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import { formatPrice, isStaffRole, sumCartItems } from '../services';

type PaymentMethod = 'ewallet' | 'cod' | 'cash_pickup' | 'bank';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { session, cart, placeOrder } = useApp();

  // Form state
  const [fullName, setFullName] = useState(session?.name || '');
  const [email, setEmail] = useState(session?.email || '');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState(session?.idNumber || '');
  const [organization, setOrganization] = useState(session?.organization || 'SJCM General');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('ewallet');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = useMemo(() => sumCartItems(cart), [cart]);
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cart],
  );

  if (!session) {
    navigate('/login');
    return null;
  }

  if (cart.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty">
            <ShoppingBag className="react-icon" aria-hidden="true" />
            <h2 className="checkout-empty__title">Your cart is empty</h2>
            <p className="checkout-empty__description">
              Add items to your cart before proceeding to checkout.
            </p>
            <Link to="/catalog" className="checkout-empty__cta">
              <Store className="react-icon" aria-hidden="true" />
              <span>Browse Catalog</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast('Please enter your full name.', 'warning');
      return;
    }
    if (!email.trim()) {
      toast('Please enter your email.', 'warning');
      return;
    }
    if (!phone.trim()) {
      toast('Please enter your phone number.', 'warning');
      return;
    }
    if (isStaffRole(session.role)) {
      toast('Staff and admin accounts cannot place customer orders.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = `SJCM-${Date.now()}`;

      // Buuin yung Order object — i-adjust kung iba yung Order type mo
      const newOrder = {
        id: orderId,
        userId: session.id,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          qty: Number(item.qty) || 0,
          size: item.size || 'N/A',
          organization: item.organization || '',
        })),
        total: subtotal,
        orderStatus: 'Pending',
        createdAt: new Date().toISOString(),
        paymentMethod:
          payment === 'ewallet'
            ? 'E-Wallet'
            : payment === 'cod'
            ? 'Cash on Delivery'
            : payment === 'bank'
            ? 'Bank Transfer'
            : 'Cash on Pickup',
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        studentId,
        organization,
        notes,
        pickupDate,
        pickupTime,
      } as const;

      // placeOrder handles: append to orders, decrement stock, clear cart
      placeOrder(newOrder as any);

      toast('Order placed successfully!', 'success');
      navigate('/confirmation', { state: { order: newOrder } });
    } catch (error) {
      console.error('Checkout error:', error);
      toast('Checkout failed. Please try again.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        {/* HERO */}
        <header className="checkout-hero">
          <Link to="/cart" className="checkout-hero__back">
            <ArrowLeft className="react-icon" aria-hidden="true" />
            <span>Back to Cart</span>
          </Link>
          <div className="checkout-hero__body">
            <div className="checkout-hero__copy">
              <p className="checkout-hero__kicker">SJCM Store</p>
              <h1 className="checkout-hero__title">Checkout</h1>
              <p className="checkout-hero__description">
                Complete your reservation details and place your order.
              </p>
            </div>
            <div className="checkout-hero__quote">
              <span>"Reserve online,</span>
              <span>pick up on campus"</span>
            </div>
          </div>
        </header>

        {/* FORM */}
        <form className="checkout-body" onSubmit={handleSubmit}>
          {/* LEFT: form sections */}
          <div className="checkout-main">
            {/* Contact */}
            <section className="checkout-section">
              <header className="checkout-section__header">
                <span className="checkout-section__icon">
                  <User className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="checkout-section__title">Contact Information</h2>
                  <p className="checkout-section__subtitle">
                    We'll use this to contact you about your order.
                  </p>
                </div>
              </header>

              <div className="checkout-grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="co-name">
                    Full Name
                  </label>
                  <input
                    id="co-name"
                    className="field__input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan dela Cruz"
                    required
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="co-student-id">
                    Student ID
                  </label>
                  <input
                    id="co-student-id"
                    className="field__input"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="06-2526-004945"
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="co-email">
                    Email
                  </label>
                  <div className="field__icon-wrap">
                    <Mail className="react-icon" aria-hidden="true" />
                    <input
                      id="co-email"
                      className="field__input field__input--icon"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@phinmaed.com"
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="co-phone">
                    Phone Number
                  </label>
                  <div className="field__icon-wrap">
                    <Phone className="react-icon" aria-hidden="true" />
                    <input
                      id="co-phone"
                      className="field__input field__input--icon"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09XX XXX XXXX"
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="co-org">
                    Organization
                  </label>
                  <input
                    id="co-org"
                    className="field__input"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Supreme Student Council"
                  />
                </div>
              </div>
            </section>

            {/* Pickup Schedule */}
            <section className="checkout-section">
              <header className="checkout-section__header">
                <span className="checkout-section__icon">
                  <MapPin className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="checkout-section__title">Pickup Schedule</h2>
                  <p className="checkout-section__subtitle">
                    Choose when you'd like to pick up your items.
                  </p>
                </div>
              </header>

              <div className="checkout-grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="co-date">
                    Pickup Date
                  </label>
                  <input
                    id="co-date"
                    className="field__input"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="co-time">
                    Pickup Time
                  </label>
                  <input
                    id="co-time"
                    className="field__input"
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="checkout-pickup-info">
                <MapPin className="react-icon" aria-hidden="true" />
                <div>
                  <p className="checkout-pickup-info__title">Pickup Location</p>
                  <p className="checkout-pickup-info__text">
                    SJCM Campus · Finance &amp; Property Office
                  </p>
                  <p className="checkout-pickup-info__note">
                    Monday – Friday · 8:00 AM – 4:00 PM. Bring a valid school ID.
                  </p>
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="checkout-section">
              <header className="checkout-section__header">
                <span className="checkout-section__icon">
                  <CreditCard className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="checkout-section__title">Payment Method</h2>
                  <p className="checkout-section__subtitle">
                    All orders are paid at pickup unless specified.
                  </p>
                </div>
              </header>

              <div className="payment-options">
                <label className={`payment-option ${payment === 'ewallet' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="ewallet"
                    checked={payment === 'ewallet'}
                    onChange={() => setPayment('ewallet')}
                  />
                  <span className="payment-option__icon">
                    <Wallet className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">E-Wallet</span>
                    <span className="payment-option__description">
                      GCash, Maya, or similar
                    </span>
                  </span>
                </label>

                <label className={`payment-option ${payment === 'cod' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={payment === 'cod'}
                    onChange={() => setPayment('cod')}
                  />
                  <span className="payment-option__icon">
                    <Banknote className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">Cash on Delivery</span>
                    <span className="payment-option__description">
                      Pay when items are delivered
                    </span>
                  </span>
                </label>

                <label className={`payment-option ${payment === 'cash_pickup' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cash_pickup"
                    checked={payment === 'cash_pickup'}
                    onChange={() => setPayment('cash_pickup')}
                  />
                  <span className="payment-option__icon">
                    <Banknote className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">Cash on Pickup</span>
                    <span className="payment-option__description">
                      Pay at the SJCM supply office
                    </span>
                  </span>
                </label>

                <label className={`payment-option ${payment === 'bank' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={payment === 'bank'}
                    onChange={() => setPayment('bank')}
                  />
                  <span className="payment-option__icon">
                    <CreditCard className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">Bank Transfer</span>
                    <span className="payment-option__description">
                      Send via bank transfer
                    </span>
                  </span>
                </label>
              </div>

              {payment === 'ewallet' && (
                <div className="ewallet-info">
                  <p>
                    <strong>E-Wallet instructions:</strong> After placing your order, you'll
                    receive payment details via email. Send payment to GCash / Maya and
                    upload your receipt before pickup.
                  </p>
                </div>
              )}

              {payment === 'bank' && (
                <div className="ewallet-info">
                  <p>
                    <strong>Bank transfer:</strong> Account details will be sent to your
                    email after checkout. Include your order ID as reference.
                  </p>
                </div>
              )}
            </section>

            {/* Notes */}
            <section className="checkout-section">
              <header className="checkout-section__header">
                <span className="checkout-section__icon">
                  <ShieldCheck className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="checkout-section__title">Additional Notes</h2>
                  <p className="checkout-section__subtitle">
                    Optional — any special requests for your order?
                  </p>
                </div>
              </header>

              <div className="field">
                <textarea
                  className="field__input field__input--textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please prepare a medium-sized shirt..."
                />
              </div>
            </section>
          </div>

          {/* RIGHT: order summary */}
          <aside className="checkout-summary">
            <h2 className="checkout-summary__title">Order Summary</h2>

            {/* Items list */}
            <div className="checkout-summary__items">
              {cart.map((item, index) => (
                <div className="checkout-summary__item" key={`${item.id}-${index}`}>
                  <span className="checkout-summary__item-qty">{item.qty}×</span>
                  <span className="checkout-summary__item-copy">
                    <span className="checkout-summary__item-name">{item.name}</span>
                    <span className="checkout-summary__item-meta">
                      {item.size || 'N/A'} · {item.organization}
                    </span>
                  </span>
                  <span className="checkout-summary__item-total">
                    {formatPrice((Number(item.price) || 0) * (Number(item.qty) || 0))}
                  </span>
                </div>
              ))}
            </div>

            <div className="checkout-summary__divider" />

            {/* Totals */}
            <div className="checkout-summary__lines">
              <div className="checkout-summary__line">
                <span>Items ({totalItems})</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="checkout-summary__line">
                <span>Pickup Fee</span>
                <strong className="checkout-summary__line--free">FREE</strong>
              </div>
              <div className="checkout-summary__total">
                <span>Total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="checkout-summary__submit"
              disabled={isSubmitting}
            >
              <Lock className="react-icon" aria-hidden="true" />
              <span>{isSubmitting ? 'Placing Order...' : 'Place Order'}</span>
              <ArrowRight className="react-icon" aria-hidden="true" />
            </button>

            <p className="checkout-summary__note">
              By placing your order, you agree to the SJCM Store terms. All orders are
              reserved for campus pickup only.
            </p>

            {/* Trust badges */}
            <div className="checkout-trust">
              <span className="checkout-trust__item">
                <Check className="react-icon" aria-hidden="true" />
                Secure
              </span>
              <span className="checkout-trust__item">
                <Check className="react-icon" aria-hidden="true" />
                Verified
              </span>
              <span className="checkout-trust__item">
                <Check className="react-icon" aria-hidden="true" />
                No hidden fees
              </span>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}