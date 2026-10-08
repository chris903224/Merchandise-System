// src/pages/admin/ProductsPage.tsx

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
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

/* ✅ Common sizes for reference */
const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export default function ProductsPage() {
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Data state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [stockProduct, setStockProduct] = useState<AdminProduct | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  /* ============================================
     LOAD PRODUCTS (async)
     ============================================ */
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
            onClick={() => setFilter(f.id)}
          />
        ))}
      </div>

      {/* Products grid */}
      <div className="admin-shop-grid">
        {isLoading ? (
          <p className="admin-empty">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="admin-empty">No products in this category.</p>
        ) : (
          products.map((p) => (
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