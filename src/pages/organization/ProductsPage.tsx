// src/pages/organization/ProductsPage.tsx

import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store';
import StatCard from '../../components/organization/StatCard';
import ProductCard from '../../components/organization/ProductCard';
import ProductFilters from '../../components/organization/ProductFilters';
import AddProductForm from '../../components/organization/AddProductForm';
import { Icon } from '../../components/Icon';
import type { Product } from '../../types';
import type { ProductFiltersState } from '../../types/organization';
import '../../styles/organization/index.css';

const PER_PAGE = 12;
const LOW = 10;

const DEFAULT_FILTERS: ProductFiltersState = {
  category: 'ALL',
  stock: 'ALL',
  sort: 'featured',
  page: 1,
  search: '',
};

/* ============================================================
   ANIMATED NUMBER HOOK
   ============================================================ */
function useAnimatedNumber(target: number) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) return;

    const duration = 1000; 
    const startTime = performance.now();

    const updateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    };

    requestAnimationFrame(updateNumber);
  }, [target]);

  return count.toLocaleString();
}

function totalStock(p: Product): number {
  if (p.sizeStocks && Object.keys(p.sizeStocks).length > 0) {
    return Object.values(p.sizeStocks).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  return p.stock ?? 0;
}

function pageList(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}

export default function ProductsPage() {
  const { session, products, addProduct } = useApp();
  const org = session?.organization ?? '';
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_FILTERS);
  const [showAdd, setShowAdd] = useState(false);

  const mine = useMemo(() => products, [products]);

  const categories = useMemo(
    () => [...new Set(mine.map((p) => p.category))].sort(),
    [mine]
  );

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    let r = mine.filter((p) => {
      const matchesSearch =
        !term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
      const matchesCategory = filters.category === 'ALL' || p.category === filters.category;

      const total = totalStock(p);
      const matchesStock =
        filters.stock === 'ALL' ||
        (filters.stock === 'IN' && total > 0) ||
        (filters.stock === 'LOW' && total > 0 && total <= LOW) ||
        (filters.stock === 'OUT' && total <= 0);

      return matchesSearch && matchesCategory && matchesStock;
    });

    const sorters: Record<string, (a: Product, b: Product) => number> = {
      sa: (a, b) => totalStock(a) - totalStock(b),
      sd: (a, b) => totalStock(b) - totalStock(a),
      n: (a, b) => a.name.localeCompare(b.name),
      pa: (a, b) => a.price - b.price,
    };

    if (sorters[filters.sort]) {
      r = [...r].sort(sorters[filters.sort]);
    }

    return r;
  }, [mine, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(filters.page, totalPages);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const units = filtered.reduce((t: number, p: Product) => t + totalStock(p), 0);
  const lowCount = filtered.filter((p) => {
    const t = totalStock(p);
    return t > 0 && t <= LOW;
  }).length;
  const outCount = filtered.filter((p) => totalStock(p) <= 0).length;

  // Gamitin ang animated hook
  const animatedUnits = useAnimatedNumber(units);
  const animatedLow = useAnimatedNumber(lowCount);
  const animatedOut = useAnimatedNumber(outCount);

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const goTo = (n: number) => {
    setFilters((f) => ({ ...f, page: n }));
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="page-products">
      <div className="ph">
        <div>
          <h2>Products</h2>
          <p>Oversee merchandise and live stock for all organizations.</p>
        </div>
        <button className="btn" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Cancel' : 'Add product'}
        </button>
      </div>

      {showAdd && (
        <AddProductForm
          organization={org}
          onCreate={async (input) => {
            const newProduct = {
              ...input,
              id: crypto.randomUUID(),
              stock: Number(input.stock) || 0,
              sizes: input.sizes || [],
              sizeStocks: input.sizeStocks || {},
            };
            await addProduct(newProduct);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="stats s3">
        <StatCard color="g2" icon="box" label="Units in stock" value={animatedUnits} />
        <StatCard color="g4" icon="info" label="Low stock" value={animatedLow} />
        <StatCard color="g5" icon="x" label="Out of stock" value={animatedOut} />
      </div>

      <ProductFilters
        filters={filters}
        categories={categories}
        products={mine}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch, page: 1 }))}
        onClear={clearFilters}
        meta={{
          from: filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1,
          to: (page - 1) * PER_PAGE + visible.length,
          total: filtered.length,
        }}
      />

      <div className="pgrid" ref={gridRef}>
        {visible.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="box" />
            </span>
            <h3>No products match these filters</h3>
            <p>Try a different category or stock level, or clear the filters to see everything.</p>
            <button type="button" className="btn" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          visible.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={() => navigate(`/org/products/${p.id}`)} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <nav className="pgn" aria-label="Pagination">
          <button
            type="button"
            className="btn sm gh"
            disabled={page <= 1}
            onClick={() => goTo(page - 1)}
            aria-label="Previous page"
          >
            <Icon name="back" />
          </button>

          {pageList(page, totalPages).map((n, i) =>
            n === '…' ? (
              <span key={`gap-${i}`} className="pgn-gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                type="button"
                key={n}
                className={`btn sm gh ${n === page ? 'on' : ''}`}
                aria-current={n === page ? 'page' : undefined}
                onClick={() => goTo(n)}
              >
                {n}
              </button>
            )
          )}

          <button
            type="button"
            className="btn sm gh"
            disabled={page >= totalPages}
            onClick={() => goTo(page + 1)}
            aria-label="Next page"
          >
            <Icon name="right" />
          </button>
        </nav>
      )}
    </section>
  );
}