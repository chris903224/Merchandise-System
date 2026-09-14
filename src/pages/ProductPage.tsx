import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import ProductImage from '../components/ProductImage';
import { findProduct, formatPrice, getStockBadge, isStaffRole } from '../services';
import type { CartItem } from '../types';

// Configurable constants
const DEFAULT_SIZE = 'N/A';
const DEFAULT_QUANTITY = 1;
const ROUTES = {
  CATALOG: '/catalog',
  LOGIN: '/login',
} as const;

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { session, cart, products, setCart } = useApp();

  const product = useMemo(() => findProduct(products, id), [products, id]);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const activeSize = selectedSize ?? product?.sizes?.[0] ?? DEFAULT_SIZE;

  if (!product) {
    return (
      <main className="page-shell page-shell--narrow">
        <Link to={ROUTES.CATALOG} className="text-link print-hidden" style={{ marginBottom: '1.25rem' }}>
          <ArrowLeft className="react-icon" aria-hidden="true" />
          <span>Back to catalog</span>
        </Link>
        <div className="empty-state">
          <AlertTriangle className="react-icon" aria-hidden="true" />
          <h2 className="empty-state__title">Product not found</h2>
          <p className="empty-state__description">
            The requested item may have been removed from the campus catalog.
          </p>
          <Link to={ROUTES.CATALOG} className="button button--primary">Return to catalog</Link>
        </div>
      </main>
    );
  }

  const badge = getStockBadge(product.stock);
  const outOfStock = Number(product.stock) <= 0;
  const hasVariants = Array.isArray(product.sizes) && product.sizes.length > 0 && product.sizes[0] !== DEFAULT_SIZE;

  const handleAddToCart = () => {
    if (!session) {
      toast('Please sign in to add items to your cart.', 'warning');
      navigate(ROUTES.LOGIN);
      return;
    }
    if (isStaffRole(session.role)) {
      toast('Admin and staff accounts cannot place merchandise orders.', 'warning');
      return;
    }

    const existingIndex = cart.findIndex(
      (item) => item.id === product.id && item.size === activeSize,
    );

    if (existingIndex > -1) {
      if (cart[existingIndex].qty + DEFAULT_QUANTITY > product.stock) {
        toast(`Cannot add more. Only ${product.stock} in stock.`, 'warning');
        return;
      }
      setCart(
        cart.map((item, index) =>
          index === existingIndex 
            ? { ...item, qty: item.qty + DEFAULT_QUANTITY } 
            : item,
        ),
      );
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        organization: product.organization,
        size: activeSize,
        qty: DEFAULT_QUANTITY,
      };
      setCart([...cart, newItem]);
    }

    toast(`${product.name} added to cart.`, 'success');
  };

  return (
    <main className="page-shell page-shell--narrow">
      <Link to={ROUTES.CATALOG} className="text-link" style={{ marginBottom: '1.25rem' }}>
        <ArrowLeft className="react-icon" aria-hidden="true" />
        <span>Back to catalog</span>
      </Link>

      <div className="product-detail">
        <div className="product-visual">
          <ProductImage
            product={product}
            className="product-visual__image"
            width={800}
            height={800}
          />
          <span className={`product-visual__badge ${badge.className}`}>{badge.text}</span>
        </div>

        <section className="product-panel" aria-labelledby="product-title">
          <p className="product-eyebrow">{product.organization}</p>
          <h1 id="product-title" className="product-title">{product.name}</h1>
          <p className="product-price">{formatPrice(product.price)}</p>
          <p className="product-description">{product.description}</p>

          {hasVariants && (
            <div className="variant-group">
              <span className="field-label" id="variant-label">Select size / variant</span>
              <div className="variant-list" role="group" aria-labelledby="variant-label">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className="variant-button"
                    data-size={size}
                    aria-pressed={activeSize === size}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="inventory-row">
            <span>Inventory availability</span>
            <strong>{outOfStock ? '0 items remaining' : `${product.stock} items remaining`}</strong>
          </div>

          <button
            type="button"
            className="button button--primary button--block product-cta"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            <ShoppingCart className="react-icon" aria-hidden="true" />
            <span>{outOfStock ? 'Out of stock' : 'Add to cart'}</span>
          </button>
        </section>
      </div>
    </main>
  );
}