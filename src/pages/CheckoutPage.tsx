// src/pages/CheckoutPage.tsx

import { useMemo, useState, useEffect, type FormEvent } from 'react';
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
  Building2,
  DoorOpen,
  QrCode,
  FileText,
  X,
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

type PaymentMethod = 'gcash' | 'cod' | 'cop';
type GcashSubMethod = 'qr' | 'manual';

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
  const [building, setBuilding] = useState(BUILDING_NAMES[0] || '');
  const [room, setRoom] = useState(BUILDINGS[BUILDING_NAMES[0]]?.[0] || '');
  const [notes, setNotes] = useState('');

  /* Payment */
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [gcashSubMethod, setGcashSubMethod] = useState<GcashSubMethod | null>(null);
  const [gcashRefNumber, setGcashRefNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ✅ GCash Modal */
  const [isGcashModalOpen, setIsGcashModalOpen] = useState(false);

  /* ============================================
     ✅ AUTO-FILL PHONE from session
     ============================================ */
  useEffect(() => {
    if (!session) return;

    const sessionPhone = (session as any).phone;
    if (sessionPhone) {
      setPhone(sessionPhone);
    } else {
      import('../data/storage').then(({ fetchUserProfile }) => {
        fetchUserProfile(session.id).then((profile) => {
          if (profile?.phone) {
            setPhone(profile.phone);
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
    if (paymentMethod === 'gcash') {
      if (gcashSubMethod === 'qr') {
        return 'Reference number after payment or notes...';
      }
      if (gcashSubMethod === 'manual') {
        return 'GCash reference number (e.g., 1234 567 8901 2345)...';
      }
      return 'Choose your GCash payment method above...';
    }
    if (paymentMethod === 'cod') {
      return 'Delivery landmark, preferred time, or notes for the courier...';
    }
    if (paymentMethod === 'cop') {
      return 'Any special request for your pickup...';
    }
    return 'Any additional notes...';
  }, [paymentMethod, gcashSubMethod]);

  /* Building change handler */
  const handleBuildingChange = (newBuilding: string) => {
    setBuilding(newBuilding);
    setRoom(BUILDINGS[newBuilding]?.[0] || '');
  };

  /* ============================================
     GCASH MODAL HANDLERS
     ============================================ */

  const openGcashModal = () => {
    setPaymentMethod('gcash');
    setIsGcashModalOpen(true);
  };

  const closeGcashModal = () => {
    setIsGcashModalOpen(false);
  };

  const selectGcashSubMethod = (sub: GcashSubMethod) => {
    setGcashSubMethod(sub);
  };

  const confirmGcashSubMethod = () => {
    if (!gcashSubMethod) {
      toast('Please choose QR Code or Manual.', 'warning');
      return;
    }
    if (gcashSubMethod === 'manual' && !gcashRefNumber.trim()) {
      toast('Please enter your GCash reference number.', 'warning');
      return;
    }
    setIsGcashModalOpen(false);
    toast(
      `GCash ${gcashSubMethod === 'qr' ? 'PayMongo' : 'Manual'} selected.`,
      'success'
    );
  };

  /* ✅ Close modal with Escape key */
  useEffect(() => {
    if (!isGcashModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGcashModal();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isGcashModalOpen]);

  /* ✅ Lock body scroll kapag bukas yung modal */
  useEffect(() => {
    if (isGcashModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isGcashModalOpen]);

  /* ============================================
     REDIRECT
     ============================================ */
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

  /* ============================================
     ✅ SUBMIT — With PayMongo Integration
     ============================================ */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast('Please enter your phone number.', 'warning');
      return;
    }

    if (!building.trim() || !room.trim()) {
      toast('Please select a building and room.', 'warning');
      return;
    }

    if (isStaffRole(session.role)) {
      toast('Staff and admin accounts cannot place customer orders.', 'warning');
      return;
    }

    /* ✅ GCash validation */
    if (paymentMethod === 'gcash') {
      if (!gcashSubMethod) {
        toast('Please choose a GCash payment method.', 'warning');
        openGcashModal();
        return;
      }
      if (gcashSubMethod === 'manual' && !gcashRefNumber.trim()) {
        toast('Please enter your GCash reference number.', 'warning');
        openGcashModal();
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const orderId = `SJCM-${Date.now()}`;

      const paymentMethodLabel: Record<PaymentMethod, string> = {
        gcash:
          gcashSubMethod === 'qr'
            ? 'GCash (PayMongo QR)'
            : 'GCash (Manual)',
        cod: 'Cash on Delivery',
        cop: 'Cash on Pickup',
      };

      const paymentStatus: Record<PaymentMethod, string> = {
        gcash: gcashSubMethod === 'qr' ? 'Pending' : 'Verification Pending',
        cod: 'Unpaid (COD)',
        cop: 'Unpaid (OTC)',
      };

      const claimLocation = `${building} — ${room}`;
      const paymentRef =
        paymentMethod === 'gcash' && gcashSubMethod === 'manual'
          ? gcashRefNumber
          : null;

      // ✅ Step 1: Save order to database FIRST
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
        paymentRef: paymentRef,
        paymentStatus: paymentStatus[paymentMethod],
        orderStatus: 'Pending',
        claimLocation: claimLocation,
        claimDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      await placeOrderService(newOrder);

      // ✅ Step 2: Check kung PayMongo QR ang napili
      if (paymentMethod === 'gcash' && gcashSubMethod === 'qr') {
        try {
          const { checkoutUrl } = await createPayMongoCheckout({
            orderId: orderId,
            amount: subtotal,
            description: `SJCM Order ${orderId} — ${totalItems} item${totalItems > 1 ? 's' : ''}`,
            email: email,
            customerName: fullName,
          });

          setCart([]);
          window.location.href = checkoutUrl;
          return;
        } catch (paymongoError: any) {
          console.error('[Checkout] PayMongo error:', paymongoError);
          toast(
            paymongoError?.message ||
              'Payment gateway error. Please try again or choose another method.',
            'danger'
          );
          setIsSubmitting(false);
          return;
        }
      }

      // ✅ Step 3: Para sa COD/COP/Manual GCash
      setCart([]);
      toast('Order placed successfully!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast(
        error?.message || 'Checkout failed. Please try again.',
        'danger'
      );
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
          {/* LEFT */}
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
                {/* LOCKED: Full Name */}
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

                {/* LOCKED: Student ID */}
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

                {/* LOCKED: Email */}
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

                {/* LOCKED: Organization */}
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

                {/* EDITABLE: Phone */}
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
                  {!phone && (
                    <p
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-muted, #6b7280)',
                        marginTop: 6,
                      }}
                    >
                      💡 Tip: Save your phone number sa{' '}
                      <Link
                        to="/settings"
                        style={{ color: 'var(--brand, #22915c)', fontWeight: 600 }}
                      >
                        Settings
                      </Link>{' '}
                      para auto-fill sa susunod.
                    </p>
                  )}
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
                  <h2 className="checkout-section__title">Pickup Location</h2>
                  <p className="checkout-section__subtitle">
                    Select where you'd like to pick up your items.
                  </p>
                </div>
              </header>

              <div className="checkout-grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="co-building">
                    Building
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
                    Room / Office
                  </label>
                  <div className="field__icon-wrap">
                    <DoorOpen className="react-icon" aria-hidden="true" />
                    <select
                      id="co-room"
                      className="field__input field__input--icon field__input--select"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      required
                    >
                      {availableRooms.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

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
            </section>

            {/* Payment Method */}
            <section className="checkout-section">
              <header className="checkout-section__header">
                <span className="checkout-section__icon">
                  <CreditCard className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="checkout-section__title">Payment Method</h2>
                  <p className="checkout-section__subtitle">
                    Choose how you'd like to pay for your order.
                  </p>
                </div>
              </header>

              <div className="payment-options">
                {/* GCash */}
                <label
                  className={`payment-option ${
                    paymentMethod === 'gcash' ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="gcash"
                    checked={paymentMethod === 'gcash'}
                    onChange={() => {
                      setPaymentMethod('gcash');
                      openGcashModal();
                    }}
                    onClick={openGcashModal}
                  />
                  <span className="payment-option__icon">
                    <Wallet className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">
                      GCash / E-Wallet
                    </span>
                    <span className="payment-option__description">
                      {gcashSubMethod === 'qr'
                        ? '✓ PayMongo QR selected'
                        : gcashSubMethod === 'manual'
                        ? '✓ Manual payment selected'
                        : 'Click to choose QR or manual'}
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
                    onChange={() => {
                      setPaymentMethod('cod');
                      setGcashSubMethod(null);
                    }}
                  />
                  <span className="payment-option__icon">
                    <Banknote className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">
                      Cash on Delivery
                    </span>
                    <span className="payment-option__description">
                      Delivered to you on campus
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
                    onChange={() => {
                      setPaymentMethod('cop');
                      setGcashSubMethod(null);
                    }}
                  />
                  <span className="payment-option__icon">
                    <Banknote className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="payment-option__copy">
                    <span className="payment-option__title">
                      Cash on Pickup
                    </span>
                    <span className="payment-option__description">
                      Pay at the SJCM supply office
                    </span>
                  </span>
                </label>
              </div>

              {/* COD Info */}
              {paymentMethod === 'cod' && (
                <div className="ewallet-info">
                  <p>
                    <strong>Cash on Delivery:</strong> Our staff will deliver
                    your order within the campus. Pay in cash upon delivery.
                  </p>
                </div>
              )}

              {/* COP Info */}
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
                  placeholder={notesPlaceholder}
                />
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
                <strong className="checkout-summary__line--free">FREE</strong>
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
                  ? paymentMethod === 'gcash' && gcashSubMethod === 'qr'
                    ? 'Redirecting to PayMongo...'
                    : 'Placing Order...'
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

      {/* GCASH MODAL */}
      {isGcashModalOpen && (
        <div
          className="gcash-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeGcashModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="GCash payment options"
        >
          <div className="gcash-modal">
            <div className="gcash-modal__header">
              <div className="gcash-modal__title-wrap">
                <span className="gcash-modal__icon">
                  <Wallet className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="gcash-modal__title">GCash Payment</h2>
                  <p className="gcash-modal__subtitle">
                    Choose how you'd like to pay
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="gcash-modal__close"
                onClick={closeGcashModal}
                aria-label="Close"
              >
                <X className="react-icon" aria-hidden="true" />
              </button>
            </div>

            <div className="gcash-modal__body">
              <div className="gcash-modal__options">
                {/* QR Option */}
                <button
                  type="button"
                  className={`gcash-modal__option ${
                    gcashSubMethod === 'qr' ? 'is-selected' : ''
                  }`}
                  onClick={() => selectGcashSubMethod('qr')}
                >
                  <span className="gcash-modal__option-icon">
                    <QrCode className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="gcash-modal__option-copy">
                    <span className="gcash-modal__option-title">
                      PayMongo Checkout
                    </span>
                    <span className="gcash-modal__option-desc">
                      Scan QR or continue to secure checkout
                    </span>
                  </span>
                  {gcashSubMethod === 'qr' && (
                    <Check className="gcash-modal__check" aria-hidden="true" />
                  )}
                </button>

                {/* Manual Option */}
                <button
                  type="button"
                  className={`gcash-modal__option ${
                    gcashSubMethod === 'manual' ? 'is-selected' : ''
                  }`}
                  onClick={() => selectGcashSubMethod('manual')}
                >
                  <span className="gcash-modal__option-icon">
                    <FileText className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="gcash-modal__option-copy">
                    <span className="gcash-modal__option-title">Manual</span>
                    <span className="gcash-modal__option-desc">
                      Enter reference #
                    </span>
                  </span>
                  {gcashSubMethod === 'manual' && (
                    <Check className="gcash-modal__check" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* QR Panel with Image */}
              {gcashSubMethod === 'qr' && (
                <div className="gcash-modal__panel gcash-modal__panel--qr">
                  <div className="gcash-modal__qr-frame">
                    <img
                      src="/qr.png"
                      alt="PayMongo QR Code"
                      className="gcash-modal__qr-image"
                    />
                  </div>
                  <div className="gcash-modal__qr-info">
                    <p className="gcash-modal__qr-title">
                      📷 Scan to Pay with GCash
                    </p>
                    <p className="gcash-modal__qr-desc">
                      Open your GCash app, tap <strong>Scan QR</strong>, and
                      scan the code above. Or click{' '}
                      <strong>"Place Order"</strong> to continue to PayMongo's
                      secure checkout.
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
              )}

              {/* Manual Panel */}
              {gcashSubMethod === 'manual' && (
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
              )}
            </div>

            <div className="gcash-modal__footer">
              <button
                type="button"
                className="gcash-modal__btn gcash-modal__btn--ghost"
                onClick={closeGcashModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gcash-modal__btn gcash-modal__btn--primary"
                onClick={confirmGcashSubMethod}
                disabled={!gcashSubMethod}
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