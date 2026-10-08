// src/pages/CheckoutPage.tsx

import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  MapPin,
  CreditCard,
  Banknote,
  User,
  Mail,
  Phone,
  ShoppingBag,
  ShieldCheck,
  Check,
  Store,
  Building2,
  DoorOpen,
  QrCode,
  FileText,
  X,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import { formatPrice, isStaffRole, sumCartItems } from '../services';
import { placeOrder as placeOrderService } from '../services/orders';
import { createPayMongoCheckout } from '../services/paymongo';
import { BUILDINGS, BUILDING_NAMES } from '../data/constants';
import type { Order } from '../types';

/* ============================================
   TYPES
   ============================================ */

type PaymentMethod = 'gcash_paymongo' | 'gcash_manual' | 'cod' | 'cop';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { session, cart, setCart } = useApp();

  /* ✅ LOCKED FIELDS — galing sa session */
  const fullName = session?.name || '';
  const studentId = session?.idNumber || '';
  const email = session?.email || '';
  const organization = session?.organization || 'SJCM General';

  /* Editable fields */
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');

  /* Payment */
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash_paymongo');
  const [gcashRefNumber, setGcashRefNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ✅ Modals */
  const [isGcashPayMongoModalOpen, setIsGcashPayMongoModalOpen] = useState(false);
  const [isGcashManualModalOpen, setIsGcashManualModalOpen] = useState(false);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);

  /* ============================================
     ✅ REDIRECT IF NO SESSION — MUST BE EARLY
  ============================================ */
  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
    }
  }, [session, navigate]);

  /* ✅ Phone number formatting — numbers only, max 11 digits */
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setPhone(digits);
  };

  /* ✅ Auto-fill phone */
  useEffect(() => {
    if (!session) return;
    const sessionPhone = (session as any).phone;
    if (sessionPhone) {
      const digits = String(sessionPhone).replace(/\D/g, '').slice(0, 11);
      setPhone(digits);
    } else {
      import('../data/storage').then(({ fetchUserProfile }) => {
        fetchUserProfile(session.id).then((profile) => {
          if (profile?.phone) {
            const digits = String(profile.phone).replace(/\D/g, '').slice(0, 11);
            setPhone(digits);
          }
        });
      });
    }
  }, [session]);

  const subtotal = useMemo(() => sumCartItems(cart), [cart]);
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cart]
  );

  const availableRooms = BUILDINGS[building] || [];

  /* Dynamic placeholder for notes */
  const notesPlaceholder = useMemo(() => {
    if (paymentMethod === 'gcash_paymongo') {
      return 'Reference number after payment or notes...';
    }
    if (paymentMethod === 'gcash_manual') {
      return 'GCash reference number (e.g., 1234 567 8901 2345)...';
    }
    if (paymentMethod === 'cod') {
      return 'Delivery landmark, preferred time, or notes for the courier...';
    }
    if (paymentMethod === 'cop') {
      return 'Any special request for your pickup...';
    }
    return 'Any additional notes...';
  }, [paymentMethod]);

  /* Building change handler */
  const handleBuildingChange = (newBuilding: string) => {
    setBuilding(newBuilding);
    setRoom(BUILDINGS[newBuilding]?.[0] || '');
  };

  /* ============================================
     MODAL HANDLERS
     ============================================ */

  const openGcashPayMongoModal = () => {
    setPaymentMethod('gcash_paymongo');
    setIsGcashPayMongoModalOpen(true);
  };

  const closeGcashPayMongoModal = () => {
    setIsGcashPayMongoModalOpen(false);
  };

  const openGcashManualModal = () => {
    setPaymentMethod('gcash_manual');
    setIsGcashManualModalOpen(true);
  };

  const closeGcashManualModal = () => {
    setIsGcashManualModalOpen(false);
  };

  const confirmGcashManual = () => {
    if (!gcashRefNumber.trim()) {
      toast('Please enter your GCash reference number.', 'warning');
      return;
    }
    setIsGcashManualModalOpen(false);
    toast('GCash Manual selected.', 'success');
  };

  /* ✅ PayMongo redirect flow */
  const confirmGcashPayMongo = () => {
    setIsGcashPayMongoModalOpen(false);
    setIsRedirectModalOpen(true);
  };

  /* ============================================
     ✅ PROCEED TO PAYMONGO — WITH TIMEOUT & PROPER ERROR HANDLING
  ============================================ */
  const proceedToPayMongo = async () => {
    // ✅ Guard — kailangan may session
    if (!session) {
      toast('Please sign in to continue.', 'warning');
      navigate('/login');
      return;
    }

    // Validation muna
    if (!phone.trim() || phone.length !== 11) {
      toast('Please enter a valid 11-digit phone number.', 'warning');
      setIsRedirectModalOpen(false);
      return;
    }
    if (!building.trim() || !room.trim()) {
      toast('Please select a building and room.', 'warning');
      setIsRedirectModalOpen(false);
      return;
    }
    if (!notes.trim()) {
      toast('Please add additional notes.', 'warning');
      setIsRedirectModalOpen(false);
      return;
    }

    setIsSubmitting(true);
    setIsRedirectModalOpen(false);

    try {
      const orderId = `SJCM-${Date.now()}`;
      const sessionId = session.id;

      const newOrder: Order = {
        id: orderId,
        userId: sessionId,
        customerName: fullName,
        studentId: studentId,
        email: email,
        phone: phone,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          organization: item.organization || 'General',
          price: Number(item.price) || 0,
          qty: Number(item.qty) || 0,
          size: item.size || 'N/A',
        })),
        totalAmount: subtotal,
        paymentMethod: 'GCash (PayMongo QR)',
        paymentRef: null,
        paymentStatus: 'Pending',
        orderStatus: 'Pending',
        claimLocation: `${building} — ${room}`,
        claimDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      // Save order to DB first
      await placeOrderService(newOrder);

      // Save to sessionStorage as backup
      sessionStorage.setItem('pendingOrder', JSON.stringify(newOrder));
      sessionStorage.setItem('pendingCart', JSON.stringify(cart));
      sessionStorage.setItem('pendingOrderId', orderId);

      /* ✅ TIMEOUT WRAPPER — 15 seconds max */
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout. Please try again.')),
          15000
        )
      );

      const paymongoPromise = (async (): Promise<string> => {
        const { checkoutUrl } = await createPayMongoCheckout({
          orderId: orderId,
          amount: subtotal,
          description: `SJCM Order ${orderId} — ${totalItems} item${
            totalItems > 1 ? 's' : ''
          }`,
          email: email,
          customerName: fullName,
        });

        if (!checkoutUrl) {
          throw new Error('No checkout URL received from PayMongo');
        }

        return checkoutUrl;
      })();

      /* ✅ RACE — alinman sa PayMongo OR timeout */
      const checkoutUrl = await Promise.race([
        paymongoPromise,
        timeoutPromise,
      ]);

      console.log('[Checkout] Redirecting to:', checkoutUrl);

      // ✅ Redirect — huwag i-reset ang isSubmitting dito
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('[Checkout] PayMongo error:', error);

      // ✅ Cleanup
      sessionStorage.removeItem('pendingOrder');
      sessionStorage.removeItem('pendingCart');
      sessionStorage.removeItem('pendingOrderId');

      toast(
        error?.message || 'Payment gateway error. Please try again.',
        'danger'
      );

      // ✅ CRITICAL: laging i-reset sa error
      setIsSubmitting(false);
      setIsRedirectModalOpen(false);
    }
  };

  /* ============================================
     ✅ EARLY RETURNS
  ============================================ */

  if (!session) {
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

  /* ============================================
     ✅ SUBMIT (COD / COP / GCash Manual)
     ============================================ */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!session) {
      toast('Please sign in to continue.', 'warning');
      navigate('/login');
      return;
    }

    if (!phone.trim() || phone.length !== 11) {
      toast('Please enter a valid 11-digit phone number.', 'warning');
      return;
    }

    if (!building.trim()) {
      toast('Please select a building.', 'warning');
      return;
    }

    if (!room.trim()) {
      toast('Please select a room / office.', 'warning');
      return;
    }

    if (!notes.trim()) {
      toast('Please add additional notes.', 'warning');
      return;
    }

    if (isStaffRole(session.role)) {
      toast('Staff and admin accounts cannot place customer orders.', 'warning');
      return;
    }

    if (paymentMethod === 'gcash_manual' && !gcashRefNumber.trim()) {
      toast('Please enter your GCash reference number.', 'warning');
      return;
    }

    // ✅ Kung PayMongo, i-trigger yung redirect modal
    if (paymentMethod === 'gcash_paymongo') {
      setIsRedirectModalOpen(true);
      return;
    }

    // ✅ COD / COP / Manual GCash — direkta sa DB
    setIsSubmitting(true);
    try {
      const orderId = `SJCM-${Date.now()}`;

      const paymentMethodLabel: Record<PaymentMethod, string> = {
        gcash_paymongo: 'GCash (PayMongo QR)',
        gcash_manual: 'GCash (Manual)',
        cod: 'Cash on Delivery',
        cop: 'Cash on Pickup',
      };

      const paymentStatus: Record<PaymentMethod, string> = {
        gcash_paymongo: 'Pending',
        gcash_manual: 'Verification Pending',
        cod: 'Unpaid (COD)',
        cop: 'Unpaid (OTC)',
      };

      const newOrder: Order = {
        id: orderId,
        userId: session.id,
        customerName: fullName,
        studentId: studentId,
        email: email,
        phone: phone,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          organization: item.organization || 'General',
          price: Number(item.price) || 0,
          qty: Number(item.qty) || 0,
          size: item.size || 'N/A',
        })),
        totalAmount: subtotal,
        paymentMethod: paymentMethodLabel[paymentMethod],
        paymentRef: paymentMethod === 'gcash_manual' ? gcashRefNumber : null,
        paymentStatus: paymentStatus[paymentMethod],
        orderStatus: 'Pending',
        claimLocation: `${building} — ${room}`,
        claimDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      await placeOrderService(newOrder);
      setCart([]);
      toast('Order placed successfully!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast(error?.message || 'Checkout failed. Please try again.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ============================================
     RENDER
     ============================================ */
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
          <div className="checkout-main">
            {/* Contact Information */}
            <section className="checkout-section">
              <header className="checkout-section__header">
                <span className="checkout-section__icon">
                  <User className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="checkout-section__title">
                    Contact Information
                  </h2>
                  <p className="checkout-section__subtitle">
                    Your registered details from login (locked).
                  </p>
                </div>
              </header>

              <div className="checkout-grid-2">
                <div className="field">
                  <label className="field__label">
                    Full Name
                    <Lock className="field__lock-icon" aria-hidden="true" />
                  </label>
                  <input
                    className="field__input field__input--locked"
                    type="text"
                    value={fullName}
                    readOnly
                    disabled
                  />
                </div>

                <div className="field">
                  <label className="field__label">
                    Student ID
                    <Lock className="field__lock-icon" aria-hidden="true" />
                  </label>
                  <input
                    className="field__input field__input--locked"
                    type="text"
                    value={studentId}
                    readOnly
                    disabled
                  />
                </div>

                <div className="field">
                  <label className="field__label">
                    Email
                    <Lock className="field__lock-icon" aria-hidden="true" />
                  </label>
                  <div className="field__icon-wrap">
                    <Mail className="react-icon" aria-hidden="true" />
                    <input
                      className="field__input field__input--icon field__input--locked"
                      type="email"
                      value={email}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field__label">
                    Organization
                    <Lock className="field__lock-icon" aria-hidden="true" />
                  </label>
                  <input
                    className="field__input field__input--locked"
                    type="text"
                    value={organization}
                    readOnly
                    disabled
                  />
                </div>

                {/* ✅ PHONE — Numbers only, max 11 digits */}
                <div className="field">
                  <label className="field__label" htmlFor="co-phone">
                    Phone Number{' '}
                    <span style={{ color: 'var(--theme-danger)' }}>*</span>
                  </label>
                  <div className="field__icon-wrap">
                    <Phone className="react-icon" aria-hidden="true" />
                    <input
                      id="co-phone"
                      className="field__input field__input--icon"
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="09XXXXXXXXX (11 digits)"
                      required
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color:
                        phone.length === 11
                          ? 'var(--theme-success)'
                          : 'var(--theme-text-muted)',
                      marginTop: 4,
                    }}
                  >
                    {phone.length}/11 digits {phone.length === 11 && '✓'}
                  </p>
                </div>
              </div>
            </section>

            {/* Pickup Location */}
            <section className="checkout-section">
              <header className="checkout-section__header">
                <span className="checkout-section__icon">
                  <MapPin className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="checkout-section__title">
                    Pickup Location
                  </h2>
                  <p className="checkout-section__subtitle">
                    Select where you'd like to pick up your items.
                  </p>
                </div>
              </header>

              <div className="checkout-grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="co-building">
                    Building{' '}
                    <span style={{ color: 'var(--theme-danger)' }}>*</span>
                  </label>
                  <div className="field__icon-wrap">
                    <Building2 className="react-icon" aria-hidden="true" />
                    <select
                      id="co-building"
                      className="field__input field__input--icon field__input--select"
                      value={building}
                      onChange={(e) => handleBuildingChange(e.target.value)}
                      required
                    >
                      <option value="">Select building</option>
                      {BUILDING_NAMES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="co-room">
                    Room / Office{' '}
                    <span style={{ color: 'var(--theme-danger)' }}>*</span>
                  </label>
                  <div className="field__icon-wrap">
                    <DoorOpen className="react-icon" aria-hidden="true" />
                    <select
                      id="co-room"
                      className="field__input field__input--icon field__input--select"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      required
                      disabled={!building}
                    >
                      <option value="">Select room / office</option>
                      {availableRooms.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {building && room && (
                <div className="checkout-pickup-info">
                  <MapPin className="react-icon" aria-hidden="true" />
                  <div>
                    <p className="checkout-pickup-info__title">
                      Pickup Location
                    </p>
                    <p className="checkout-pickup-info__text">
                      {building} · {room}
                    </p>
                    <p className="checkout-pickup-info__note">
                      Monday – Friday · 8:00 AM – 4:00 PM. Bring a valid school
                      ID.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section className="checkout-section">
              <header className="checkout-section__header">
                <span className="checkout-section__icon">
                  <CreditCard className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="checkout-section__title">
                    Payment Method
                  </h2>
                  <p className="checkout-section__subtitle">
                    Choose how you'd like to pay for your order.
                  </p>
                </div>
              </header>

              <div className="payment-options">
                {/* ✅ GCash PayMongo */}
                <label
                  className={`payment-option ${
                    paymentMethod === 'gcash_paymongo' ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="gcash_paymongo"
                    checked={paymentMethod === 'gcash_paymongo'}
                    onChange={() => openGcashPayMongoModal()}
                    onClick={openGcashPayMongoModal}
                  />
                  <span className="payment-option__icon">
                    <QrCode className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">
                      GCash (PayMongo)
                    </span>
                    <span className="payment-option__description">
                      Scan QR or secure checkout
                    </span>
                  </span>
                </label>

                {/* ✅ GCash Manual */}
                <label
                  className={`payment-option ${
                    paymentMethod === 'gcash_manual' ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="gcash_manual"
                    checked={paymentMethod === 'gcash_manual'}
                    onChange={() => openGcashManualModal()}
                    onClick={openGcashManualModal}
                  />
                  <span className="payment-option__icon">
                    <FileText className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">
                      GCash (Manual)
                    </span>
                    <span className="payment-option__description">
                      Enter reference #
                    </span>
                  </span>
                </label>

                {/* COD */}
                <label
                  className={`payment-option ${
                    paymentMethod === 'cod' ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <span className="payment-option__icon">
                    <Banknote className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">
                      Cash on Delivery
                    </span>
                    <span className="payment-option__description">
                      Delivered on campus
                    </span>
                  </span>
                </label>

                {/* COP */}
                <label
                  className={`payment-option ${
                    paymentMethod === 'cop' ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cop"
                    checked={paymentMethod === 'cop'}
                    onChange={() => setPaymentMethod('cop')}
                  />
                  <span className="payment-option__icon">
                    <Banknote className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">
                      Cash on Pickup
                    </span>
                    <span className="payment-option__description">
                      Pay at the supply office
                    </span>
                  </span>
                </label>
              </div>

              {paymentMethod === 'cod' && (
                <div className="ewallet-info">
                  <p>
                    <strong>Cash on Delivery:</strong> Our staff will deliver
                    your order within the campus. Pay in cash upon delivery.
                  </p>
                </div>
              )}

              {paymentMethod === 'cop' && (
                <div className="ewallet-info">
                  <p>
                    <strong>Cash on Pickup:</strong> Pay in cash when you pick
                    up your order at the selected office. Bring a valid school
                    ID.
                  </p>
                </div>
              )}
            </section>

            {/* ✅ Notes — REQUIRED na */}
            <section className="checkout-section">
              <header className="checkout-section__header">
                <span className="checkout-section__icon">
                  <ShieldCheck className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="checkout-section__title">
                    Additional Notes{' '}
                    <span style={{ color: 'var(--theme-danger)' }}>*</span>
                  </h2>
                  <p className="checkout-section__subtitle">
                    Required — any special requests for your order?
                  </p>
                </div>
              </header>

              <div className="field">
                <textarea
                  className="field__input field__input--textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={notesPlaceholder}
                  required
                />
                {!notes.trim() && (
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--theme-danger)',
                      marginTop: 4,
                    }}
                  >
                    ⚠️ Required field — please add notes.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT: order summary */}
          <aside className="checkout-summary">
            <h2 className="checkout-summary__title">Order Summary</h2>

            <div className="checkout-summary__items">
              {cart.map((item, index) => (
                <div
                  className="checkout-summary__item"
                  key={`${item.id}-${index}`}
                >
                  <span className="checkout-summary__item-qty">
                    {item.qty}×
                  </span>
                  <span className="checkout-summary__item-copy">
                    <span className="checkout-summary__item-name">
                      {item.name}
                    </span>
                    <span className="checkout-summary__item-meta">
                      {item.size || 'N/A'} · {item.organization}
                    </span>
                  </span>
                  <span className="checkout-summary__item-total">
                    {formatPrice(
                      (Number(item.price) || 0) * (Number(item.qty) || 0)
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="checkout-summary__divider" />

            <div className="checkout-summary__lines">
              <div className="checkout-summary__line">
                <span>Items ({totalItems})</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="checkout-summary__line">
                <span>Pickup Fee</span>
                <strong className="checkout-summary__line--free">
                  FREE
                </strong>
              </div>
              <div className="checkout-summary__total">
                <span>Total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
            </div>

            <button
              type="submit"
              className="checkout-summary__submit"
              disabled={isSubmitting}
            >
              <Lock className="react-icon" aria-hidden="true" />
              <span>
                {isSubmitting
                  ? 'Processing...'
                  : paymentMethod === 'gcash_paymongo'
                  ? 'Proceed to PayMongo'
                  : 'Place Order'}
              </span>
              <ArrowRight className="react-icon" aria-hidden="true" />
            </button>

            <p className="checkout-summary__note">
              By placing your order, you agree to the SJCM Store terms. All
              orders are reserved for campus pickup only.
            </p>

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

      {/* ============================================
          ✅ PAYMONGO MODAL — Confirmation
         ============================================ */}
      {isGcashPayMongoModalOpen && (
        <div
          className="gcash-modal-backdrop"
          onClick={(e) =>
            e.target === e.currentTarget && closeGcashPayMongoModal()
          }
          role="dialog"
          aria-modal="true"
        >
          <div className="gcash-modal">
            <div className="gcash-modal__header">
              <div className="gcash-modal__title-wrap">
                <span className="gcash-modal__icon">
                  <QrCode className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="gcash-modal__title">PayMongo Checkout</h2>
                  <p className="gcash-modal__subtitle">
                    Secure payment via PayMongo
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="gcash-modal__close"
                onClick={closeGcashPayMongoModal}
                aria-label="Close"
              >
                <X className="react-icon" aria-hidden="true" />
              </button>
            </div>

            <div className="gcash-modal__body">
              <div className="gcash-modal__panel gcash-modal__panel--qr">
                <div className="gcash-modal__qr-info">
                  <p className="gcash-modal__qr-title">
                    🔒 Secure Payment via PayMongo
                  </p>
                  <p className="gcash-modal__qr-desc">
                    You'll be redirected to{' '}
                    <strong>PayMongo's secure checkout</strong> where you can
                    pay via:
                  </p>
                  <ul className="gcash-modal__payment-list">
                    <li>📱 GCash</li>
                    <li>💳 Maya (PayMaya)</li>
                    <li>💳 Cards (Visa, Mastercard, JCB)</li>
                    <li>📷 QR Ph</li>
                  </ul>
                  <p className="gcash-modal__qr-note">
                    ✅ Your payment is secured by PayMongo. You'll return to
                    SJCM Store after payment.
                  </p>
                </div>
              </div>
            </div>

            <div className="gcash-modal__footer">
              <button
                type="button"
                className="gcash-modal__btn gcash-modal__btn--ghost"
                onClick={closeGcashPayMongoModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gcash-modal__btn gcash-modal__btn--primary"
                onClick={confirmGcashPayMongo}
              >
                <Check className="react-icon" aria-hidden="true" />
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          ✅ REDIRECT MODAL — Final confirmation
          Cancel button: always enabled (removed disabled prop)
          Reset isSubmitting on cancel
         ============================================ */}
      {isRedirectModalOpen && (
        <div
          className="gcash-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsRedirectModalOpen(false);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="gcash-modal">
            <div className="gcash-modal__header">
              <div className="gcash-modal__title-wrap">
                <span className="gcash-modal__icon">
                  <AlertCircle className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="gcash-modal__title">Ready to Pay?</h2>
                  <p className="gcash-modal__subtitle">
                    You'll be redirected to PayMongo
                  </p>
                </div>
              </div>
              {!isSubmitting && (
                <button
                  type="button"
                  className="gcash-modal__close"
                  onClick={() => setIsRedirectModalOpen(false)}
                  aria-label="Close"
                >
                  <X className="react-icon" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="gcash-modal__body">
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--theme-text)',
                    marginBottom: '0.75rem',
                  }}
                >
                  You are about to pay:
                </p>
                <p
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'var(--theme-primary)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    marginBottom: '1rem',
                  }}
                >
                  {formatPrice(subtotal)}
                </p>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--theme-text-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  Click <strong>"Proceed to PayMongo"</strong> to complete
                  your payment. You'll be redirected to PayMongo's secure
                  checkout page.
                </p>
              </div>
            </div>

            <div className="gcash-modal__footer">
              {/* ✅ Cancel — always enabled, force reset */}
              <button
                type="button"
                className="gcash-modal__btn gcash-modal__btn--ghost"
                onClick={() => {
                  setIsRedirectModalOpen(false);
                  setIsSubmitting(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gcash-modal__btn gcash-modal__btn--primary"
                onClick={proceedToPayMongo}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="react-icon" aria-hidden="true" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <ArrowRight
                      className="react-icon"
                      aria-hidden="true"
                    />
                    Proceed to PayMongo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          ✅ GCASH MANUAL MODAL
         ============================================ */}
      {isGcashManualModalOpen && (
        <div
          className="gcash-modal-backdrop"
          onClick={(e) =>
            e.target === e.currentTarget && closeGcashManualModal()
          }
          role="dialog"
          aria-modal="true"
        >
          <div className="gcash-modal">
            <div className="gcash-modal__header">
              <div className="gcash-modal__title-wrap">
                <span className="gcash-modal__icon">
                  <FileText className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="gcash-modal__title">GCash Manual</h2>
                  <p className="gcash-modal__subtitle">
                    Enter your reference number
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="gcash-modal__close"
                onClick={closeGcashManualModal}
                aria-label="Close"
              >
                <X className="react-icon" aria-hidden="true" />
              </button>
            </div>

            <div className="gcash-modal__body">
              <div className="gcash-modal__panel gcash-modal__panel--manual">
                <div className="field">
                  <label className="field__label" htmlFor="gcash-ref-modal">
                    GCash Reference Number
                  </label>
                  <input
                    id="gcash-ref-modal"
                    className="field__input"
                    type="text"
                    value={gcashRefNumber}
                    onChange={(e) => setGcashRefNumber(e.target.value)}
                    placeholder="e.g. 1234 567 8901 2345"
                    autoFocus
                  />
                </div>
                <p className="gcash-modal__manual-note">
                  Send payment to <strong>0917 XXX XXXX</strong> then enter
                  the reference number above.
                </p>
              </div>
            </div>

            <div className="gcash-modal__footer">
              <button
                type="button"
                className="gcash-modal__btn gcash-modal__btn--ghost"
                onClick={closeGcashManualModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gcash-modal__btn gcash-modal__btn--primary"
                onClick={confirmGcashManual}
                disabled={!gcashRefNumber.trim()}
              >
                <Check className="react-icon" aria-hidden="true" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}