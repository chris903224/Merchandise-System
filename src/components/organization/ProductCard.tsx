// src/components/organization/ProductCard.tsx

import { Icon } from '../Icon';
import { peso } from '../../utils/format';
import ProductImage from './ProductImage';
import type { Product } from '../../types';

const LOW = 10;

function totalStock(p: Product): number {
  if (p.sizeStocks && Object.keys(p.sizeStocks).length > 0) {
    return Object.values(p.sizeStocks).reduce(
      (a, b) => a + (Number(b) || 0),
      0
    );
  }
  return p.stock ?? 0;
}

function stockStatus(total: number): { pill: string; label: string } {
  if (total <= 0) return { pill: 'no', label: 'Out of Stock' };
  if (total <= LOW) return { pill: 'wa', label: 'Low Stock' };
  return { pill: 'ok', label: 'In Stock' };
}

function sizeClass(n: number): string {
  if (n <= 0) return 'no';
  if (n <= 3) return 'wa';
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
  const sizes = Object.entries(product.sizeStocks || {}).filter(([s]) => s !== 'N/A');

  return (
    <article className="glass pc">
      <div
        className="pm"
        role="button"
        tabIndex={0}
        style={{ '--pc': 'transparent' } as any} // ✅ static fallback color
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
        <span className={`pill ${status.pill} bdg`}>{status.label}</span>
      </div>

      <div className="pb">
        <b title={product.name}>{product.name}</b>
        <small>
          {product.category}
          {product.organization ? ` · ${product.organization}` : ''}
        </small>

        <div className="ls">
          <strong>{total}</strong>
          <span>units live</span>
          <em>{peso(product.price)}</em>
        </div>

        {sizes.length > 0 && (
          <div className="szs">
            {sizes.map(([s, n]) => (
              <span key={s} className={`sz ${sizeClass(Number(n))}`}>
                {s} <b>{n}</b>
              </span>
            ))}
          </div>
        )}

        <button className="btn sm gh" onClick={onOpen}>
          <Icon name="gear" style={{ width: 14, height: 14 }} />
          Manage stock
        </button>
      </div>
    </article>
  );
}