// src/pages/ProductPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Heart,
  PackageX,
  Minus,
  Plus,
  Store,
  ShieldCheck,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { useApp, useProducts } from '../store';
import { useToast } from '../toast';
import { useNotificationStore } from '../store/notificationStore';
import { useFavoritesStore } from '../store/favoritesStore';
import ProductImage from '../components/ProductImage';
import { formatPrice, getStockBadge } from '../services';
import { createNotification } from '../services/notifications';
import { canUserOrderProduct } from '../utils/restrictions'; // ✅ IDAGDAG

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', '2XL'];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const products = useProducts();
  const { cart, setCart, session } = useApp();

  const product = useMemo(
    () => products.find((p) => p.id === id),
    [products, id]
  );

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [isToggling, setIsToggling] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'size' | 'return'>(
    'details'
  );

  /* ✅ Global favorites store */
  const favIds = useFavoritesStore((s) => s.favIds);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const isFav = product ? favIds.has(product.id) : false;

  /* ✅ I-load ang favorites pagka-mount */
  useEffect(() => {
    if (session?.id) {
      void loadFavorites(session.id);
    }
  }, [session?.id, loadFavorites]);

  /* ✅ Product images */
  const productImages = useMemo(() => {
    if (!product) return [];
    const imgs = (product as any).images;
    if (Array.isArray(imgs) && imgs.length > 0) return imgs as string[];
    return [null];
  }, [product]);

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

  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  const sizeStocks: Record<string, number> = (product as any)?.sizeStocks ?? {};

  const selectedSizeStock =
    selectedSize && sizeStocks[selectedSize] !== undefined
      ? Number(sizeStocks[selectedSize])
      : Number(product?.stock) || 0;

  const qtyInCartForSize = useMemo(() => {
    if (!product || !selectedSize) return 0;
    return cart
      .filter((item) => item.id === product.id && item.size === selectedSize)
      .reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }, [cart, product, selectedSize]);

  const availableForUser = Math.max(0, selectedSizeStock - qtyInCartForSize);
  const isSizeOutOfStock = selectedSizeStock <= 0;
  const isAllInCart = selectedSizeStock > 0 && availableForUser === 0;

  // ✅ COURSE RESTRICTION CHECK (Pinalakas base sa seed.ts)
  const userCourse = (session as any)?.course || (session as any)?.course_strand || '';
  const isAllowed = canUserOrderProduct(
    userCourse,
    product?.organization,
    product?.category
  );

  /* ✅ DEBUG LOG (Tanggalin mo nalang pag okay na sa prod) */
  useEffect(() => {
    if (product) {
      console.log('[Restriction Debug] User Course:', userCourse);
      console.log('[Restriction Debug] Product Org:', product.organization);
      console.log('[Restriction Debug] Is Allowed?:', isAllowed);
    }
  }, [userCourse, product, isAllowed]);

  useEffect(() => {
    if (qty > availableForUser && availableForUser > 0) {
      setQty(availableForUser);
    }
    if (availableForUser === 0 && qty !== 1) {
      setQty(1);
    }
  }, [availableForUser, qty]);

  useEffect(() => {
    setSelectedSize('');
    setQty(1);
    setActiveImageIndex(0);
    setActiveTab('details');
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

  /* ✅ Toggle favorite */
  const handleToggleFavorite = async () => {
    if (!session?.id) {
      toast('Please sign in to add favorites.', 'warning');
      return;
    }
    if (isToggling) return;

    setIsToggling(true);

    try {
      const nowFav = await toggleFavorite(session.id, product.id);

      if (nowFav) {
        const notificationId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `temp-${Date.now()}`;

        addNotification({
          id: notificationId,
          userId: session.id,
          type: 'info' as const,
          title: 'Added to Favorites ❤️',
          message: `${product.name} has been added to your favorites.`,
          link: '/favorites',
          actionLabel: 'View Favorites',
          read: false,
          metadata: { productId: product.id },
          createdAt: new Date().toISOString(),
        });

        try {
          await createNotification(session.id, {
            type: 'info',
            title: 'Added to Favorites ❤️',
            message: `${product.name} has been added to your favorites.`,
            link: '/favorites',
            actionLabel: 'View Favorites',
            metadata: { productId: product.id },
          });
        } catch (err) {
          console.error('[Product] Failed to save notification:', err);
        }

        toast(`${product.name} added to favorites!`, 'success');
      } else {
        toast('Removed from favorites', 'info');
      }
    } catch (err) {
      console.error('[Product] Favorite toggle failed:', err);
      toast('Failed to update favorites.', 'danger');
    } finally {
      setIsToggling(false);
    }
  };

  /* ✅ Add to cart */
  const handleAddToCart = () => {
    // ✅ I-BLOCK KUNG RESTRICTED
    if (!isAllowed) {
      toast(
        `Restricted: As a ${userCourse || 'student'}, you cannot order ${product.organization} merchandise.`,
        'danger'
      );
      return;
    }

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

  const goToPrevImage = () =>
    setActiveImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1
    );
  const goToNextImage = () =>
    setActiveImageIndex((prev) =>
      prev === productImages.length - 1 ? 0 : prev + 1
    );

  return (
    <main className="product-page">
      <div className="product-container">
        {/* BREADCRUMB */}
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <Link to="/catalog" className="product-breadcrumb__link">
            Back to catalog
          </Link>
          <ChevronRight className="react-icon" aria-hidden="true" />
          <Link to="/catalog" className="product-breadcrumb__link">
            {product.category}
          </Link>
          <ChevronRight className="react-icon" aria-hidden="true" />
          <span className="product-breadcrumb__current">{product.name}</span>
        </nav>

        {/* ✅ RESTRICTION BANNER (kung bawal) */}
        {!isAllowed && (
          <div className="product-restriction-banner">
            <Lock className="react-icon" aria-hidden="true" />
            <div>
              <strong>Restricted Item</strong>
              <p>
                As a <strong>{userCourse || 'student'}</strong>, you can only
                order merchandise from your own course organization. This item
                belongs to <strong>{product.organization}</strong>, which is
                not available for your course.
              </p>
            </div>
          </div>
        )}

        {/* MAIN LAYOUT — gallery (left) + info panel (right) */}
        <div className="product-layout">
          {/* LEFT — GALLERY */}
          <div className="product-gallery">
            <div className="product-gallery__stage">
              <ProductImage
                product={product}
                className="product-gallery__image"
                width={800}
                height={800}
              />

              {/* Badge */}
              <span className={`product-gallery__badge ${badge.className}`}>
                {badge.text}
              </span>

              {/* Wishlist */}
              <button
                type="button"
                className={`product-gallery__wish ${
                  isFav ? 'is-active' : ''
                }`}
                aria-label={
                  isFav ? 'Remove from favorites' : 'Add to favorites'
                }
                onClick={handleToggleFavorite}
                disabled={isToggling}
              >
                <Heart
                  className="react-icon"
                  fill={isFav ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
              </button>

              {/* Prev / Next */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="product-gallery__nav product-gallery__nav--prev"
                    onClick={goToPrevImage}
                    aria-label="Previous image"
                  >
                    <ArrowLeft className="react-icon" />
                  </button>
                  <button
                    type="button"
                    className="product-gallery__nav product-gallery__nav--next"
                    onClick={goToNextImage}
                    aria-label="Next image"
                  >
                    <ArrowRight className="react-icon" />
                  </button>
                </>
              )}

              {/* Dots */}
              {productImages.length > 1 && (
                <div className="product-gallery__dots">
                  {productImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`product-gallery__dot ${
                        idx === activeImageIndex ? 'is-active' : ''
                      }`}
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails — horizontal below image */}
            {productImages.length > 1 && (
              <div className="product-gallery__thumbs">
                {productImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`product-gallery__thumb ${
                      idx === activeImageIndex ? 'is-active' : ''
                    }`}
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <ProductImage
                      product={product}
                      className="product-gallery__thumb-image"
                      width={80}
                      height={80}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — INFO PANEL (single cohesive card) */}
          <div className="product-panel">
            <div className="product-panel__inner">
              {/* Eyebrow + Title + Price — tight group */}
              <p className="product-panel__eyebrow">{product.organization}</p>
              <h1 className="product-panel__title">{product.name}</h1>
              <p className="product-panel__price">
                {formatPrice(product.price)}
              </p>

              {/* Description */}
              <p className="product-panel__description">
                {product.description}
              </p>

              {/* Inline trust — hindi na separate cards */}
              <ul className="product-panel__trust-inline">
                <li>
                  <Store className="react-icon" aria-hidden="true" />
                  <span>Campus Pickup — Free</span>
                </li>
                <li>
                  <ShieldCheck className="react-icon" aria-hidden="true" />
                  <span>Verified Stock</span>
                </li>
                <li>
                  <Lock className="react-icon" aria-hidden="true" />
                  <span>Secure Checkout</span>
                </li>
              </ul>

              {/* Size picker */}
              {availableSizes.length > 0 && availableSizes[0] !== 'N/A' && (
                <div className="product-panel__group">
                  <label className="product-panel__label">
                    Select size / variant
                  </label>
                  <div className="product-panel__variants">
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
                          disabled={isOut || !isAllowed}
                          title={
                            isOut
                              ? `${size} — Out of stock`
                              : `${size} — ${sizeStock} available`
                          }
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + Inventory */}
              <div className="product-panel__row">
                <div className="product-panel__field">
                  <label className="product-panel__label">Quantity</label>
                  <div className="product-qty">
                    <button
                      type="button"
                      className="product-qty__btn"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      disabled={qty <= 1 || !isAllowed}
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
                      disabled={qty >= availableForUser || isSizeOutOfStock || !isAllowed}
                      aria-label="Increase quantity"
                    >
                      <Plus className="react-icon" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="product-panel__field">
                  <label className="product-panel__label">
                    Inventory availability
                  </label>
                  <p
                    className={`product-panel__stock ${
                      isSizeOutOfStock ? 'is-out' : ''
                    }`}
                  >
                    <span className="product-panel__stock-dot" />
                    {isAllInCart
                      ? `All ${selectedSizeStock} in cart`
                      : isSizeOutOfStock
                      ? `Size ${selectedSize} out of stock`
                      : `${availableForUser} item${
                          availableForUser === 1 ? '' : 's'
                        } remaining (Size ${selectedSize})`}
                  </p>
                </div>
              </div>

              {/* Warnings */}
              {qtyInCartForSize > 0 && !isAllInCart && (
                <p className="product-panel__notice product-panel__notice--warning">
                  ⚠️ Already {qtyInCartForSize} of size {selectedSize} in cart.
                  Only {availableForUser} more available.
                </p>
              )}

              {/* CTA */}
              <button
                type="button"
                className={`product-panel__cta ${!isAllowed ? 'product-panel__cta--restricted' : ''}`}
                onClick={handleAddToCart}
                disabled={isSizeOutOfStock || availableForUser <= 0 || !isAllowed}
              >
                {!isAllowed ? (
                  <Lock className="react-icon" aria-hidden="true" />
                ) : (
                  <ShoppingCart className="react-icon" aria-hidden="true" />
                )}
                <span>
                  {!isAllowed
                    ? 'Restricted for Your Course'
                    : isSizeOutOfStock
                    ? 'Out of Stock'
                    : isAllInCart
                    ? 'Max Quantity in Cart'
                    : 'Add to cart'}
                </span>
                {isAllowed && (
                  <ArrowRight className="react-icon" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TABS — full-width, nasa ilalim ng layout */}
        <section className="product-tabs">
          <div className="product-tabs__header">
            {[
              { id: 'details', label: 'Details' },
              { id: 'size', label: 'Size Guide' },
              { id: 'return', label: 'Return Policy' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`product-tabs__tab ${
                  activeTab === tab.id ? 'is-active' : ''
                }`}
                onClick={() =>
                  setActiveTab(tab.id as 'details' | 'size' | 'return')
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="product-tabs__content">
            {activeTab === 'details' && <p>{product.description}</p>}
            {activeTab === 'size' && (
              <p>
                Sizes available: <strong>{availableSizes.join(', ')}</strong>.
                Measurements follow standard school uniform sizing.
              </p>
            )}
            {activeTab === 'return' && (
              <p>
                Returns accepted within 7 days of pickup. Item must be unworn,
                unwashed, and in original packaging.
              </p>
            )}
          </div>
        </section>

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