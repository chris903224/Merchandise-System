// src/pages/admin/ProductsPage.tsx

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { AdminPageHeader, AdminChip, AdminModal } from '../../components/admin';
import { getProducts, stockStateFromCount, stockLabelFromCount, updateProduct, addProduct } from '../../services/admin';
import type { AdminProduct } from '../../store/adminStore';

const FILTERS = [
  { id: 'all', label: 'All Products' },
  { id: 'uniforms', label: 'Uniforms' },
  { id: 'shirts', label: 'Shirts' },
  { id: 'laces', label: 'ID Laces' },
  { id: 'low-stock', label: 'Low Stock' },
];

export default function ProductsPage() {
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [stockProduct, setStockProduct] = useState<AdminProduct | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const products = useMemo(() => getProducts(filter), [filter, refreshKey]);

  const handleSaveEdit = (updates: Partial<AdminProduct>) => {
    if (!editingProduct) return;
    updateProduct(editingProduct.id, updates);
    setEditingProduct(null);
    setRefreshKey((k) => k + 1);
  };

  const handleSaveStock = (stock: number) => {
    if (!stockProduct) return;
    updateProduct(stockProduct.id, {
      stock,
      stockState: stockStateFromCount(stock),
      stockLabel: stockLabelFromCount(stock),
    });
    setStockProduct(null);
    setRefreshKey((k) => k + 1);
  };

  const handleAdd = (data: Omit<AdminProduct, 'id' | 'stockState' | 'stockLabel'>) => {
    addProduct({
      ...data,
      stockState: stockStateFromCount(data.stock),
      stockLabel: stockLabelFromCount(data.stock),
    });
    setIsAddOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Inventory"
        title="Product Management"
        description="Add, edit, and manage all products in the SJCM Store."
        actions={
          <button className="admin-btn admin-btn--primary" onClick={() => setIsAddOpen(true)}>
            <Plus className="react-icon" />
            Add Product
          </button>
        }
      />

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

      <div className="admin-shop-grid">
        {products.length === 0 ? (
          <p className="admin-empty">No products in this category.</p>
        ) : (
          products.map((p) => (
            <article key={p.id} className="admin-shop-card">
              <div className="admin-shop-card__image">
                <img src={p.img} alt={p.name} loading="lazy" />
              </div>
              <div className="admin-shop-card__body">
                <span className={`admin-badge admin-badge--${p.stockState}`}>
                  {p.stockState === 'in-stock' ? 'In Stock' : p.stockState === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                </span>
                <h3 className="admin-shop-card__name">{p.name}</h3>
                <p className="admin-shop-card__category">{p.category}</p>
                <div className="admin-shop-card__row">
                  <span className="admin-shop-card__price">₱ {p.price.toLocaleString()}</span>
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

      {/* EDIT MODAL */}
      <AdminModal
        open={Boolean(editingProduct)}
        title="Edit Product"
        onClose={() => setEditingProduct(null)}
        footer={
          <>
            <button className="admin-btn admin-btn--ghost" onClick={() => setEditingProduct(null)}>Cancel</button>
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => {
                const form = document.getElementById('editProductForm') as HTMLFormElement;
                if (!form) return;
                const fd = new FormData(form);
                handleSaveEdit({
                  name: String(fd.get('name')),
                  category: String(fd.get('category')),
                  price: Number(fd.get('price')),
                });
              }}
            >
              Save Changes
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
                  <option>Uniforms</option><option>Shirts</option><option>ID Laces</option>
                </select>
              </div>
              <div className="admin-modal__field">
                <label>Price (₱)</label>
                <input name="price" type="number" defaultValue={editingProduct.price} />
              </div>
            </div>
          </form>
        )}
      </AdminModal>

      {/* STOCK MODAL */}
      <AdminModal
        open={Boolean(stockProduct)}
        title="Update Stock"
        onClose={() => setStockProduct(null)}
        footer={
          <>
            <button className="admin-btn admin-btn--ghost" onClick={() => setStockProduct(null)}>Cancel</button>
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => {
                const input = document.getElementById('stockInput') as HTMLInputElement;
                handleSaveStock(Math.max(0, Number(input?.value) || 0));
              }}
            >
              Save Stock
            </button>
          </>
        }
      >
        {stockProduct && (
          <div className="admin-modal__field">
            <label>Stock count — <strong>{stockProduct.name}</strong></label>
            <input id="stockInput" type="number" min="0" defaultValue={stockProduct.stock} />
          </div>
        )}
      </AdminModal>

      {/* ADD MODAL */}
      <AdminModal
        open={isAddOpen}
        title="Add New Product"
        onClose={() => setIsAddOpen(false)}
        footer={
          <>
            <button className="admin-btn admin-btn--ghost" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => {
                const form = document.getElementById('addProductForm') as HTMLFormElement;
                if (!form) return;
                const fd = new FormData(form);
                const name = String(fd.get('name')).trim();
                const price = Number(fd.get('price'));
                if (!name || !price) return;
                handleAdd({
                  name,
                  category: String(fd.get('category')),
                  price,
                  stock: Math.max(0, Number(fd.get('stock')) || 0),
                  img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=70',
                });
              }}
            >
              Add Product
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
              <select name="category"><option>Uniforms</option><option>Shirts</option><option>ID Laces</option></select>
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
        </form>
      </AdminModal>
    </>
  );
}