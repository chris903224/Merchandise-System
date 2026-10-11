// src/components/catalog/MobileFilterDrawer.tsx
// ✅ Full-screen filter drawer — TikTok style

import { X, Check } from 'lucide-react';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { label: string; value: string; count: number }[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  stock: StockFilter;
  onStockChange: (value: StockFilter) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  onReset: () => void;
  onApply: () => void;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  stock,
  onStockChange,
  sort,
  onSortChange,
  onReset,
  onApply,
}: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  const STOCK_OPTIONS: { value: StockFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'IN_STOCK', label: 'In Stock' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  ];

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A–Z' },
  ];

  return (
    <div className="mobile-filter-drawer" role="dialog" aria-modal="true">
      {/* Header */}
      <header className="mobile-filter-drawer__header">
        <h2 className="mobile-filter-drawer__title">Filters</h2>
        <button
          type="button"
          className="mobile-filter-drawer__close"
          onClick={onClose}
          aria-label="Close filters"
        >
          <X className="react-icon" />
        </button>
      </header>

      {/* Body */}
      <div className="mobile-filter-drawer__body">
        {/* Categories */}
        <section className="mobile-filter-section">
          <div className="mobile-filter-section__head">
            <h3 className="mobile-filter-section__title">Categories</h3>
            <span className="mobile-filter-section__count">
              Select all
            </span>
          </div>

          <ul className="mobile-filter-list">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.value;
              return (
                <li key={cat.value}>
                  <button
                    type="button"
                    className={`mobile-filter-item ${
                      isActive ? 'is-active' : ''
                    }`}
                    onClick={() => onCategoryChange(cat.value)}
                  >
                    <span
                      className={`mobile-filter-checkbox ${
                        isActive ? 'is-checked' : ''
                      }`}
                    >
                      {isActive && <Check className="react-icon" />}
                    </span>
                    <span className="mobile-filter-item__label">
                      {cat.label}
                    </span>
                    <span className="mobile-filter-item__count">
                      {cat.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Availability */}
        <section className="mobile-filter-section">
          <h3 className="mobile-filter-section__title">Availability</h3>
          <ul className="mobile-filter-list mobile-filter-list--compact">
            {STOCK_OPTIONS.map((opt) => {
              const isActive = stock === opt.value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    className={`mobile-filter-item mobile-filter-item--radio ${
                      isActive ? 'is-active' : ''
                    }`}
                    onClick={() => onStockChange(opt.value)}
                  >
                    <span
                      className={`mobile-filter-radio ${
                        isActive ? 'is-checked' : ''
                      }`}
                    />
                    <span className="mobile-filter-item__label">
                      {opt.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Sort By */}
        <section className="mobile-filter-section">
          <h3 className="mobile-filter-section__title">Sort By</h3>
          <ul className="mobile-filter-list mobile-filter-list--compact">
            {SORT_OPTIONS.map((opt) => {
              const isActive = sort === opt.value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    className={`mobile-filter-item mobile-filter-item--radio ${
                      isActive ? 'is-active' : ''
                    }`}
                    onClick={() => onSortChange(opt.value)}
                  >
                    <span
                      className={`mobile-filter-radio ${
                        isActive ? 'is-checked' : ''
                      }`}
                    />
                    <span className="mobile-filter-item__label">
                      {opt.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Footer — sticky */}
      <footer className="mobile-filter-drawer__footer">
        <button
          type="button"
          className="mobile-filter-btn mobile-filter-btn--ghost"
          onClick={onReset}
        >
          Reset
        </button>
        <button
          type="button"
          className="mobile-filter-btn mobile-filter-btn--primary"
          onClick={onApply}
        >
          Apply Filters
        </button>
      </footer>
    </div>
  );
}