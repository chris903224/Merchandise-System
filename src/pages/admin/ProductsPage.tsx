// src/pages/admin/ProductsPage.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { AdminPageHeader, AdminChip, AdminModal } from '../../components/admin';
import {
  getProducts,
  updateProduct,
  addProduct,
  getProductCategories,
} from '../../services/admin';
import type { AdminProduct } from '../../store/adminStore';

/* ✅ Items per page */
const ITEMS_PER_PAGE = 8;

/* ✅ Common sizes for reference */
const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export default function ProductsPage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data state
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [stockProduct, setStockProduct] = useState<AdminProduct | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  /* ============================================
     LOAD CATEGORIES (async)
     ============================================ */
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const cats = await getProductCategories();
        if (!cancelled) setCategories(cats);
      } catch (error) {
        console.error('[ProductsPage] Failed to load categories:', error);
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /* ============================================
     LOAD PRODUCTS (async)
     ============================================ */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await getProducts(filter);
        if (!cancelled) setAllProducts(data);
      } catch (error) {
        console.error('[ProductsPage] Failed to load:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filter, refreshKey]);

  /* ============================================
     RESET PAGE ON FILTER / SEARCH CHANGE
     ============================================ */
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  /* ============================================
     SEARCH + PAGINATION
     ============================================ */
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const q = searchQuery.toLowerCase().trim();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.organization?.toLowerCase().includes(q) ?? false)
    );
  }, [allProducts, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, safePage]);

  const rangeStart = filteredProducts.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(safePage * ITEMS_PER_PAGE, filteredProducts.length);

  /* ============================================
     CATEGORY COUNTS (computed from ALL products)
     ============================================ */
  const [allForCounts, setAllForCounts] = useState<AdminProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        const data = await getProducts('all');
        if (!cancelled) setAllForCounts(data);
      } catch {
        // counts will just be 0
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allForCounts) {
      const cat = p.category || 'Other';
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [allForCounts]);

  const lowStockCount = useMemo(() => {
    return allForCounts.filter(
      (p) => p.stockState === 'low-stock' || p.stockState === 'out'
    ).length;
  }, [allForCounts]);

  /* ============================================
     HANDLERS
     ============================================ */

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setSearchQuery('');
  };

  const handleSaveEdit = useCallback(
    async (updates: Partial<AdminProduct>) => {
      if (!editingProduct) return;

      setIsSubmitting(true);
      try {
        await updateProduct(editingProduct.id, updates);
        setEditingProduct(null);
        setRefreshKey((k) => k + 1);
      } catch (error) {
        console.error('[ProductsPage] Failed to update product:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingProduct]
  );

  const handleSaveStock = useCallback(
    async (stock: number) => {
      if (!stockProduct) return;

      setIsSubmitting(true);
      try {
        const safeStock = Math.max(0, stock);
        await updateProduct(stockProduct.id, { stock: safeStock });
        setStockProduct(null);
        setRefreshKey((k) => k + 1);
      } catch (error) {
        console.error('[ProductsPage] Failed to update stock:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [stockProduct]
  );

  const handleAdd = useCallback(
    async (data: Omit<AdminProduct, 'id' | 'stockState' | 'stockLabel'>) => {
      setIsSubmitting(true);
      try {
        await addProduct(data);
        setIsAddOpen(false);
        setRefreshKey((k) => k + 1);
      } catch (error) {
        console.error('[ProductsPage] Failed to add product:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  /* ============================================
     ALL CATEGORIES for modal dropdowns
     (includes Interest Based Organizations)
     ============================================ */
  const allCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of allForCounts) {
      if (p.category) set.add(p.category);
    }
    // Also ensure categories from the filter list are included
    for (const cat of categories) {
      set.add(cat);
    }
    // Always include Interest Based Organizations as an option
    set.add('Interest Based Organizations');
    return Array.from(set).sort();
  }, [allForCounts, categories]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Inventory"
        title="Product Management"
        description="Add, edit, and manage all products in the SJCM Store."
        actions={
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="react-icon" />
            Add Product
          </button>
        }
      />

      {/* ✅ Dynamic Filter Row */}
      <div
        className="admin-filter-row"
        style={{ overflowX: 'auto', paddingBottom: '4px' }}
      >
        {/* All Products */}
        <AdminChip
          label="All Products"
          active={filter === 'all'}
          onClick={() => handleFilterChange('all')}
          count={allForCounts.length}
        />

        {/* Dynamic category chips */}
        {categories.map((cat) => (
          <AdminChip
            key={cat}
            label={cat}
            active={filter === cat}
            onClick={() => handleFilterChange(cat)}
            count={categoryCounts[cat] ?? 0}
          />
        ))}

        {/* Low Stock */}
        <AdminChip
          label="Low Stock"
          active={filter === 'low-stock'}
          onClick={() => handleFilterChange('low-stock')}
          count={lowStockCount}
        />
      </div>

      {/* ✅ Search Bar */}
      <div className="admin-search-bar" style={{
        position: 'relative',
        marginTop: '12px',
        marginBottom: '4px',
        maxWidth: '400px',
      }}>
        <Search
          className="react-icon"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: 'var(--admin-ink-400)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 36px 10px 38px',
            border: '1px solid var(--admin-line)',
            borderRadius: 'var(--admin-radius-sm)',
            fontSize: '13px',
            fontFamily: 'inherit',
            background: '#fff',
            color: 'var(--admin-ink-900)',
            outline: 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--admin-brand-400)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--admin-line)';
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--admin-ink-400)',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Clear search"
          >
            <X className="react-icon" style={{ width: '14px', height: '14px' }} />
          </button>
        )}
      </div>

      {/* ✅ Results summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        fontSize: '13px',
        color: 'var(--admin-ink-500)',
      }}>
        <span>
          {isLoading
            ? 'Loading products…'
            : filteredProducts.length === 0
              ? 'No products found'
              : `Showing ${rangeStart}–${rangeEnd} of ${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* ✅ Products grid */}
      <div className="admin-shop-grid">
        {isLoading ? (
          <p className="admin-empty">Loading products…</p>
        ) : filteredProducts.length === 0 ? (
          <p className="admin-empty">
            {searchQuery
              ? `No products matching "${searchQuery}" in this category.`
              : 'No products in this category.'}
          </p>
        ) : (
          paginatedProducts.map((p) => (
            <article key={p.id} className="admin-shop-card">
              <div className="admin-shop-card__image">
                <img src={p.img} alt={p.name} loading="lazy" />
                {/* ✅ Category badge overlay */}
                <span
                  className="admin-badge admin-badge--in-stock"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    zIndex: 2,
                    fontSize: '10.5px',
                    padding: '3px 8px',
                    background: 'var(--admin-pine-800)',
                    color: '#fff',
                  }}
                >
                  {p.category}
                </span>
              </div>
              <div className="admin-shop-card__body">
                <span className={`admin-badge admin-badge--${p.stockState}`}>
                  {p.stockState === 'in-stock'
                    ? 'In Stock'
                    : p.stockState === 'low-stock'
                      ? 'Low Stock'
                      : 'Out of Stock'}
                </span>
                <h3 className="admin-shop-card__name">{p.name}</h3>
                <p className="admin-shop-card__category">{p.category}</p>

                {/* ✅ Display Sizes */}
                {p.sizes && p.sizes.length > 0 && (
                  <p className="admin-shop-card__sizes">
                    <strong>Sizes:</strong> {p.sizes.join(', ')}
                  </p>
                )}

                <div className="admin-shop-card__row">
                  <span className="admin-shop-card__price">
                    ₱ {p.price.toLocaleString()}
                  </span>
                  <span className="admin-shop-card__stock">{p.stockLabel}</span>
                </div>
                <div className="admin-shop-card__actions">
                  <button onClick={() => setEditingProduct(p)}>Edit</button>
                  <button onClick={() => setStockProduct(p)}>Stock</button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ✅ Pagination */}
      {filteredProducts.length > ITEMS_PER_PAGE && (
        <div
          className="admin-pagination"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            marginTop: '24px',
            paddingBottom: '16px',
          }}
        >
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label="Previous page"
            style={{ minWidth: '36px', padding: '6px' }}
          >
            <ChevronLeft className="react-icon" style={{ width: '16px', height: '16px' }} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`admin-btn ${page === safePage ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
              onClick={() => setCurrentPage(page)}
              aria-label={`Page ${page}`}
              aria-current={page === safePage ? 'page' : undefined}
              style={{
                minWidth: '36px',
                padding: '6px 10px',
                fontSize: '13px',
                fontWeight: page === safePage ? 700 : 500,
              }}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            aria-label="Next page"
            style={{ minWidth: '36px', padding: '6px' }}
          >
            <ChevronRight className="react-icon" style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      {/* ============================================
          EDIT MODAL — with Sizes
      ============================================ */}
      <AdminModal
        open={Boolean(editingProduct)}
        title="Edit Product"
        onClose={() => !isSubmitting && setEditingProduct(null)}
        footer={
          <>
            <button
              className="admin-btn admin-btn--ghost"
              onClick={() => setEditingProduct(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn--primary"
              disabled={isSubmitting}
              onClick={() => {
                const form = document.getElementById(
                  'editProductForm'
                ) as HTMLFormElement;
                if (!form) return;
                const fd = new FormData(form);

                /* ✅ Extract sizes from checked checkboxes */
                const sizes = Array.from(
                  form.querySelectorAll<HTMLInputElement>(
                    'input[name="sizes"]:checked'
                  )
                ).map((cb) => cb.value);

                handleSaveEdit({
                  name: String(fd.get('name')),
                  category: String(fd.get('category')),
                  price: Number(fd.get('price')),
                  sizes, // ✅ Include sizes
                });
              }}
            >
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editingProduct && (
          <form id="editProductForm">
            <div className="admin-modal__field">
              <label>Name</label>
              <input name="name" defaultValue={editingProduct.name} />
            </div>

            <div className="admin-modal__grid-2">
              <div className="admin-modal__field">
                <label>Category</label>
                <select name="category" defaultValue={editingProduct.category}>
                  {allCategoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-modal__field">
                <label>Price (₱)</label>
                <input
                  name="price"
                  type="number"
                  defaultValue={editingProduct.price}
                />
              </div>
            </div>

            {/* ✅ SIZES FIELD */}
            <div className="admin-modal__field">
              <label>Sizes</label>
              <div className="admin-modal__sizes">
                {COMMON_SIZES.map((size) => {
                  const isChecked =
                    editingProduct.sizes?.includes(size) ?? false;
                  return (
                    <label key={size} className="admin-modal__size-chip">
                      <input
                        type="checkbox"
                        name="sizes"
                        value={size}
                        defaultChecked={isChecked}
                      />
                      <span>{size}</span>
                    </label>
                  );
                })}
              </div>
              <p className="admin-modal__hint">
                Select all available sizes for this product.
              </p>
            </div>
          </form>
        )}
      </AdminModal>

      {/* ============================================
          STOCK MODAL
      ============================================ */}
      <AdminModal
        open={Boolean(stockProduct)}
        title="Update Stock"
        onClose={() => !isSubmitting && setStockProduct(null)}
        footer={
          <>
            <button
              className="admin-btn admin-btn--ghost"
              onClick={() => setStockProduct(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn--primary"
              disabled={isSubmitting}
              onClick={() => {
                const input = document.getElementById(
                  'stockInput'
                ) as HTMLInputElement;
                handleSaveStock(Math.max(0, Number(input?.value) || 0));
              }}
            >
              {isSubmitting ? 'Saving…' : 'Save Stock'}
            </button>
          </>
        }
      >
        {stockProduct && (
          <div className="admin-modal__field">
            <label>
              Stock count — <strong>{stockProduct.name}</strong>
            </label>
            <input
              id="stockInput"
              type="number"
              min="0"
              defaultValue={stockProduct.stock}
            />
          </div>
        )}
      </AdminModal>

      {/* ============================================
          ADD MODAL — with Sizes
      ============================================ */}
      <AdminModal
        open={isAddOpen}
        title="Add New Product"
        onClose={() => !isSubmitting && setIsAddOpen(false)}
        footer={
          <>
            <button
              className="admin-btn admin-btn--ghost"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn--primary"
              disabled={isSubmitting}
              onClick={() => {
                const form = document.getElementById(
                  'addProductForm'
                ) as HTMLFormElement;
                if (!form) return;
                const fd = new FormData(form);
                const name = String(fd.get('name')).trim();
                const price = Number(fd.get('price'));
                if (!name || !price) return;

                /* ✅ Extract sizes from checked checkboxes */
                const sizes = Array.from(
                  form.querySelectorAll<HTMLInputElement>(
                    'input[name="sizes"]:checked'
                  )
                ).map((cb) => cb.value);

                handleAdd({
                  name,
                  category: String(fd.get('category')),
                  price,
                  stock: Math.max(0, Number(fd.get('stock')) || 0),
                  sizes, // ✅ Include sizes
                  img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=70',
                });
              }}
            >
              {isSubmitting ? 'Adding…' : 'Add Product'}
            </button>
          </>
        }
      >
        <form id="addProductForm">
          <div className="admin-modal__field">
            <label>Name</label>
            <input name="name" placeholder="e.g. SHS General Uniform" />
          </div>

          <div className="admin-modal__grid-2">
            <div className="admin-modal__field">
              <label>Category</label>
              <select name="category">
                {allCategoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-modal__field">
              <label>Price (₱)</label>
              <input name="price" type="number" placeholder="500" />
            </div>
          </div>

          <div className="admin-modal__field">
            <label>Initial Stock</label>
            <input name="stock" type="number" placeholder="30" />
          </div>

          {/* ✅ SIZES FIELD */}
          <div className="admin-modal__field">
            <label>Sizes</label>
            <div className="admin-modal__sizes">
              {COMMON_SIZES.map((size) => (
                <label key={size} className="admin-modal__size-chip">
                  <input type="checkbox" name="sizes" value={size} />
                  <span>{size}</span>
                </label>
              ))}
            </div>
            <p className="admin-modal__hint">
              Select all available sizes for this product.
            </p>
          </div>
        </form>
      </AdminModal>
    </>
  );
}