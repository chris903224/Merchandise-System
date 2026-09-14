import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, PackageX, Search } from 'lucide-react';
import { useProducts } from '../store';
import ProductImage from '../components/ProductImage';
import { formatPrice, getStockBadge } from '../services';
import type { Product } from '../types';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export default function CatalogPage() {
  const products = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') ?? 'ALL');
  const [stock, setStock] = useState<StockFilter>('ALL');

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (value === 'ALL') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return products.filter((product) => {
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
  }, [products, query, category, stock]);

  return (
    <main className="page-shell catalog-layout">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="section-kicker">Merchandise desk</p>
          <h1 className="page-title">Browse the catalog</h1>
          <p className="page-description">
            School uniforms, department apparel, and lanyards available for campus pickup.
          </p>
        </div>
        <span className="results-count" aria-live="polite">
          {filtered.length} item{filtered.length === 1 ? '' : 's'} found
        </span>
      </header>

      <section className="filter-bar" aria-label="Catalog filters">
        <div className="filter-bar__search">
          <Search className="react-icon" aria-hidden="true" />
          <label className="sr-only" htmlFor="catalog-search">Search merchandise</label>
          <input
            type="search"
            id="catalog-search"
            className="field-control"
            placeholder="Search by name or organization…"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="filter-bar__controls">
          <label className="sr-only" htmlFor="filter-category">Filter by category</label>
          <select
            id="filter-category"
            value={category}
            onChange={(event) => handleCategoryChange(event.target.value)}
          >
            <option value="ALL">All categories</option>
            <option value="ID Lace">ID laces</option>
            <option value="Org Uniform">Organization uniforms</option>
            <option value="School Uniform">School uniforms</option>
          </select>
          <label className="sr-only" htmlFor="filter-stock">Filter by availability</label>
          <select
            id="filter-stock"
            value={stock}
            onChange={(event) => setStock(event.target.value as StockFilter)}
          >
            <option value="ALL">All availability</option>
            <option value="IN_STOCK">In stock only</option>
            <option value="LOW_STOCK">Low stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
        </div>
      </section>

      <section id="product-grid" className="product-grid" aria-label="Merchandise results">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <PackageX className="react-icon" aria-hidden="true" />
            <h2 className="empty-state__title">No merchandise found</h2>
            <p className="empty-state__description">
              Try another search term or adjust the availability filters.
            </p>
          </div>
        ) : (
          filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </section>
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  const badge = getStockBadge(product.stock);

  return (
    <article className="product-card">
      <Link to={`/products/${encodeURIComponent(product.id)}`} className="product-card__media" aria-label={`View ${product.name}`}>
        <ProductImage
          product={product}
          className="product-card__image"
          width={400}
          height={400}
        />
        <span className={`product-card__badge ${badge.className}`}>{badge.text}</span>
      </Link>
      <div className="product-card__body">
        <div className="product-card__meta">{product.organization}</div>
        <h2 className="product-card__title">{product.name}</h2>
        <p className="product-card__description">{product.description}</p>
      </div>
      <div className="product-card__footer">
        <div>
          <span className="product-card__price-label">Price</span>
          <span className="product-card__price">{formatPrice(product.price)}</span>
        </div>
        <Link to={`/products/${encodeURIComponent(product.id)}`} className="product-card__link">
          Details <ArrowUpRight className="react-icon" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
