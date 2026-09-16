// src/pages/ProductPage.tsx

import { useMemo, useState } from 'react';
import { Link,  useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  PackageX,
  Minus,
  Plus,
  Store,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useApp, useProducts } from '../store';
import { useToast } from '../toast';
import ProductImage from '../components/ProductImage';
import { formatPrice, getStockBadge } from '../services';

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', '2XL'];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const products = useProducts();
  const { cart, setCart } = useApp();

  const product = useMemo(
    () => products.find((p) => p.id === id),
    [products, id],
  );

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState(1);

  // Available sizes — uses product.sizes if it exists, else defaults
  const availableSizes = useMemo(() => {
    if (!product) return [];
    const sizes = (product as any).sizes;
    if (Array.isArray(sizes) && sizes.length > 0) return sizes as string[];
    return DEFAULT_SIZES;
  }, [product]);

  // Related products — same category, exclude current
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 4);
  }, [products, product]);

  // Not found
  if (!product) {
    return (
      <main className="product-page">
        <div className="product-container">
          <div className="product-not-found">
            <PackageX className="react-icon" aria-hidden="true" />
            <h2 className="product-not-found__title">Product not found</h2>
            <p className="product-not-found__description">
              The item you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/catalog" className="product-not-found__cta">
              <ArrowLeft className="react-icon" aria-hidden="true" />
              <span>Back to Catalog</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const badge = getStockBadge(product.stock);
  const currentStock = Number(product.stock) || 0;
  const isOutOfStock = currentStock <= 0;

  // ============================================
  // ADD TO CART
  // ============================================
  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast('This item is out of stock.', 'warning');
      return;
    }

    if (availableSizes.length > 1 && !selectedSize) {
      toast('Please select a size first.', 'warning');
      return;
    }

    const finalSize = selectedSize || availableSizes[0] || 'N/A';

    const existingIndex = cart.findIndex(
      (item) => item.id === product.id && item.size === finalSize,
    );

    if (existingIndex !== -1) {
      const existing = cart[existingIndex];
      const newQty = (Number(existing.qty) || 0) + qty;

      if (newQty > currentStock) {
        toast(`Stock limit reached. Only ${currentStock} available.`, 'warning');
        return;
      }

      const nextCart = [...cart];
      nextCart[existingIndex] = { ...existing, qty: newQty };
      setCart(nextCart);
      toast(`${product.name} quantity updated in cart.`, 'success');
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          qty,
          size: finalSize,
          organization: product.organization,
        } as any,
      ]);
      toast(`${product.name} added to cart!`, 'success');
    }
  };

  return (
    <main className="product-page">
      <div className="product-container">
        {/* Back link */}
        <Link to="/catalog" className="product-back">
          <ArrowLeft className="react-icon" aria-hidden="true" />
          <span>Back to catalog</span>
        </Link>

        {/* PRODUCT LAYOUT */}
        <div className="product-layout">
          {/* LEFT: Image */}
          <div className="product-media">
            <div className="product-media__frame">
              <ProductImage
                product={product}
                className="product-media__image"
                width={800}
                height={800}
              />
              <span className={`product-media__badge ${badge.className}`}>
                {badge.text}
              </span>
              <button
                type="button"
                className="product-media__wish"
                aria-label="Add to wishlist"
              >
                <Heart className="react-icon" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* RIGHT: Info */}
          <div className="product-info">
            {/* Organization eyebrow */}
            <p className="product-info__eyebrow">{product.organization}</p>

            {/* Title */}
            <h1 className="product-info__title">{product.name}</h1>

            {/* Price */}
            <p className="product-info__price">{formatPrice(product.price)}</p>

            {/* Divider */}
            <div className="product-info__divider" />

            {/* Description */}
            <p className="product-info__description">{product.description}</p>

            {/* Divider */}
            <div className="product-info__divider" />

            {/* Size picker */}
            {availableSizes.length > 1 && (
              <div className="product-info__group">
                <label className="product-info__label">Select size / variant</label>
                <div className="product-info__variants">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`product-variant ${
                        selectedSize === size ? 'is-selected' : ''
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Stock */}
            <div className="product-info__row">
              <div className="product-info__field">
                <label className="product-info__label">Quantity</label>
                <div className="product-qty">
                  <button
                    type="button"
                    className="product-qty__btn"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="react-icon" aria-hidden="true" />
                  </button>
                  <span className="product-qty__value">{qty}</span>
                  <button
                    type="button"
                    className="product-qty__btn"
                    onClick={() => setQty(Math.min(currentStock, qty + 1))}
                    disabled={qty >= currentStock}
                    aria-label="Increase quantity"
                  >
                    <Plus className="react-icon" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="product-info__field">
                <label className="product-info__label">Inventory availability</label>
                <p className={`product-info__stock ${isOutOfStock ? 'is-out' : ''}`}>
                  {isOutOfStock
                    ? 'Out of stock'
                    : `${currentStock} item${currentStock === 1 ? '' : 's'} remaining`}
                </p>
              </div>
            </div>

            {/* Add to cart */}
            <button
              type="button"
              className="product-info__cta"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="react-icon" aria-hidden="true" />
              <span>{isOutOfStock ? 'Out of Stock' : 'Add to cart'}</span>
            </button>

            {/* Trust badges */}
            <div className="product-info__trust">
              <div className="product-trust">
                <span className="product-trust__icon">
                  <Store className="react-icon" aria-hidden="true" />
                </span>
                <span className="product-trust__copy">
                  <span className="product-trust__title">Campus Pickup</span>
                  <span className="product-trust__note">Free — no delivery</span>
                </span>
              </div>
              <div className="product-trust">
                <span className="product-trust__icon">
                  <ShieldCheck className="react-icon" aria-hidden="true" />
                </span>
                <span className="product-trust__copy">
                  <span className="product-trust__title">Verified Stock</span>
                  <span className="product-trust__note">Authorized merchandise</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="product-related">
            <header className="product-related__header">
              <div>
                <p className="product-related__kicker">You may also like</p>
                <h2 className="product-related__title">Related products</h2>
              </div>
              <Link to="/catalog" className="product-related__link">
                <span>View all</span>
                <ChevronRight className="react-icon" aria-hidden="true" />
              </Link>
            </header>

            <div className="product-related__grid">
              {relatedProducts.map((item) => {
                const relatedBadge = getStockBadge(item.stock);
                return (
                  <Link
                    key={item.id}
                    to={`/products/${encodeURIComponent(item.id)}`}
                    className="product-related__card"
                  >
                    <div className="product-related__media">
                      <ProductImage
                        product={item}
                        className="product-related__image"
                        width={300}
                        height={300}
                      />
                      <span className={`product-related__badge ${relatedBadge.className}`}>
                        {relatedBadge.text}
                      </span>
                    </div>
                    <div className="product-related__body">
                      <p className="product-related__name">{item.name}</p>
                      <p className="product-related__price">{formatPrice(item.price)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}