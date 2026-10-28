// src/pages/CatalogPage.tsx

import { useMemo, useState, useEffect, useRef } from 'react';
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
  SlidersHorizontal,
  X,
  Lock,
} from 'lucide-react';
import { useProducts, useApp } from '../store';
import { useToast } from '../toast';
import { useNotificationStore } from '../store/notificationStore';
import { useFavoritesStore } from '../store/favoritesStore';
import ProductImage from '../components/ProductImage';
import MobileFilterDrawer from '../components/catalog/MobileFilterDrawer';
import MobileProductCard from '../components/catalog/MobileProductCard';
import { formatPrice, getStockBadge } from '../services';
import { createNotification } from '../services/notifications';
import { canUserOrderProduct } from '../utils/restrictions';
import type { Product } from '../types';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name';

const ITEMS_PER_PAGE = 10;

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
  const resultsRef = useRef<HTMLDivElement>(null);

  const getUrlSearchTerm = () =>
    searchParams.get('search') ?? searchParams.get('q') ?? '';

  const [query, setQuery] = useState(getUrlSearchTerm());
  const [category, setCategory] = useState(
    searchParams.get('category') ?? 'ALL',
  );
  const [stock, setStock] = useState<StockFilter>('ALL');
  const [sort, setSort] = useState<SortOption>('featured');
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const { session } = useApp();
  const toast = useToast();

  /* ✅ Global favorites store */
  const favIds = useFavoritesStore((s) => s.favIds);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  useEffect(() => {
    if (session?.id) {
      void loadFavorites(session.id);
    }
  }, [session?.id, loadFavorites]);

  useEffect(() => {
    if (!session?.id) {
      useFavoritesStore.getState().clearFavorites();
    }
  }, [session?.id]);

  /* SYNC MULA URL */
  useEffect(() => {
    const urlQuery = getUrlSearchTerm();
    setQuery(urlQuery);

    const urlCategory = searchParams.get('category') ?? 'ALL';
    setCategory(urlCategory);

    const urlPage = Number(searchParams.get('page')) || 1;
    setCurrentPage(urlPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* HANDLERS */
  const setSearchParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);

    if (value === null || value === '') {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    if (key === 'search') next.delete('q');
    if (key === 'q') next.delete('search');
    if (key !== 'page') next.delete('page');

    setSearchParams(next, { replace: true });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSearchParam('category', value === 'ALL' ? null : value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setSearchParam('search', value || null);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchParam('search', null);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParam('page', page <= 1 ? null : String(page));

    if (resultsRef.current) {
      const top =
        resultsRef.current.getBoundingClientRect().top +
        window.scrollY -
        100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const goToProduct = (product: Product) => {
    navigate(`/products/${encodeURIComponent(product.id)}`);
  };

  /* ✅ Mobile favorite toggle — gamitin ang global store */
  const handleMobileFav = async (product: Product) => {
    if (!session?.id) {
      toast('Please sign in to add favorites.', 'warning');
      return;
    }
    try {
      await toggleFavorite(session.id, product.id);
    } catch {
      toast('Failed to update favorites.', 'danger');
    }
  };

  /* CATEGORIES LIST */
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
    return [
      { label: 'All Items', value: 'ALL', count: products.length },
      ...list,
    ];
  }, [products]);

  /* FILTERED + SORTED */
  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const result = products.filter((product) => {
      const matchesSearch =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.organization.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        (product.description?.toLowerCase().includes(normalizedQuery) ??
          false);

      const matchesCategory =
        category === 'ALL' || product.category === category;

      const stockCount = Number(product.stock) || 0;
      const matchesStock =
        stock === 'ALL' ||
        (stock === 'IN_STOCK' && stockCount > 0) ||
        (stock === 'LOW_STOCK' && stockCount > 0 && stockCount <= 10) ||
        (stock === 'OUT_OF_STOCK' && stockCount <= 0);

      return matchesSearch && matchesCategory && matchesStock;
    });

    if (sort === 'price-asc')
      result.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price-desc')
      result.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'name')
      result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, query, category, stock, sort]);

  /* PAGINATION */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filtered.slice(start, end);
  }, [filtered, safePage]);

  const rangeStart =
    filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(safePage * ITEMS_PER_PAGE, filtered.length);

  const hasActiveFilters =
    query !== '' || category !== 'ALL' || stock !== 'ALL';

  const handleResetAll = () => {
    handleClearSearch();
    handleCategoryChange('ALL');
    setStock('ALL');
    setSort('featured');
  };

  return (
    <main className="catalog-page">
      <div className="catalog-container">
        {/* MOBILE TOOLBAR */}
        <div className="mobile-only mobile-catalog-toolbar">
          <div className="mobile-catalog-search">
            <Search className="react-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search products..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search products"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X className="react-icon" />
              </button>
            )}
          </div>

          <button
            type="button"
            className="mobile-catalog-filter-btn"
            onClick={() => setShowFilterDrawer(true)}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="react-icon" />
          </button>
        </div>

        {/* MOBILE CATEGORY CHIPS */}
        <div className="mobile-only mobile-catalog-chips">
          {categoryList.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`mobile-catalog-chip ${
                category === cat.value ? 'is-active' : ''
              }`}
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* MOBILE RESULTS COUNT */}
        <div className="mobile-only mobile-catalog-meta">
          {filtered.length === 0
            ? 'No results'
            : (
              <>
                Showing <strong>{rangeStart}–{rangeEnd}</strong> of{' '}
                <strong>{filtered.length}</strong> item
                {filtered.length === 1 ? '' : 's'}
              </>
            )}
        </div>

        {/* MOBILE PRODUCT GRID */}
        {filtered.length > 0 && (
          <div className="mobile-only mobile-catalog-grid">
            {paginatedItems.map((product) => (
              <MobileProductCard
                key={product.id}
                product={product}
                isFav={favIds.has(product.id)}
                onToggleFav={handleMobileFav}
              />
            ))}
          </div>
        )}

        {/* MOBILE PAGINATION */}
        {filtered.length > ITEMS_PER_PAGE && (
          <div className="mobile-only mobile-catalog-pagination">
            <button
              type="button"
              className="mobile-catalog-pagination__btn"
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="react-icon" />
            </button>

            <span className="mobile-catalog-pagination__label">
              Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              type="button"
              className="mobile-catalog-pagination__btn"
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="react-icon" />
            </button>
          </div>
        )}

        {/* MOBILE EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="mobile-only mobile-catalog-empty">
            <PackageX className="react-icon" />
            <h2>
              {query ? `No results for "${query}"` : 'No merchandise found'}
            </h2>
            <p>
              {query
                ? 'Try a different search term or clear the search.'
                : 'Try another search term or adjust the availability filters.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="mobile-catalog-empty__cta"
                onClick={handleResetAll}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* MOBILE FILTER DRAWER */}
        <MobileFilterDrawer
          isOpen={showFilterDrawer}
          onClose={() => setShowFilterDrawer(false)}
          categories={categoryList}
          selectedCategory={category}
          onCategoryChange={handleCategoryChange}
          stock={stock}
          onStockChange={setStock}
          sort={sort}
          onSortChange={setSort}
          onReset={handleResetAll}
          onApply={() => setShowFilterDrawer(false)}
        />

        {/* DESKTOP — HERO */}
        <header className="catalog-hero desktop-only">
          <div className="catalog-hero__copy">
            <p className="catalog-hero__kicker">SJCM Store</p>
            <h1 className="catalog-hero__title">Browse the Catalog</h1>
            <p className="catalog-hero__description">
              Official school uniforms, apparel, and organization merchandise
              for campus pickup.
            </p>
          </div>
          <div className="catalog-hero__quote">
            <span>"Wear your</span>
            <span>Saint Jude Pride"</span>
          </div>
        </header>

        {/* DESKTOP — TOOLBAR */}
        <div className="desktop-only catalog-toolbar">
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

        {/* DESKTOP — SEARCH SUMMARY */}
        {(query || category !== 'ALL') && (
          <div className="desktop-only catalog-search-summary">
            <span>
              {query ? (
                <>
                  <strong>{filtered.length}</strong>{' '}
                  {filtered.length === 1 ? 'result' : 'results'} for{' '}
                  <em>"{query}"</em>
                  {category !== 'ALL' && (
                    <>
                      {' '}
                      in <strong>{category}</strong>
                    </>
                  )}
                </>
              ) : (
                <>
                  <strong>{filtered.length}</strong>{' '}
                  {filtered.length === 1 ? 'result' : 'results'} in{' '}
                  <strong>{category}</strong>
                </>
              )}
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                className="catalog-search-summary__clear"
                onClick={handleResetAll}
              >
                <X className="react-icon" aria-hidden="true" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        )}

        {/* DESKTOP — BODY */}
        <div className="desktop-only catalog-body" ref={resultsRef}>
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
                        className={`catalog-category ${
                          isActive ? 'is-active' : ''
                        }`}
                        onClick={() => handleCategoryChange(cat.value)}
                      >
                        <span className="catalog-category__icon">
                          <Icon
                            className="react-icon"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="catalog-category__label">
                          {cat.label}
                        </span>
                        <span className="catalog-category__count">
                          {cat.count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="catalog-categories__note">
              <Store className="react-icon" aria-hidden="true" />
              <p className="catalog-categories__note-title">
                Official SJCM Merchandise
              </p>
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
                  : `Showing ${rangeStart}–${rangeEnd} of ${filtered.length} item${
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
                  {query
                    ? `No results for "${query}"`
                    : 'No merchandise found'}
                </h2>
                <p className="catalog-empty__description">
                  {query
                    ? 'Try a different search term or clear the search.'
                    : 'Try another search term or adjust the availability filters.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="catalog-empty__cta"
                    onClick={handleResetAll}
                  >
                    <X className="react-icon" aria-hidden="true" />
                    <span>Clear all filters</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="catalog-grid">
                {paginatedItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={goToProduct}
                  />
                ))}
              </div>
            )}

            {filtered.length > ITEMS_PER_PAGE && (
              <div className="catalog-pagination">
                <button
                  type="button"
                  className="catalog-pagination__btn"
                  onClick={() => handlePageChange(safePage - 1)}
                  disabled={safePage <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft
                    className="react-icon"
                    aria-hidden="true"
                  />
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, i) => i + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`catalog-pagination__btn ${
                      page === safePage ? 'is-active' : ''
                    }`}
                    onClick={() => handlePageChange(page)}
                    aria-label={`Page ${page}`}
                    aria-current={page === safePage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="catalog-pagination__btn"
                  onClick={() => handlePageChange(safePage + 1)}
                  disabled={safePage >= totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight
                    className="react-icon"
                    aria-hidden="true"
                  />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* ============================================
   PRODUCT CARD — desktop
============================================ */
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

  const isFav = useFavoritesStore((s) => s.favIds.has(product.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const [isToggling, setIsToggling] = useState(false);

  const badge = getStockBadge(product.stock);
  const isOutOfStock = (Number(product.stock) || 0) <= 0;

  // 🚨 Gagamit tayo ng custom logic para masigurong nakuha ang tamang course.
  const getUserCourse = () => {
    const fromSession = (session as any)?.course;
    if (fromSession && fromSession.trim() !== '') return fromSession.trim();

    const fromStorage = localStorage.getItem('sjc-course');
    if (fromStorage && fromStorage.trim() !== '') return fromStorage.trim();

    try {
      const rawSession = localStorage.getItem('sjc-session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed?.course && parsed.course.trim() !== '') {
          return parsed.course.trim();
        }
      }
    } catch (e) {
      // ignore parsing errors
    }

    return '';
  };

  const userCourse = getUserCourse();

  const isAllowed = canUserOrderProduct(
    userCourse,
    product.organization,
    product.category
  );

  const handleCardClick = () => {
    if (!isAllowed) {
      toast(
        `Restricted: As a ${userCourse || 'student'}, you can't order ${product.organization} items.`,
        'warning'
      );
      return;
    }
    onSelectProduct(product);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
            : `temp-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`;

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
        } catch (error) {
          console.error('[Catalog] Failed to save notification:', error);
        }

        toast(`${product.name} added to favorites!`, 'success');
      } else {
        toast('Removed from favorites', 'info');
      }
    } catch (error) {
      console.error('[Catalog] Favorite toggle failed:', error);
      toast('Failed to update favorites.', 'danger');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <article
      className={`catalog-card ${
        !isAllowed ? 'catalog-card--restricted' : ''
      }`}
    >
      <div
        className="catalog-card__media"
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
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
        <span className={`catalog-card__badge ${badge.className}`}>
          {badge.text}
        </span>

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

        {/* ✅ RESTRICTED BADGE OVERLAY */}
        {!isAllowed && (
          <div className="catalog-card__restricted-overlay">
            <span>🔒 Restricted for your course</span>
          </div>
        )}
      </div>

      <div className="catalog-card__body">
        <p className="catalog-card__name" title={product.name}>
          {product.name}
        </p>
        <p className="catalog-card__category">{product.category}</p>
        <p className="catalog-card__price">{formatPrice(product.price)}</p>

        <button
          type="button"
          className={`catalog-card__cta ${
            !isAllowed ? 'catalog-card__cta--restricted' : ''
          }`}
          onClick={handleCardClick}
          disabled={isOutOfStock || !isAllowed}
        >
          {!isAllowed ? (
            <Lock className="react-icon" aria-hidden="true" />
          ) : (
            <ShoppingCart className="react-icon" aria-hidden="true" />
          )}
          <span>
            {isOutOfStock
              ? 'Out of Stock'
              : !isAllowed
              ? 'Not Allowed for Your Course'
              : 'Select Options'}
          </span>
        </button>
      </div>
    </article>
  );
}