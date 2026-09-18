// src/pages/ProductPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
    [products, id]
  );

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState(1);

  const availableSizes = useMemo(() => {
    if (!product) return [];
    const sizes = (product as any).sizes;
    if (Array.isArray(sizes) && sizes.length > 0) return sizes as string[];
    return DEFAULT_SIZES;
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 4);
  }, [products, product]);

  // Auto-select first size kapag may sizes at wala pang napili
  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  // Get per-size stock
  const sizeStocks: Record<string, number> = (product as any)?.sizeStocks ?? {};

  // Stock para sa napiling size (o total kung walang sizes)
  const selectedSizeStock =
    selectedSize && sizeStocks[selectedSize] !== undefined
      ? Number(sizeStocks[selectedSize])
      : Number(product?.stock) || 0;

  // Qty sa cart para sa specific size
  const qtyInCartForSize = useMemo(() => {
    if (!product || !selectedSize) return 0;
    return cart
      .filter((item) => item.id === product.id && item.size === selectedSize)
      .reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }, [cart, product, selectedSize]);

  // Available stock para sa user
  const availableForUser = Math.max(0, selectedSizeStock - qtyInCartForSize);
  const isSizeOutOfStock = selectedSizeStock <= 0;
  const isAllInCart = selectedSizeStock > 0 && availableForUser === 0;

  // Reset qty kapag lumampas
  useEffect(() => {
    if (qty > availableForUser && availableForUser > 0) {
      setQty(availableForUser);
    }
    if (availableForUser === 0 && qty !== 1) {
      setQty(1);
    }
  }, [availableForUser, qty]);

  // Reset selected size kapag nagpalit ng product
  useEffect(() => {
    setSelectedSize('');
    setQty(1);
  }, [id]);

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

  // ============================================
  // ADD TO CART
  // ============================================
  const handleAddToCart = () => {
    if (isSizeOutOfStock) {
      toast(`Size ${selectedSize} is out of stock.`, 'warning');
      return;
    }

    if (!selectedSize) {
      toast('Please select a size first.', 'warning');
      return;
    }

    if (qty > availableForUser) {
      toast(
        `Only ${availableForUser} available for size ${selectedSize}.`,
        'warning'
      );
      return;
    }

    const existingIndex = cart.findIndex(
      (item) => item.id === product.id && item.size === selectedSize
    );

    if (existingIndex !== -1) {
      const existing = cart[existingIndex];
      const newQty = (Number(existing.qty) || 0) + qty;

      if (newQty > selectedSizeStock) {
        toast(
          `Stock limit reached for size ${selectedSize}. Only ${selectedSizeStock} available.`,
          'warning'
        );
        return;
      }

      const nextCart = [...cart];
      nextCart[existingIndex] = { ...existing, qty: newQty };
      setCart(nextCart);
      toast(
        `${product.name} (${selectedSize}) quantity updated in cart.`,
        'success'
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          qty,
          size: selectedSize,
          organization: product.organization,
        } as any,
      ]);
      toast(`${product.name} (${selectedSize}) added to cart!`, 'success');
    }
  };

  return (
    <main className="product-page">
      <div className="product-container">
        <Link to="/catalog" className="product-back">
          <ArrowLeft className="react-icon" aria-hidden="true" />
          <span>Back to catalog</span>
        </Link>

        <div className="product-layout">
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

          <div className="product-info">
            <p className="product-info__eyebrow">{product.organization}</p>

            <h1 className="product-info__title">{product.name}</h1>

            <p className="product-info__price">{formatPrice(product.price)}</p>

            <div className="product-info__divider" />

            <p className="product-info__description">{product.description}</p>

            <div className="product-info__divider" />

            {/* SIZE PICKER — may per-size stock */}
            {availableSizes.length > 0 && availableSizes[0] !== 'N/A' && (
              <div className="product-info__group">
                <label className="product-info__label">
                  Select size / variant
                </label>
                <div className="product-info__variants">
                  {availableSizes.map((size) => {
                    const sizeStock = Number(sizeStocks[size] ?? 0);
                    const isOut = sizeStock <= 0;
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        className={`product-variant ${
                          isSelected ? 'is-selected' : ''
                        } ${isOut ? 'is-out' : ''}`}
                        onClick={() => !isOut && setSelectedSize(size)}
                        disabled={isOut}
                        title={
                          isOut
                            ? `${size} — Out of stock`
                            : `${size} — ${sizeStock} available`
                        }
                        style={
                          isOut
                            ? {
                                opacity: 0.4,
                                cursor: 'not-allowed',
                                textDecoration: 'line-through',
                              }
                            : undefined
                        }
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                    onClick={() =>
                      setQty(Math.min(availableForUser, qty + 1))
                    }
                    disabled={qty >= availableForUser || isSizeOutOfStock}
                    aria-label="Increase quantity"
                  >
                    <Plus className="react-icon" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="product-info__field">
                <label className="product-info__label">
                  Inventory availability
                </label>
                <p
                  className={`product-info__stock ${
                    isSizeOutOfStock ? 'is-out' : ''
                  }`}
                >
                  {isAllInCart
                    ? `All ${selectedSizeStock} in your cart`
                    : isSizeOutOfStock
                    ? `Size ${selectedSize} out of stock`
                    : `${availableForUser} item${
                        availableForUser === 1 ? '' : 's'
                      } remaining (Size ${selectedSize})`}
                </p>
              </div>
            </div>

            {qtyInCartForSize > 0 && !isAllInCart && (
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--sjcm-gold)',
                  marginTop: '0.25rem',
                }}
              >
                ⚠️ You already have {qtyInCartForSize} of size {selectedSize} in
                cart. Only {availableForUser} more available.
              </p>
            )}

            {isAllInCart && (
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--sjcm-success, #3c7a54)',
                  marginTop: '0.25rem',
                  fontWeight: 600,
                }}
              >
                ✅ You've added all available stock for size {selectedSize}.
              </p>
            )}

            <button
              type="button"
              className="product-info__cta"
              onClick={handleAddToCart}
              disabled={isSizeOutOfStock || availableForUser <= 0}
            >
              <ShoppingCart className="react-icon" aria-hidden="true" />
              <span>
                {isSizeOutOfStock
                  ? 'Out of Stock'
                  : isAllInCart
                  ? 'Max Quantity in Cart'
                  : 'Add to cart'}
              </span>
            </button>

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
                  <span className="product-trust__note">
                    Authorized merchandise
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

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
                      <span
                        className={`product-related__badge ${relatedBadge.className}`}
                      >
                        {relatedBadge.text}
                      </span>
                    </div>
                    <div className="product-related__body">
                      <p className="product-related__name">{item.name}</p>
                      <p className="product-related__price">
                        {formatPrice(item.price)}
                      </p>
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