// src/pages/CatalogPage.tsx

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { useProducts, useApp } from '../store';
import { useToast } from '../toast';
import ProductImage from '../components/ProductImage';
import { formatPrice, getStockBadge } from '../services';
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
  const { cart, setCart } = useApp();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') ?? 'ALL');
  const [stock, setStock] = useState<StockFilter>('ALL');
  const [sort, setSort] = useState<SortOption>('featured');

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (value === 'ALL') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  // ============================================
  // ADD TO CART
  // ============================================
  const addToCart = (product: Product) => {
    const stockCount = Number(product.stock) || 0;
    if (stockCount <= 0) {
      toast('This item is out of stock.', 'warning');
      return;
    }

    // Hanapin kung nasa cart na (same id)
    const existingIndex = cart.findIndex((item) => item.id === product.id);

    if (existingIndex !== -1) {
      // Nasa cart na → increment qty
      const existing = cart[existingIndex];
      const currentQty = Number(existing.qty) || 0;

      if (currentQty + 1 > stockCount) {
        toast(`Stock limit reached. Only ${stockCount} available.`, 'warning');
        return;
      }

      const nextCart = [...cart];
      nextCart[existingIndex] = { ...existing, qty: currentQty + 1 };
      setCart(nextCart);
      toast(`${product.name} quantity updated in cart.`, 'success');
    } else {
      // Bago → add sa cart
      const newItem: any = {
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        qty: 1,
        size: (product as any).sizes?.[0] || (product as any).size || 'N/A',
        organization: product.organization,
        category: product.category,
      };

      setCart([...cart, newItem]);
      toast(`${product.name} added to cart!`, 'success');
    }
  };

  // Categories list + count
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

  // Filtered + sorted
  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const result = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.organization.toLowerCase().includes(normalizedQuery);
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
              onChange={(e) => setQuery(e.target.value)}
            />
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

        {/* BODY: categories card + product grid */}
        <div className="catalog-body">
          {/* Categories card */}
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

          {/* Product grid */}
          <section className="catalog-grid-section">
            <div className="catalog-results-meta">
              <span>
                Showing 1–{filtered.length} of {filtered.length} items
              </span>
              <span className="catalog-results-meta__view">
                <Grid2x2 className="react-icon" aria-hidden="true" />
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="catalog-empty">
                <PackageX className="react-icon" aria-hidden="true" />
                <h2 className="catalog-empty__title">No merchandise found</h2>
                <p className="catalog-empty__description">
                  Try another search term or adjust the availability filters.
                </p>
              </div>
            ) : (
              <div className="catalog-grid">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
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
                <button type="button" className="catalog-pagination__btn">2</button>
                <button type="button" className="catalog-pagination__btn">3</button>
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
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
}) {
  const badge = getStockBadge(product.stock);
  const isOutOfStock = (Number(product.stock) || 0) <= 0;

  return (
    <article className="catalog-card">
      <Link
        to={`/products/${encodeURIComponent(product.id)}`}
        className="catalog-card__media"
        aria-label={`View ${product.name}`}
      >
        <ProductImage
          product={product}
          className="catalog-card__image"
          width={400}
          height={400}
        />
        <span className={`catalog-card__badge ${badge.className}`}>{badge.text}</span>
        <button
          type="button"
          className="catalog-card__wish"
          aria-label="Add to wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Heart className="react-icon" aria-hidden="true" />
        </button>
      </Link>

      <div className="catalog-card__body">
        <p className="catalog-card__name" title={product.name}>
          {product.name}
        </p>
        <p className="catalog-card__category">{product.category}</p>
        <p className="catalog-card__price">{formatPrice(product.price)}</p>
        <button
          type="button"
          className="catalog-card__cta"
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="react-icon" aria-hidden="true" />
          <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
        </button>
      </div>
    </article>
  );
}