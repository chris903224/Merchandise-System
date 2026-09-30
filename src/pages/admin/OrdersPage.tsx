// src/pages/admin/OrdersPage.tsx

import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminPageHeader, AdminChip, AdminOrderDetailModal } from '../../components/admin';
import { getOrders, getOrderCounts, advanceOrder, orderTotal } from '../../services/admin';

const FILTERS = ['all', 'Pending', 'Processing', 'Ready for Pickup', 'Completed'];

export default function OrdersPage() {
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);

  const orders = useMemo(() => getOrders(filter), [filter, refreshKey]);
  const counts = useMemo(() => getOrderCounts(), [refreshKey]);

  const handleAdvance = (id: string) => {
    advanceOrder(id);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Fulfillment"
        title="Order Management"
        description="View all order details, verify customer info, and track fulfillment."
        actions={
          <button className="admin-btn admin-btn--ghost" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw className="react-icon" /> Refresh
          </button>
        }
      />

      <div className="admin-cart-summary">
        <div className="admin-cart-summary__card">
          <span className="admin-cart-summary__label">Pending</span>
          <span className="admin-cart-summary__value">{counts.pending}</span>
        </div>
        <div className="admin-cart-summary__card">
          <span className="admin-cart-summary__label">Processing</span>
          <span className="admin-cart-summary__value">{counts.processing}</span>
        </div>
        <div className="admin-cart-summary__card">
          <span className="admin-cart-summary__label">Ready for Pickup</span>
          <span className="admin-cart-summary__value">{counts.ready}</span>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">All Orders</h2>
          <div className="admin-filter-row">
            {FILTERS.map((f) => (
              <AdminChip
                key={f}
                label={f === 'all' ? 'All' : f}
                active={filter === f}
                onClick={() => setFilter(f)}
              />
            ))}
          </div>
        </div>

        <div className="admin-cart-list">
          {orders.length === 0 ? (
            <p className="admin-empty" style={{ padding: '32px 0', textAlign: 'center' }}>
              No orders in this status.
            </p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="admin-cart-item">
                <div className="admin-cart-item__img">
                  <img src={o.img} alt={o.id} />
                </div>
                <div className="admin-cart-item__info">
                  <h4>{o.customer.name} — {o.id}</h4>
                  <p>
                    {o.items.length} item{o.items.length === 1 ? '' : 's'} · {o.date} {o.time} ·{' '}
                    <span className={`admin-badge admin-badge--${o.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {o.status}
                    </span>
                  </p>
                </div>
                <div className="admin-cart-item__price">₱ {orderTotal(o).toLocaleString()}</div>
                <div className="admin-cart-item__actions">
                  <button onClick={() => setViewingOrderId(o.id)}>View Order</button>
                  {o.status !== 'Completed' && (
                    <button onClick={() => handleAdvance(o.id)}>Advance</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AdminOrderDetailModal
        orderId={viewingOrderId}
        onClose={() => setViewingOrderId(null)}
        onAdvance={handleAdvance}
      />
    </>
  );
}