// src/components/organization/ProductFilters.tsx
import type { Product } from '../../types';
import type { ProductFiltersState } from '../../types/organization';

export default function ProductFilters({
  filters,
  categories,
  products,
  onChange,
  onClear,
  meta,
}: {
  filters: ProductFiltersState;
  categories: string[];
  products: Product[];
  onChange: (patch: Partial<ProductFiltersState>) => void;
  onClear: () => void;
  meta: { from: number; to: number; total: number };
}) {
  const catCount = (cat: string) =>
    cat === 'ALL' ? products.length : products.filter((p) => p.category === cat).length;

  const active = filters.search !== '' || filters.category !== 'ALL' || filters.stock !== 'ALL';

  return (
    <div className="glass card flt">
      <span className="lbl2">Categories</span>
      <div className="chips">
        {/* 👇 Pinalitan natin ang <button> ng <div> para mawala ang default button hover */}
        <div
          className={`chip${filters.category === 'ALL' ? ' on' : ''}`}
          onClick={() => onChange({ category: 'ALL' })}
          role="button"
          tabIndex={0}
        >
          All Items <b>{catCount('ALL')}</b>
        </div>
        
        {categories.map((c) => (
          <div
            key={c}
            className={`chip${filters.category === c ? ' on' : ''}`}
            onClick={() => onChange({ category: c })}
            role="button"
            tabIndex={0}
          >
            {c} <b>{catCount(c)}</b>
          </div>
        ))}
      </div>

      <div className="tb">
        <div className="meta">
          {meta.total > 0 ? (
            <>
              Showing <b>{meta.from}–{meta.to}</b> of <b>{meta.total}</b> items
            </>
          ) : (
            'No results'
          )}
          {active && (
            <button className="btn sm gh" onClick={onClear} style={{ marginLeft: 8 }}>
              Clear filters
            </button>
          )}
        </div>

        <select
          className="in"
          value={filters.stock}
          onChange={(e) => onChange({ stock: e.target.value as ProductFiltersState['stock'] })}
        >
          <option value="ALL">All stock levels</option>
          <option value="IN">In stock</option>
          <option value="LOW">Low stock</option>
          <option value="OUT">Out of stock</option>
        </select>

        <select
          className="in"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as ProductFiltersState['sort'] })}
        >
          <option value="featured">Sort by: Featured</option>
          <option value="sa">Stock: Low to High</option>
          <option value="sd">Stock: High to Low</option>
          <option value="n">Name: A–Z</option>
          <option value="pa">Price: Low to High</option>
        </select>
      </div>
    </div>
  );
}