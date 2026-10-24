// src/components/organization/ProductCard.tsx

import { Icon } from '../Icon';
import { peso } from '../../utils/format';
import ProductImage from './ProductImage';
import type { Product } from '../../types';

const LOW = 10;
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL'];

function totalStock(p: Product): number {
  if (p.sizeStocks && Object.keys(p.sizeStocks).length > 0) {
    return Object.values(p.sizeStocks).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  return p.stock ?? 0;
}

function stockStatus(total: number): { pill: 'is-ok' | 'is-low' | 'is-out'; label: string } {
  if (total <= 0) return { pill: 'is-out', label: 'Out of stock' };
  if (total <= LOW) return { pill: 'is-low', label: 'Low stock' };
  return { pill: 'is-ok', label: 'In stock' };
}

// XS → S → M → L → XL instead of whatever order the object keys happen to be in
function sizeRank(s: string): number {
  const i = SIZE_ORDER.indexOf(s.toUpperCase());
  return i === -1 ? 100 : i;
}

function level(n: number): 'ok' | 'low' | 'out' {
  if (n <= 0) return 'out';
  if (n <= LOW) return 'low';
  return 'ok';
}

export default function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: () => void;
}) {
  const total = totalStock(product);
  const status = stockStatus(total);

  const sizes = Object.entries(product.sizeStocks || {})
    .filter(([s]) => s !== 'N/A')
    .map(([s, n]) => [s, Number(n) || 0] as [string, number])
    .sort(
      (a, b) =>
        sizeRank(a[0]) - sizeRank(b[0]) ||
        a[0].localeCompare(b[0], undefined, { numeric: true })
    );

  // Bars are relative to the fullest size, so the thin ones stand out at a glance
  const peak = Math.max(1, ...sizes.map(([, n]) => n));

  return (
    <article className="pc">
      <div
        className="pm"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        aria-label={`Manage ${product.name}`}
      >
        <ProductImage product={product} />

        <span className={`stock-badge ${status.pill}`}>
          <span className="dot" aria-hidden="true" />
          {status.label}
        </span>

        <span className="pm-hint">View details</span>
      </div>

      <div className="pb">
        <b className="p-title" title={product.name}>
          {product.name}
        </b>

        <div className="p-category">
          <Icon name="tag" />
          <span className="cat">{product.category}</span>
          {product.organization && <span className="org-chip">{product.organization}</span>}
        </div>

        <div className="sp-row">
          <div className="sp-col">
            <small>Price</small>
            <strong className="price">{peso(product.price)}</strong>
          </div>
          <div className="sp-col right">
            <small>Total stock</small>
            <strong className={`stock ${status.pill}`}>
              {total.toLocaleString()}
              <em> units</em>
            </strong>
          </div>
        </div>

        {sizes.length > 0 ? (
          <div className="sizes-wrap">
            <small>Stock by size</small>
            <div className="sizes-grid">
              {sizes.map(([s, n]) => (
                <div key={s} className={`size-box ${level(n)}`} title={`${s}: ${n} left`}>
                  <b>{n}</b>
                  <span className="size-label">{s}</span>
                  <span className="size-bar" aria-hidden="true">
                    <span style={{ width: `${n > 0 ? Math.max(8, (n / peak) * 100) : 0}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="sizes-wrap">
            <small>Stock by size</small>
            <p className="sizes-empty">One size, no variants</p>
          </div>
        )}

        <div className="pc-actions">
          <button type="button" className="manage-btn" onClick={onOpen}>
            <Icon name="box" /> Manage stock
          </button>
        </div>
      </div>
    </article>
  );
}