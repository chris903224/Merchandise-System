// src/pages/FavoritesPage.tsx

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  ArrowLeft,
  X,
  Store,
} from 'lucide-react';
import { useApp, useProducts } from '../store';
import { useToast } from '../toast';
import { fetchFavorites, removeFavorite } from '../services/favorites';
import ProductImage from '../components/ProductImage';
import { formatPrice, getStockBadge } from '../services';
import type { Product } from '../types';
import './FavoritesPage.css';

export default function FavoritesPage() {
  const { session } = useApp();
  const products = useProducts();
  const navigate = useNavigate();
  const toast = useToast();

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // ============================================
  // LOAD FAVORITES ON MOUNT
  // ============================================
  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }

    let cancelled = false;

    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        const favorites = await fetchFavorites(session.id);
        if (!cancelled) {
          setFavoriteIds(favorites.map((f) => f.product_id));
        }
      } catch (error) {
        console.error('[Favorites] Failed to load:', error);
        toast('Failed to load favorites.', 'danger');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [session, navigate, toast]);

  // ============================================
  // REMOVE FROM FAVORITES
  // ============================================
  const handleRemove = async (productId: string, productName: string) => {
    if (!session?.id) return;

    setRemovingId(productId);

    // Optimistic update
    setFavoriteIds((prev) => prev.filter((id) => id !== productId));

    try {
      await removeFavorite(session.id, productId);
      toast(`${productName} removed from favorites`, 'info');
    } catch (error) {
      console.error('[Favorites] Failed to remove:', error);
      // Revert on error
      setFavoriteIds((prev) => [...prev, productId]);
      toast('Failed to remove favorite.', 'danger');
    } finally {
      setRemovingId(null);
    }
  };

  // ============================================
  // DERIVED — favorite products
  // ============================================
  const favoriteProducts = products.filter((p) => favoriteIds.includes(p.id));

  if (!session) return null;

  return (
    <main className="favorites-page">
      <div className="favorites-container">
        {/* BACK LINK */}
        <Link to="/catalog" className="favorites-back">
          <ArrowLeft className="react-icon" aria-hidden="true" />
          <span>Back to Catalog</span>
        </Link>

        {/* HERO */}
        <header className="favorites-hero">
          <div className="favorites-hero__copy">
            <p className="favorites-hero__kicker">Your Collection</p>
            <h1 className="favorites-hero__title">My Favorites</h1>
            <p className="favorites-hero__description">
              Products you've saved for later. Click the ❤️ to remove.
            </p>
          </div>
          <div className="favorites-hero__count">
            <Heart className="react-icon" fill="currentColor" aria-hidden="true" />
            <span>{favoriteProducts.length}</span>
          </div>
        </header>

        {/* CONTENT */}
        {isLoading ? (
          <div className="favorites-empty">
            <Heart className="react-icon" aria-hidden="true" />
            <h2>Loading favorites...</h2>
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="favorites-empty">
            <Heart className="react-icon" aria-hidden="true" />
            <h2>No favorites yet</h2>
            <p>
              Start adding products to your favorites by clicking the heart icon
              on any product in the catalog.
            </p>
            <Link to="/catalog" className="favorites-empty__cta">
              <Store className="react-icon" aria-hidden="true" />
              <span>Browse Catalog</span>
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {favoriteProducts.map((product) => (
              <FavoriteCard
                key={product.id}
                product={product}
                isRemoving={removingId === product.id}
                onRemove={() => handleRemove(product.id, product.name)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================
// FAVORITE CARD
// ============================================
function FavoriteCard({
  product,
  isRemoving,
  onRemove,
}: {
  product: Product;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  const badge = getStockBadge(product.stock);
  const isOutOfStock = (Number(product.stock) || 0) <= 0;

  return (
    <article className="favorites-card">
      <div className="favorites-card__media">
        <Link
          to={`/products/${encodeURIComponent(product.id)}`}
          className="favorites-card__image-link"
          aria-label={`View ${product.name}`}
        >
          <ProductImage
            product={product}
            className="favorites-card__image"
            width={400}
            height={400}
          />
          <span className={`favorites-card__badge ${badge.className}`}>
            {badge.text}
          </span>
        </Link>

        {/* ✅ REMOVE BUTTON */}
        <button
          type="button"
          className="favorites-card__remove"
          onClick={onRemove}
          disabled={isRemoving}
          aria-label={`Remove ${product.name} from favorites`}
        >
          <X className="react-icon" aria-hidden="true" />
        </button>
      </div>

      <div className="favorites-card__body">
        <p className="favorites-card__name" title={product.name}>
          {product.name}
        </p>
        <p className="favorites-card__category">{product.category}</p>
        <p className="favorites-card__price">{formatPrice(product.price)}</p>

        <Link
          to={`/products/${encodeURIComponent(product.id)}`}
          className={`favorites-card__cta ${isOutOfStock ? 'is-disabled' : ''}`}
          aria-disabled={isOutOfStock}
          onClick={(e) => {
            if (isOutOfStock) e.preventDefault();
          }}
        >
          <ShoppingCart className="react-icon" aria-hidden="true" />
          <span>{isOutOfStock ? 'Out of Stock' : 'Select Options'}</span>
        </Link>
      </div>
    </article>
  );
}