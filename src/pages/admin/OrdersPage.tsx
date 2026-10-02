// src/pages/admin/OrdersPage.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Package, MoreVertical, Check } from 'lucide-react';
import {
  AdminPageHeader,
  AdminChip,
  AdminOrderDetailModal,
} from '../../components/admin';
import {
  getOrders,
  getOrderCounts,
  advanceOrder,
  orderTotal,
  setOrderStatus,
} from '../../services/admin';
import { useToast } from '../../toast';
import type { AdminOrder, AdminOrderStatus } from '../../store/adminStore';

const FILTERS = ['all', 'Pending', 'Processing', 'Ready for Pickup', 'Completed'];

/* ✅ All possible statuses */
const STATUS_OPTIONS: AdminOrderStatus[] = [
  'Pending',
  'Processing',
  'Ready for Pickup',
  'Completed',
  'Cancelled',
];

interface OrderCounts {
  pending: number;
  processing: number;
  ready: number;
  completed: number;
  cancelled: number;
}

const EMPTY_COUNTS: OrderCounts = {
  pending: 0,
  processing: 0,
  ready: 0,
  completed: 0,
  cancelled: 0,
};

export default function OrdersPage() {
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [counts, setCounts] = useState<OrderCounts>(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* ============================================
     LOAD
     ============================================ */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [ordersData, countsData] = await Promise.all([
          getOrders(filter),
          getOrderCounts(),
        ]);
        if (!cancelled) {
          setOrders(ordersData);
          setCounts(countsData);
        }
      } catch (error) {
        console.error('[OrdersPage] Failed to load:', error);
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
     Close dropdown kapag click sa labas
     ============================================ */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ============================================
     HANDLERS
     ============================================ */
  const handleAdvance = useCallback(async (id: string) => {
    try {
      await advanceOrder(id);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('[OrdersPage] Failed to advance:', error);
    }
  }, []);

  const handleSetStatus = useCallback(
    async (id: string, status: AdminOrderStatus) => {
      setIsSubmitting(true);
      try {
        await setOrderStatus(id, status);
        toast(`Order ${id} → ${status}`, 'success');
        setOpenMenuId(null);
        setRefreshKey((k) => k + 1);
      } catch (error) {
        console.error('[OrdersPage] Failed to set status:', error);
        toast('Failed to update order status', 'danger');
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast]
  );

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <>
      <AdminPageHeader
        eyebrow="Fulfillment"
        title="Order Management"
        description="View all order details, verify customer info, and track fulfillment."
        actions={
          <button className="admin-btn admin-btn--ghost" onClick={handleRefresh}>
            <RefreshCw className="react-icon" /> Refresh
          </button>
        }
      />

      <div className="admin-cart-summary">
        <div className="admin-cart-summary__card">
          <span className="admin-cart-summary__label">Pending</span>
          <span className="admin-cart-summary__value">
            {isLoading ? '…' : counts.pending}
          </span>
        </div>
        <div className="admin-cart-summary__card">
          <span className="admin-cart-summary__label">Processing</span>
          <span className="admin-cart-summary__value">
            {isLoading ? '…' : counts.processing}
          </span>
        </div>
        <div className="admin-cart-summary__card">
          <span className="admin-cart-summary__label">Ready for Pickup</span>
          <span className="admin-cart-summary__value">
            {isLoading ? '…' : counts.ready}
          </span>
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
          {isLoading ? (
            <p
              className="admin-empty"
              style={{ padding: '32px 0', textAlign: 'center' }}
            >
              Loading orders…
            </p>
          ) : orders.length === 0 ? (
            <p
              className="admin-empty"
              style={{ padding: '32px 0', textAlign: 'center' }}
            >
              No orders in this status.
            </p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="admin-cart-item">
                {/* IMAGE */}
                <div className="admin-cart-item__img">
                  {o.img ? (
                    <img src={o.img} alt={o.id} />
                  ) : (
                    <div className="admin-cart-item__placeholder">
                      <Package className="react-icon" />
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="admin-cart-item__info">
                  <h4>
                    {o.customer.name} — {o.id}
                  </h4>
                  <p>
                    {o.items.length} item{o.items.length === 1 ? '' : 's'} ·{' '}
                    {o.date} {o.time} ·{' '}
                    <span
                      className={`admin-badge admin-badge--${o.status
                        .toLowerCase()
                        .replace(/\s+/g, '-')}`}
                    >
                      {o.status}
                    </span>
                  </p>
                </div>

                {/* PRICE */}
                <div className="admin-cart-item__price">
                  ₱ {orderTotal(o).toLocaleString()}
                </div>

                {/* ACTIONS */}
                <div className="admin-cart-item__actions">
                  <button onClick={() => setViewingOrderId(o.id)}>
                    View Order
                  </button>

                  {o.status !== 'Completed' && o.status !== 'Cancelled' && (
                    <button onClick={() => handleAdvance(o.id)}>Advance</button>
                  )}

                  {/* ✅ BAGO — Status dropdown menu */}
                  <div
                    className="admin-status-menu"
                    ref={openMenuId === o.id ? menuRef : null}
                  >
                    <button
                      type="button"
                      className="admin-status-menu__trigger"
                      onClick={() =>
                        setOpenMenuId((curr) => (curr === o.id ? null : o.id))
                      }
                      aria-label="Change status"
                      title="Change status"
                      disabled={isSubmitting}
                    >
                      <MoreVertical className="react-icon" />
                    </button>

                    {openMenuId === o.id && (
                      <div className="admin-status-menu__dropdown" role="menu">
                        <div className="admin-status-menu__header">
                          Set status
                        </div>

                        {STATUS_OPTIONS.map((status) => {
                          const isCurrent = o.status === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              className={`admin-status-menu__item ${
                                isCurrent ? 'is-current' : ''
                              }`}
                              onClick={() => handleSetStatus(o.id, status)}
                              disabled={isCurrent || isSubmitting}
                              role="menuitem"
                            >
                              <span
                                className={`admin-status-menu__dot admin-status-menu__dot--${status
                                  .toLowerCase()
                                  .replace(/\s+/g, '-')}`}
                              />
                              <span>{status}</span>
                              {isCurrent && (
                                <Check className="admin-status-menu__check" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
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