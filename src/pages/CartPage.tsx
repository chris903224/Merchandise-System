import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Minus, Package, Plus, ShoppingBag, Store, Trash2 } from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import { formatPrice, isStaffRole, sumCartItems } from '../services';

export default function CartPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { session, cart, products, setCart } = useApp();

  const subtotal = useMemo(() => sumCartItems(cart), [cart]);

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

  const clearCart = () => {
    if (!cart.length) return;
    setCart([]);
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
    navigate('/checkout');
  };

  return (
    <main
      style={{
        width: 'min(100% - 2.5rem, 78rem)',
        margin: '0 auto',
        padding: '3rem 0 4.5rem',
      }}
    >
      {/* Page header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '1.5rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ maxWidth: '48rem' }}>
          <p
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              margin: '0 0 0.7rem',
              color: 'var(--color-brand, #b3822c)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '1.2rem',
                height: '1px',
                background: 'currentColor',
              }}
            />
            Reservation list
          </p>
          <h1
            style={{
              margin: 0,
              color: 'var(--color-text, #221a10)',
              fontFamily: 'var(--font-display, "Fraunces", serif)',
              fontSize: 'clamp(1.85rem, 4vw, 3rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
            }}
          >
            Your cart
          </h1>
          <p
            style={{
              margin: '0.45rem 0 0',
              color: 'var(--color-text-muted, #675a45)',
              fontSize: '0.88rem',
            }}
          >
            Review your selected merchandise before choosing a pickup date.
          </p>
        </div>
        <Link
          to="/catalog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: 'var(--color-brand, #b3822c)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Continue shopping</span>
        </Link>
      </header>

      {/* Commerce layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(17rem, 21rem)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Cart items list */}
        <section style={{ display: 'grid', gap: '0.75rem' }} aria-label="Cart items">
          {cart.length === 0 ? (
            <div
              style={{
                display: 'grid',
                minHeight: '9.5rem',
                padding: '1.75rem 1.5rem',
                placeItems: 'center',
                alignContent: 'center',
                border: '1px dashed rgba(35, 26, 12, 0.22)',
                borderRadius: '1rem',
                background: 'rgba(255, 252, 244, 0.4)',
                textAlign: 'center',
              }}
            >
              <ShoppingBag size={44} aria-hidden="true" style={{ color: '#94855f' }} />
              <h2
                style={{
                  margin: '0.9rem 0 0',
                  color: 'var(--color-text, #221a10)',
                  fontFamily: 'var(--font-display, "Fraunces", serif)',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                Your cart is empty
              </h2>
              <p
                style={{
                  maxWidth: '28rem',
                  margin: '0.35rem 0 1.1rem',
                  color: 'var(--color-text-muted, #675a45)',
                  fontSize: '0.76rem',
                }}
              >
                Explore the catalog to reserve school uniforms, department apparel, and ID laces.
              </p>
              <Link
                to="/catalog"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '2.7rem',
                  padding: '0.65rem 1rem',
                  border: '1px solid var(--color-brand, #b3822c)',
                  borderRadius: '0.5rem',
                  background: 'var(--color-brand, #b3822c)',
                  color: '#2a1c0c',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <Store size={16} aria-hidden="true" />
                <span>Browse merchandise</span>
              </Link>
            </div>
          ) : (
            cart.map((item, index) => {
              const itemTotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
              return (
                <article
                  key={`${item.id}-${item.size}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    padding: '1rem',
                    border: '1px solid var(--color-line, rgba(35, 26, 12, 0.1))',
                    borderRadius: '1rem',
                    background: 'var(--color-surface, #fffcf4)',
                    boxShadow: '0 18px 42px rgba(35, 26, 12, 0.06)',
                  }}
                >
                  {/* Left side: image + details */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        width: '4rem',
                        height: '4rem',
                        flex: '0 0 auto',
                        placeItems: 'center',
                        border: '1px solid var(--color-line, rgba(35, 26, 12, 0.1))',
                        borderRadius: '0.75rem',
                        background: 'var(--color-surface-soft, #eee0c2)',
                        color: 'var(--color-brand, #b3822c)',
                      }}
                      aria-hidden="true"
                    >
                      <Package size={28} aria-hidden="true" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: 'var(--color-brand, #b3822c)',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.organization || 'General'}
                      </div>
                      <h2
                        style={{
                          margin: '0.25rem 0 0',
                          overflow: 'hidden',
                          color: 'var(--color-text, #221a10)',
                          fontFamily: 'var(--font-display, "Fraunces", serif)',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.name}
                      >
                        {item.name}
                      </h2>
                      <p
                        style={{
                          margin: '0.25rem 0 0',
                          color: 'var(--color-text-muted, #675a45)',
                          fontSize: '0.72rem',
                        }}
                      >
                        Variant: <strong>{item.size || 'N/A'}</strong>
                      </p>
                      <p
                        style={{
                          margin: '0.25rem 0 0',
                          color: 'var(--color-brand, #b3822c)',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.72rem',
                        }}
                      >
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                  </div>

                  {/* Right side: qty, total, delete */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem',
                        border: '1px solid var(--color-line, rgba(35, 26, 12, 0.1))',
                        borderRadius: '0.5rem',
                        background: 'var(--color-surface-raised, #faf2e0)',
                      }}
                      aria-label={`Quantity for ${item.name}`}
                    >
                      <button
                        type="button"
                        onClick={() => updateQty(index, -1)}
                        aria-label="Decrease quantity"
                        style={{
                          display: 'grid',
                          width: '1.8rem',
                          height: '1.8rem',
                          placeItems: 'center',
                          border: 0,
                          background: 'transparent',
                          color: 'var(--color-text-muted, #675a45)',
                          cursor: 'pointer',
                          borderRadius: '0.5rem',
                        }}
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <span
                        style={{
                          minWidth: '1.75rem',
                          color: 'var(--color-text, #221a10)',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textAlign: 'center',
                        }}
                      >
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(index, 1)}
                        aria-label="Increase quantity"
                        style={{
                          display: 'grid',
                          width: '1.8rem',
                          height: '1.8rem',
                          placeItems: 'center',
                          border: 0,
                          background: 'transparent',
                          color: 'var(--color-text-muted, #675a45)',
                          cursor: 'pointer',
                          borderRadius: '0.5rem',
                        }}
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>

                    <div
                      style={{
                        minWidth: '5.5rem',
                        color: 'var(--color-text, #221a10)',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textAlign: 'right',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          marginBottom: '0.15rem',
                          color: 'var(--color-text-subtle, #94855f)',
                          fontFamily: 'var(--font-body, "Inter", sans-serif)',
                          fontSize: '0.64rem',
                          fontWeight: 500,
                        }}
                      >
                        Line total
                      </span>
                      {formatPrice(itemTotal)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label={`Remove ${item.name}`}
                      style={{
                        display: 'grid',
                        width: '2.35rem',
                        height: '2.35rem',
                        placeItems: 'center',
                        border: '1px solid var(--color-line, rgba(35, 26, 12, 0.1))',
                        borderRadius: '0.5rem',
                        background: 'var(--color-surface-raised, #faf2e0)',
                        color: 'var(--color-text-muted, #675a45)',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Summary panel */}
        <aside
          style={{
            position: 'sticky',
            top: '5.5rem',
            display: 'grid',
            gap: '1.25rem',
            padding: '1.25rem',
            border: '1px solid var(--color-line-strong, rgba(35, 26, 12, 0.2))',
            borderRadius: '1rem',
            background: 'var(--color-surface-raised, #faf2e0)',
            boxShadow: '0 18px 42px rgba(35, 26, 12, 0.1)',
          }}
          aria-labelledby="summary-title"
        >
          <h2
            id="summary-title"
            style={{
              margin: 0,
              paddingBottom: '0.9rem',
              borderBottom: '1px solid var(--color-line, rgba(35, 26, 12, 0.1))',
              color: 'var(--color-text, #221a10)',
              fontFamily: 'var(--font-display, "Fraunces", serif)',
              fontSize: '1.05rem',
              fontWeight: 700,
            }}
          >
            Reservation summary
          </h2>

          <div style={{ display: 'grid', gap: '0.65rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                color: 'var(--color-text-muted, #675a45)',
                fontSize: '0.78rem',
              }}
            >
              <span>Items subtotal</span>
              <strong
                style={{
                  color: 'var(--color-text, #221a10)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.75rem',
                }}
              >
                {formatPrice(subtotal)}
              </strong>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                color: 'var(--color-text-muted, #675a45)',
                fontSize: '0.78rem',
              }}
            >
              <span>Claim & processing fee</span>
              <strong
                style={{
                  color: 'var(--color-success, #3c7a54)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.75rem',
                }}
              >
                FREE
              </strong>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                paddingTop: '0.9rem',
                borderTop: '1px solid var(--color-line, rgba(35, 26, 12, 0.1))',
                color: 'var(--color-text, #221a10)',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
            >
              <span>Total estimated</span>
              <strong
                style={{
                  color: 'var(--color-brand, #b3822c)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '1.12rem',
                  fontWeight: 700,
                }}
              >
                {formatPrice(subtotal)}
              </strong>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.55rem' }}>
            <button
              type="button"
              onClick={proceedToCheckout}
              disabled={!cart.length}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                minHeight: '2.7rem',
                padding: '0.65rem 1rem',
                border: '1px solid var(--color-brand, #b3822c)',
                borderRadius: '0.5rem',
                background: 'var(--color-brand, #b3822c)',
                color: '#2a1c0c',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: cart.length ? 'pointer' : 'not-allowed',
                opacity: cart.length ? 1 : 0.68,
              }}
            >
              <span>Proceed to checkout</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={clearCart}
              disabled={!cart.length}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                minHeight: '2.7rem',
                padding: '0.65rem 1rem',
                border: '1px solid var(--color-line, rgba(35, 26, 12, 0.1))',
                borderRadius: '0.5rem',
                background: 'transparent',
                color: 'var(--color-text-muted, #675a45)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: cart.length ? 'pointer' : 'not-allowed',
                opacity: cart.length ? 1 : 0.68,
              }}
            >
              Clear entire cart
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              padding: '0.85rem',
              border: '1px solid rgba(63, 106, 134, 0.28)',
              borderRadius: '0.75rem',
              background: 'rgba(63, 106, 134, 0.12)',
              color: 'var(--color-info, #3f6a86)',
              fontSize: '0.72rem',
              lineHeight: 1.55,
            }}
          >
            <MapPin size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>All orders are reserved for pickup on campus. Uniform items are not delivered.</span>
          </div>
        </aside>
      </div>
    </main>
  );
}