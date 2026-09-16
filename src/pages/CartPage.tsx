// src/pages/CartPage.tsx

import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import { formatPrice, isStaffRole, sumCartItems } from '../services';

export default function CartPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { session, cart, products, setCart } = useApp();

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const getItemKey = (item: { id: string; size?: string }) =>
    `${item.id}-${item.size ?? 'default'}`;

  const itemKeys = useMemo(() => cart.map(getItemKey), [cart]);

  useEffect(() => {
    setSelectedKeys((prev) => {
      const validKeys = new Set(itemKeys);
      const next = new Set<string>();

      prev.forEach((key) => {
        if (validKeys.has(key)) next.add(key);
      });

      itemKeys.forEach((key) => {
        if (!prev.has(key)) next.add(key);
      });

      if (next.size === prev.size && [...next].every((k) => prev.has(k))) {
        return prev;
      }
      return next;
    });
  }, [itemKeys]);

  const allSelected = itemKeys.length > 0 && itemKeys.every((k) => selectedKeys.has(k));
  const someSelected = selectedKeys.size > 0 && !allSelected;
  const selectedCount = selectedKeys.size;

  const subtotal = useMemo(() => sumCartItems(cart), [cart]);
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cart],
  );

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(itemKeys));
    }
  };

  const handleToggleItem = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const updateQty = (index: number, delta: number) => {
    const item = cart[index];
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      removeItem(index);
      return;
    }

    const product = products.find((candidate) => candidate.id === item.id);
    if (product && newQty > product.stock) {
      toast(`Stock limit reached. Only ${product.stock} available.`, 'warning');
      return;
    }

    const nextCart = [...cart];
    nextCart[index] = { ...item, qty: newQty };
    setCart(nextCart);
  };

  const removeItem = (index: number) => {
    const nextCart = cart.filter((_, cartIndex) => cartIndex !== index);
    setCart(nextCart);
    toast('Item removed from cart', 'info');
  };

  const removeSelected = () => {
    if (selectedCount === 0) {
      toast('No items selected.', 'info');
      return;
    }
    const nextCart = cart.filter((item) => !selectedKeys.has(getItemKey(item)));
    setCart(nextCart);
    setSelectedKeys(new Set());
    toast(
      `${selectedCount} item${selectedCount === 1 ? '' : 's'} removed`,
      'info',
    );
  };

  const clearCart = () => {
    if (!cart.length) return;
    setCart([]);
    setSelectedKeys(new Set());
    toast('Cart cleared', 'info');
  };

  const proceedToCheckout = () => {
    if (!session) {
      toast('Please sign in to proceed to checkout.', 'warning');
      navigate('/login');
      return;
    }
    if (isStaffRole(session.role)) {
      toast('Staff and admin accounts cannot place customer orders.', 'warning');
      return;
    }
    if (!cart.length) {
      toast('Your cart is empty.', 'warning');
      return;
    }
    if (selectedCount === 0) {
      toast('Please select at least one item to checkout.', 'warning');
      return;
    }
    navigate('/checkout');
  };

  return (
    <main className="cart-page">
      <div className="cart-container">
        <header className="cart-hero">
          <div className="cart-hero__copy">
            <p className="cart-hero__kicker">SJCM Store</p>
            <h1 className="cart-hero__title">Your Cart</h1>
            <p className="cart-hero__description">
              Review your selected items and proceed to checkout.
            </p>
          </div>
          <div className="cart-hero__quote">
            <span>"Official Merch</span>
            <span>for a Stronger</span>
            <span>SJCM"</span>
          </div>
        </header>

        <div className="cart-toolbar">
          <label className="cart-toolbar__select-all">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={handleSelectAll}
              aria-label="Select all items"
            />
            <span>
              Select All ({selectedCount} of {cart.length} item
              {cart.length === 1 ? '' : 's'})
            </span>
          </label>

          <div className="cart-toolbar__actions">
            <button
              type="button"
              className="cart-toolbar__btn cart-toolbar__btn--ghost"
              onClick={removeSelected}
              disabled={selectedCount === 0}
            >
              <Trash2 className="react-icon" aria-hidden="true" />
              <span>Remove Selected</span>
            </button>
            <Link to="/catalog" className="cart-toolbar__btn">
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        <div className="cart-body">
          <section className="cart-items" aria-label="Cart items">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingBag className="react-icon" aria-hidden="true" />
                <h2 className="cart-empty__title">Your cart is empty</h2>
                <p className="cart-empty__description">
                  Explore the catalog to reserve school uniforms, department apparel, and ID laces.
                </p>
                <Link to="/catalog" className="button button--primary">
                  <Store className="react-icon" aria-hidden="true" />
                  <span>Browse merchandise</span>
                </Link>
              </div>
            ) : (
              <ul className="cart-list">
                {cart.map((item, index) => {
                  const itemKey = getItemKey(item);
                  const itemTotal =
                    (Number(item.price) || 0) * (Number(item.qty) || 0);
                  const isSelected = selectedKeys.has(itemKey);
                  return (
                    <li
                      className={`cart-item ${isSelected ? 'is-selected' : ''}`}
                      key={itemKey}
                    >
                      <label className="cart-item__select" aria-label="Select item">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItem(itemKey)}
                        />
                      </label>

                      <div className="cart-item__media" aria-hidden="true">
                        <Package className="react-icon" aria-hidden="true" />
                      </div>

                      <div className="cart-item__details">
                        <p className="cart-item__name" title={item.name}>
                          {item.name}
                        </p>
                        <p className="cart-item__org">
                          {item.organization || 'General'}
                        </p>

                        <div className="cart-item__tags">
                          {item.size && (
                            <span className="cart-item__tag">
                              Size: <strong>{item.size}</strong>
                            </span>
                          )}
                          <span className="cart-item__tag">
                            Color: <strong>Maroon</strong>
                          </span>
                        </div>

                        <p className="cart-item__price">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <div className="cart-item__qty">
                        <button
                          type="button"
                          className="cart-item__qty-btn"
                          onClick={() => updateQty(index, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="react-icon" aria-hidden="true" />
                        </button>
                        <span className="cart-item__qty-value">{item.qty}</span>
                        <button
                          type="button"
                          className="cart-item__qty-btn"
                          onClick={() => updateQty(index, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="react-icon" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="cart-item__total">
                        {formatPrice(itemTotal)}
                      </div>

                      <button
                        type="button"
                        className="cart-item__remove"
                        onClick={() => removeItem(index)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="react-icon" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {cart.length > 0 && (
              <div className="cart-note">
                <ShieldCheck className="react-icon" aria-hidden="true" />
                <div>
                  <p className="cart-note__title">All items are official SJCM merchandise.</p>
                  <p className="cart-note__text">
                    Unauthorized sellers are not allowed on campus.
                  </p>
                </div>
              </div>
            )}
          </section>

          <aside className="cart-summary" aria-labelledby="summary-title">
            <h2 id="summary-title" className="cart-summary__title">
              Order Summary
            </h2>

            <div className="cart-summary__lines">
              <div className="cart-summary__line">
                <span>Items ({totalItems})</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="cart-summary__line">
                <span>Shipping / Pickup</span>
                <strong className="cart-summary__line--free">FREE</strong>
              </div>
              <div className="cart-summary__total">
                <span>Total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
            </div>

            <div className="cart-summary__actions">
              <button
                type="button"
                className="cart-summary__btn cart-summary__btn--primary"
                onClick={proceedToCheckout}
                disabled={!cart.length || selectedCount === 0}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="react-icon" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="cart-summary__btn cart-summary__btn--ghost"
                onClick={clearCart}
                disabled={!cart.length}
              >
                <Trash2 className="react-icon" aria-hidden="true" />
                <span>Clear Cart</span>
              </button>
            </div>

            <div className="cart-summary__pickup">
              <span className="cart-summary__pickup-icon">
                <MapPin className="react-icon" aria-hidden="true" />
              </span>
              <span className="cart-summary__pickup-copy">
                <span className="cart-summary__pickup-label">Pickup Location</span>
                <span className="cart-summary__pickup-title">SJCM Campus</span>
                <span className="cart-summary__pickup-note">
                  Please bring a valid school ID for pickup.
                </span>
              </span>
              <ArrowRight
                className="react-icon cart-summary__pickup-chev"
                aria-hidden="true"
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}