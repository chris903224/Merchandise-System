import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CircleDollarSign,
  ClipboardList,
  Clock3,
  PackageCheck,
  PackageX,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import type { Product } from '../types';
import {
  formatDate,
  formatPrice,
  getOrderDate,
  getOrderEmail,
  getOrderId,
  getOrderStatus,
  getOrderStatusBadge,
  getOrderTotal,
  getStockBadge,
  isStaffRole,
} from '../services';

/* ---- Product form helpers ---- */

type FormMode = 'idle' | 'add' | 'edit';

interface ProductDraft {
  name: string;
  category: string;
  organization: string;
  price: string;
  stock: string;
  sizes: string;
  image: string;
  imageAlt: string;
  description: string;
}

const EMPTY_DRAFT: ProductDraft = {
  name: '',
  category: 'School Uniform',
  organization: '',
  price: '',
  stock: '0',
  sizes: 'S, M, L, XL',
  image: '',
  imageAlt: '',
  description: '',
};

function draftFromProduct(product: Product): ProductDraft {
  return {
    name: product.name,
    category: product.category,
    organization: product.organization,
    price: String(product.price),
    stock: String(product.stock),
    sizes: product.sizes.join(', '),
    image: product.image,
    imageAlt: product.imageAlt,
    description: product.description,
  };
}

/* ---- Page component ---- */

export default function AdminPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    session,
    orders,
    products,
    setOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useApp();

  const [formMode, setFormMode] = useState<FormMode>('idle');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT);

  useEffect(() => {
    if (!session || !isStaffRole(session.role)) {
      toast('You do not have permission to view this page.', 'danger');
      const timer = window.setTimeout(() => navigate('/', { replace: true }), 500);
      return () => window.clearTimeout(timer);
    }
  }, [session, navigate, toast]);

  if (!session || !isStaffRole(session.role)) {
    return (
      <main className="page-shell">
        <div className="empty-state">
          <p className="empty-state__title">Access restricted</p>
        </div>
      </main>
    );
  }

  const { totalRevenue, pendingOrders, readyOrders } = useMemo(
    () => ({
      totalRevenue: orders.reduce((sum, order) => sum + getOrderTotal(order), 0),
      pendingOrders: orders.filter((order) =>
        ['Pending', 'Processing'].includes(getOrderStatus(order)),
      ).length,
      readyOrders: orders.filter((order) => getOrderStatus(order) === 'Ready for Pickup').length,
    }),
    [orders],
  );

  /* ---- Order handlers ---- */

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrderStatus(orderId, newStatus);
    toast(`Order ${orderId} updated to ${newStatus}.`, 'success');
  };

  /* ---- Product form handlers ---- */

  const setField = (key: keyof ProductDraft, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setFormMode('add');
  };

  const openEdit = (product: Product) => {
    setDraft(draftFromProduct(product));
    setEditingId(product.id);
    setFormMode('edit');
  };

  const cancelForm = () => {
    setFormMode('idle');
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleProductSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(draft.price);
    const stock = Math.max(0, Math.floor(Number(draft.stock)));

    if (!draft.name.trim() || !draft.organization.trim()) {
      toast('Product name and organization are required.', 'warning');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      toast('Please enter a valid price.', 'warning');
      return;
    }

    const product: Product = {
      id: formMode === 'edit' && editingId ? editingId : `prod-${crypto.randomUUID().split('-')[0]}`,
      name: draft.name.trim(),
      category: draft.category,
      organization: draft.organization.trim(),
      price,
      stock,
      sizes: draft.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      image: draft.image.trim(),
      imageAlt: draft.imageAlt.trim() || draft.name.trim(),
      description: draft.description.trim(),
    };

    if (formMode === 'edit') {
      updateProduct(product);
      toast(`"${product.name}" updated.`, 'success');
    } else {
      addProduct(product);
      toast(`"${product.name}" added to inventory.`, 'success');
    }
    cancelForm();
  };

  const handleDeleteProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    deleteProduct(productId);
    toast(`"${product.name}" removed from inventory.`, 'success');
  };

  /* ---- Render ---- */

  return (
    <main className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="section-kicker">Staff workspace</p>
          <h1 className="page-title">Management console</h1>
          <p className="page-description">
            Manage campus merchandise stock and keep student reservations moving toward pickup.
          </p>
        </div>
      </header>

      {/* KPI cards */}
      <section className="admin-kpi-grid" aria-label="Console overview">
        <article className="admin-kpi" style={{ '--metric-color': 'var(--color-success)' } as CSSProperties}>
          <div className="admin-kpi__top">
            <span className="admin-kpi__label">Revenue reserved</span>
            <span className="admin-kpi__icon"><CircleDollarSign className="react-icon" aria-hidden="true" /></span>
          </div>
          <strong className="metric-value">{formatPrice(totalRevenue)}</strong>
        </article>
        <article className="admin-kpi" style={{ '--metric-color': 'var(--color-warning)' } as CSSProperties}>
          <div className="admin-kpi__top">
            <span className="admin-kpi__label">Pending fulfillment</span>
            <span className="admin-kpi__icon"><Clock3 className="react-icon" aria-hidden="true" /></span>
          </div>
          <strong className="metric-value">{pendingOrders}</strong>
        </article>
        <article className="admin-kpi" style={{ '--metric-color': 'var(--color-info)' } as CSSProperties}>
          <div className="admin-kpi__top">
            <span className="admin-kpi__label">Ready for pickup</span>
            <span className="admin-kpi__icon"><PackageCheck className="react-icon" aria-hidden="true" /></span>
          </div>
          <strong className="metric-value">{readyOrders}</strong>
        </article>
      </section>

      {/* Order management */}
      <section className="admin-section" aria-labelledby="admin-orders-title">
        <div className="admin-section__header">
          <div>
            <p className="section-kicker">Fulfillment queue</p>
            <h2 id="admin-orders-title" className="section-title">Order management</h2>
            <p className="section-description">
              Update the next step for each student or staff reservation.
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Order management queue</caption>
            <thead>
              <tr>
                <th scope="col">Order ID</th>
                <th scope="col">Customer</th>
                <th scope="col">Total</th>
                <th scope="col">Payment</th>
                <th scope="col">Current status</th>
                <th scope="col" className="data-table__action">Update status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <ClipboardList className="react-icon" aria-hidden="true" />
                      <p className="empty-state__title">No orders placed yet</p>
                      <p className="empty-state__description">New campus pickup reservations will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const orderId = getOrderId(order);
                  const status = getOrderStatus(order);
                  const badge = getOrderStatusBadge(status);
                  return (
                    <tr key={orderId}>
                      <td>
                        <span className="data-table__primary font-mono">{orderId}</span>
                        <span className="data-table__secondary">{formatDate(getOrderDate(order))}</span>
                      </td>
                      <td>
                        <span className="data-table__primary">{order.customerName || '—'}</span>
                        <span className="data-table__secondary">{getOrderEmail(order)}</span>
                      </td>
                      <td className="data-table__numeric">{formatPrice(getOrderTotal(order))}</td>
                      <td>{order.paymentMethod || '—'}</td>
                      <td><span className={badge.className}>{badge.text}</span></td>
                      <td className="data-table__action">
                        <label className="sr-only" htmlFor={`status-${orderId}`}>
                          Update {orderId} status
                        </label>
                        <select
                          id={`status-${orderId}`}
                          className="table-select"
                          value={status}
                          onChange={(event) => updateOrderStatus(orderId, event.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Ready for Pickup">Ready for Pickup</option>
                          <option value="Claimed">Claimed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inventory control */}
      <section className="admin-section" aria-labelledby="admin-inventory-title">
        <div className="admin-section__header">
          <div>
            <p className="section-kicker">Stock ledger</p>
            <h2 id="admin-inventory-title" className="section-title">Inventory control</h2>
            <p className="section-description">
              Add, edit, or remove products and adjust stock before the next pickup window.
            </p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={openAdd}
            disabled={formMode !== 'idle'}
          >
            <Plus className="react-icon" aria-hidden="true" />
            <span>Add product</span>
          </button>
        </div>

        {/* Inline add / edit form */}
        {formMode !== 'idle' && (
          <div className="admin-product-form" role="region" aria-labelledby="product-form-heading">
            <div className="admin-product-form__header">
              <h3 id="product-form-heading" className="section-title" style={{ margin: 0 }}>
                {formMode === 'add' ? 'New product' : 'Edit product'}
              </h3>
              <button type="button" className="icon-button" onClick={cancelForm} aria-label="Cancel and close form">
                <X className="react-icon" aria-hidden="true" />
              </button>
            </div>

            <form className="admin-product-form__body" onSubmit={handleProductSubmit}>
              <div className="form-grid">
                {/* Full-width: name */}
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label" htmlFor="prod-name">
                    Product name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="prod-name"
                    className="field-control"
                    required
                    value={draft.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="e.g. College Department Org Polo Shirt"
                  />
                </div>

                {/* Category | Organization */}
                <div className="field">
                  <label className="field-label" htmlFor="prod-category">Category</label>
                  <select
                    id="prod-category"
                    className="field-control"
                    value={draft.category}
                    onChange={(e) => setField('category', e.target.value)}
                  >
                    <option value="ID Lace">ID Lace</option>
                    <option value="Org Uniform">Organization Uniform</option>
                    <option value="School Uniform">School Uniform</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="prod-org">
                    Organization <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="prod-org"
                    className="field-control"
                    required
                    value={draft.organization}
                    onChange={(e) => setField('organization', e.target.value)}
                    placeholder="e.g. Computer Society"
                  />
                </div>

                {/* Price | Stock */}
                <div className="field">
                  <label className="field-label" htmlFor="prod-price">
                    Price (PHP) <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="number"
                    id="prod-price"
                    className="field-control"
                    required
                    min="0"
                    step="0.01"
                    value={draft.price}
                    onChange={(e) => setField('price', e.target.value)}
                    placeholder="450.00"
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="prod-stock">
                    Stock quantity <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="number"
                    id="prod-stock"
                    className="field-control"
                    required
                    min="0"
                    step="1"
                    value={draft.stock}
                    onChange={(e) => setField('stock', e.target.value)}
                    placeholder="0"
                  />
                </div>

                {/* Sizes | Image URL */}
                <div className="field">
                  <label className="field-label" htmlFor="prod-sizes">Available sizes</label>
                  <input
                    type="text"
                    id="prod-sizes"
                    className="field-control"
                    value={draft.sizes}
                    onChange={(e) => setField('sizes', e.target.value)}
                    placeholder="S, M, L, XL, 2XL"
                  />
                  <p className="field__hint">Comma-separated. Use "N/A" for one-size items.</p>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="prod-image">Image URL</label>
                  <input
                    type="url"
                    id="prod-image"
                    className="field-control"
                    value={draft.image}
                    onChange={(e) => setField('image', e.target.value)}
                    placeholder="https://…"
                  />
                  <p className="field__hint">Leave blank to show a placeholder icon.</p>
                </div>

                {/* Full-width: alt text */}
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label" htmlFor="prod-imagealt">Image alt text</label>
                  <input
                    type="text"
                    id="prod-imagealt"
                    className="field-control"
                    value={draft.imageAlt}
                    onChange={(e) => setField('imageAlt', e.target.value)}
                    placeholder="Brief description of the product image"
                  />
                </div>

                {/* Full-width: description */}
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label" htmlFor="prod-desc">Description</label>
                  <textarea
                    id="prod-desc"
                    className="field-control"
                    rows={3}
                    value={draft.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder="Short product description shown on the catalog and product page."
                  />
                </div>
              </div>

              <div className="admin-product-form__actions">
                <button type="submit" className="button button--primary">
                  {formMode === 'add' ? 'Add product' : 'Save changes'}
                </button>
                <button type="button" className="button button--quiet" onClick={cancelForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inventory table */}
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Inventory stock control</caption>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Organization</th>
                <th scope="col">Price</th>
                <th scope="col">In stock</th>
                <th scope="col">Status</th>
                <th scope="col" className="data-table__action">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <PackageX className="react-icon" aria-hidden="true" />
                      <p className="empty-state__title">No products found</p>
                      <p className="empty-state__description">
                        Use "Add product" above to add merchandise to the inventory.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const badge = getStockBadge(product.stock);
                  const isBeingEdited = formMode === 'edit' && editingId === product.id;
                  return (
                    <tr key={product.id} className={isBeingEdited ? 'data-table__row--active' : undefined}>
                      <td>
                        <span className="data-table__primary">{product.name}</span>
                        <span className="data-table__secondary">{product.category}</span>
                      </td>
                      <td>{product.organization}</td>
                      <td className="data-table__numeric">{formatPrice(product.price)}</td>
                      <td className="data-table__numeric">{Number(product.stock) || 0}</td>
                      <td><span className={badge.className}>{badge.text}</span></td>
                      <td className="data-table__action">
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="table-action"
                            onClick={() => openEdit(product)}
                            aria-label={`Edit ${product.name}`}
                            disabled={formMode !== 'idle' && !isBeingEdited}
                          >
                            <Pencil className="react-icon" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="table-action table-action--danger"
                            onClick={() => handleDeleteProduct(product.id)}
                            aria-label={`Delete ${product.name}`}
                            disabled={formMode !== 'idle'}
                          >
                            <Trash2 className="react-icon" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

