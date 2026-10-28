// src/pages/admin/ProductsPage.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, X } from 'lucide-react'; // ✅ Idinagdag ang Search at X
import { AdminPageHeader, AdminChip, AdminModal } from '../../components/admin';
import {
  getProducts,
  updateProduct,
  addProduct,
} from '../../services/admin';
import type { AdminProduct } from '../../store/adminStore';

const FILTERS = [
  { id: 'all', label: 'All Products' },
  { id: 'uniforms', label: 'Uniforms' },
  { id: 'shirts', label: 'Shirts' },
  { id: 'laces', label: 'ID Laces' },
  { id: 'low-stock', label: 'Low Stock' },
];

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

const ITEMS_PER_PAGE = 12; // ✅ Idinagdag para sa pagination

export default function ProductsPage() {
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState(''); // ✅ Idinagdag ang state para sa search
  const [currentPage, setCurrentPage] = useState(1); // ✅ Idinagdag ang state para sa page

  // Data state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [stockProduct, setStockProduct] = useState<AdminProduct | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await getProducts(filter);
        if (!cancelled) setProducts(data);
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
     SEARCH & PAGINATION LOGIC
     ============================================ */
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
  }, [products, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  
  const rangeStart = filteredProducts.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(safePage * ITEMS_PER_PAGE, filteredProducts.length);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, safePage]);

  // Reset page kapag nag-search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  /* ============================================
     HANDLERS
     ============================================ */
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

      {/* Filters */}
      <div className="admin-filter-row">
        {FILTERS.map((f) => (
          <AdminChip
            key={f.id}
            label={f.label}
            active={filter === f.id}
            onClick={() => {
              setFilter(f.id);
              setCurrentPage(1);
            }}
          />
        ))}
      </div>

      {/* Search Bar */}
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
            background: '#292828',
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

      {/* Results summary */}
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

      {/* Products grid */}
      <div className="admin-shop-grid">
        {isLoading ? (
          <p className="admin-empty">Loading products…</p>
        ) : filteredProducts.length === 0 ? (
          <p className="admin-empty">No products found.</p>
        ) : (
          paginatedProducts.map((p) => (
            <article key={p.id} className="admin-shop-card">
              <div className="admin-shop-card__image">
                <img src={p.img} alt={p.name} loading="lazy" />
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

      {/* Pagination Controls */}
      {filteredProducts.length > ITEMS_PER_PAGE && (
        <div className="admin-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            className="admin-btn admin-btn--ghost"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            Previous
          </button>
          <span style={{ fontSize: '13px', color: 'var(--admin-ink-500)' }}>
            Page {safePage} of {totalPages}
          </span>
          <button
            className="admin-btn admin-btn--ghost"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* ============================================
          EDIT MODAL
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

                const sizes = Array.from(
                  form.querySelectorAll<HTMLInputElement>(
                    'input[name="sizes"]:checked'
                  )
                ).map((cb) => cb.value);

                handleSaveEdit({
                  name: String(fd.get('name')),
                  category: String(fd.get('category')),
                  price: Number(fd.get('price')),
                  sizes, 
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
                  <option>Uniforms</option>
                  <option>Shirts</option>
                  <option>ID Laces</option>
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
          ADD MODAL
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
                  sizes, 
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
                <option>Uniforms</option>
                <option>Shirts</option>
                <option>ID Laces</option>
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