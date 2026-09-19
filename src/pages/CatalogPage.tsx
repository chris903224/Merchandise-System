// src/pages/CatalogPage.tsx

import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PackageX,
  Search,
  ShoppingCart,
  Heart,
  Grid2x2,
  Shirt,
  Badge,
  Package2,
  Store,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useProducts, useApp } from '../store';
import { useToast } from '../toast';
import { useNotificationStore } from '../store/notificationStore';
import ProductImage from '../components/ProductImage';
import { formatPrice, getStockBadge } from '../services';
import { toggleFavorite, fetchFavorites } from '../services/favorites';
import { createNotification } from '../services/notifications';
import type { Product } from '../types';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name';

const categoryIcons: Record<string, typeof Grid2x2> = {
  ALL: Grid2x2,
  'School Uniform': Shirt,
  'PE Uniform': Shirt,
  'Org Uniform': Shirt,
  'ID Lace': Badge,
  Other: Package2,
};

export default function CatalogPage() {
  const products = useProducts();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================
  // STATE — naka-sync sa URL
  // ============================================
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? 'ALL');
  const [stock, setStock] = useState<StockFilter>('ALL');
  const [sort, setSort] = useState<SortOption>('featured');

  // ============================================
  // ✅ CRITICAL: SYNC QUERY MULA URL
  // ============================================
  useEffect(() => {
    const urlQuery = searchParams.get('q') ?? '';
    setQuery(urlQuery);

    const urlCategory = searchParams.get('category') ?? 'ALL';
    setCategory(urlCategory);
  }, [searchParams]);

  // ============================================
  // HANDLERS — nag-u-update ng URL
  // ============================================
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (value === 'ALL') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (value) {
      searchParams.set('q', value);
    } else {
      searchParams.delete('q');
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleClearSearch = () => {
    setQuery('');
    searchParams.delete('q');
    setSearchParams(searchParams, { replace: true });
  };

  const goToProduct = (product: Product) => {
    navigate(`/products/${encodeURIComponent(product.id)}`);
  };

  // ============================================
  // CATEGORIES LIST
  // ============================================
  const categoryList = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const key = p.category || 'Other';
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    const list = Array.from(map.entries()).map(([label, count]) => ({
      label,
      value: label,
      count,
    }));
    return [{ label: 'All Items', value: 'ALL', count: products.length }, ...list];
  }, [products]);

  // ============================================
  // FILTERED + SORTED
  // ============================================
  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const result = products.filter((product) => {
      const matchesSearch =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.organization.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        (product.description?.toLowerCase().includes(normalizedQuery) ?? false);

      const matchesCategory = category === 'ALL' || product.category === category;

      const stockCount = Number(product.stock) || 0;
      const matchesStock =
        stock === 'ALL' ||
        (stock === 'IN_STOCK' && stockCount > 0) ||
        (stock === 'LOW_STOCK' && stockCount > 0 && stockCount <= 10) ||
        (stock === 'OUT_OF_STOCK' && stockCount <= 0);

      return matchesSearch && matchesCategory && matchesStock;
    });

    if (sort === 'price-asc') result.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price-desc') result.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, query, category, stock, sort]);

  return (
    <main className="catalog-page">
      <div className="catalog-container">
        {/* HERO */}
        <header className="catalog-hero">
          <div className="catalog-hero__copy">
            <p className="catalog-hero__kicker">SJCM Store</p>
            <h1 className="catalog-hero__title">Browse the Catalog</h1>
            <p className="catalog-hero__description">
              Official school uniforms, apparel, and organization merchandise for campus pickup.
            </p>
          </div>
          <div className="catalog-hero__quote">
            <span>"Wear your</span>
            <span>Saint Jude Pride"</span>
          </div>
        </header>

        {/* TOOLBAR */}
        <div className="catalog-toolbar">
          <div className="catalog-toolbar__search">
            <Search className="react-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search products, categories, or organization..."
              aria-label="Search products"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="catalog-toolbar__clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X className="react-icon" aria-hidden="true" />
              </button>
            )}
          </div>
          <select
            className="catalog-toolbar__select"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="ALL">All Categories</option>
            {categoryList
              .filter((c) => c.value !== 'ALL')
              .map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
          </select>
          <select
            className="catalog-toolbar__select"
            value={stock}
            onChange={(e) => setStock(e.target.value as StockFilter)}
            aria-label="Filter by availability"
          >
            <option value="ALL">All Availability</option>
            <option value="IN_STOCK">In stock only</option>
            <option value="LOW_STOCK">Low stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
          <select
            className="catalog-toolbar__select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sort by"
          >
            <option value="featured">Sort by: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>

        {/* SEARCH SUMMARY */}
        {query && (
          <div className="catalog-search-summary">
            <span>
              <strong>{filtered.length}</strong>{' '}
              {filtered.length === 1 ? 'result' : 'results'} for "{query}"
            </span>
            <button
              type="button"
              className="catalog-search-summary__clear"
              onClick={handleClearSearch}
            >
              <X className="react-icon" aria-hidden="true" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="catalog-body">
          <aside className="catalog-categories">
            <div className="catalog-categories__card">
              <p className="catalog-categories__title">Categories</p>
              <ul className="catalog-categories__list">
                {categoryList.map((cat) => {
                  const Icon = categoryIcons[cat.value] || Grid2x2;
                  const isActive = category === cat.value;
                  return (
                    <li key={cat.value}>
                      <button
                        type="button"
                        className={`catalog-category ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleCategoryChange(cat.value)}
                      >
                        <span className="catalog-category__icon">
                          <Icon className="react-icon" aria-hidden="true" />
                        </span>
                        <span className="catalog-category__label">{cat.label}</span>
                        <span className="catalog-category__count">{cat.count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="catalog-categories__note">
              <Store className="react-icon" aria-hidden="true" />
              <p className="catalog-categories__note-title">Official SJCM Merchandise</p>
              <p className="catalog-categories__note-text">
                Authorized. Quality. For the Saint Jude Community.
              </p>
            </div>
          </aside>

          <section className="catalog-grid-section">
            <div className="catalog-results-meta">
              <span>
                {filtered.length === 0
                  ? 'No results'
                  : `Showing 1–${filtered.length} of ${filtered.length} item${
                      filtered.length === 1 ? '' : 's'
                    }`}
              </span>
              <span className="catalog-results-meta__view">
                <Grid2x2 className="react-icon" aria-hidden="true" />
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="catalog-empty">
                <PackageX className="react-icon" aria-hidden="true" />
                <h2 className="catalog-empty__title">
                  {query ? `No results for "${query}"` : 'No merchandise found'}
                </h2>
                <p className="catalog-empty__description">
                  {query
                    ? 'Try a different search term or clear the search.'
                    : 'Try another search term or adjust the availability filters.'}
                </p>
                {query && (
                  <button
                    type="button"
                    className="catalog-empty__cta"
                    onClick={handleClearSearch}
                  >
                    <X className="react-icon" aria-hidden="true" />
                    <span>Clear search</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="catalog-grid">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={goToProduct}
                  />
                ))}
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="catalog-pagination">
                <button type="button" className="catalog-pagination__btn" disabled>
                  <ChevronLeft className="react-icon" aria-hidden="true" />
                </button>
                <button type="button" className="catalog-pagination__btn is-active">
                  1
                </button>
                <button type="button" className="catalog-pagination__btn">
                  <ChevronRight className="react-icon" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

// ============================================
// PRODUCT CARD
// ============================================
function ProductCard({
  product,
  onSelectProduct,
}: {
  product: Product;
  onSelectProduct: (product: Product) => void;
}) {
  const { session } = useApp();
  const toast = useToast();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [isFav, setIsFav] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const badge = getStockBadge(product.stock);
  const isOutOfStock = (Number(product.stock) || 0) <= 0;

  // ============================================
  // ✅ LOAD FAVORITE STATE ON MOUNT
  // ============================================
  useEffect(() => {
    if (!session?.id) return;

    let cancelled = false;

    const checkFav = async () => {
      try {
        const favorites = await fetchFavorites(session.id);
        if (!cancelled) {
          setIsFav(favorites.some((f) => f.product_id === product.id));
        }
      } catch (error) {
        console.warn('[Catalog] Failed to check favorite:', error);
      }
    };

    void checkFav();

    return () => {
      cancelled = true;
    };
  }, [session?.id, product.id]);

  // ============================================
  // ✅ TOGGLE FAVORITE — with optimistic notification
  // ============================================
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.id) {
      toast('Please sign in to add favorites.', 'warning');
      return;
    }

    if (isToggling) return;

    setIsToggling(true);
    const wasFav = isFav;

    // Optimistic UI update
    setIsFav(!wasFav);

    try {
      const nowFav = await toggleFavorite(session.id, product.id, wasFav);
      setIsFav(nowFav);

      // ✅ Kapag nag-add (hindi kapag nag-remove)
      if (nowFav) {
        // 1️⃣ INSTANT — optimistic add sa notification store
        const notificationId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const optimisticNotification = {
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
        };

        // Instant bell update
        addNotification(optimisticNotification);

        // 2️⃣ Save sa Supabase (background)
        try {
          await createNotification(session.id, {
            type: 'info',
            title: 'Added to Favorites ❤️',
            message: `${product.name} has been added to your favorites.`,
            link: '/favorites',
            actionLabel: 'View Favorites',
            metadata: { productId: product.id },
          });
        } catch (error) {
          console.error('[Catalog] Failed to save notification:', error);
          // Hindi na natin i-remove ang optimistic notification
          // — kasi realtime subscription ay mag-sync ulit
        }

        toast(`${product.name} added to favorites!`, 'success');
      } else {
        toast('Removed from favorites', 'info');
      }
    } catch (error) {
      console.error('[Catalog] Favorite toggle failed:', error);
      // Revert on error
      setIsFav(wasFav);
      toast('Failed to update favorites.', 'danger');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <article className="catalog-card">
      <div
        className="catalog-card__media"
        role="button"
        tabIndex={0}
        onClick={() => onSelectProduct(product)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectProduct(product);
          }
        }}
        aria-label={`View ${product.name}`}
      >
        <ProductImage
          product={product}
          className="catalog-card__image"
          width={400}
          height={400}
        />
        <span className={`catalog-card__badge ${badge.className}`}>{badge.text}</span>

        {/* ✅ HEART BUTTON — functional na */}
        <button
          type="button"
          className={`catalog-card__wish ${isFav ? 'is-active' : ''}`}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          onClick={handleToggleFavorite}
          disabled={isToggling}
        >
          <Heart
            className="react-icon"
            fill={isFav ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="catalog-card__body">
        <p className="catalog-card__name" title={product.name}>
          {product.name}
        </p>
        <p className="catalog-card__category">{product.category}</p>
        <p className="catalog-card__price">{formatPrice(product.price)}</p>

        <button
          type="button"
          className="catalog-card__cta"
          onClick={() => onSelectProduct(product)}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="react-icon" aria-hidden="true" />
          <span>{isOutOfStock ? 'Out of Stock' : 'Select Options'}</span>
        </button>
      </div>
    </article>
  );
}