// src/pages/organization/OrdersPage.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Package, MoreVertical, Check, Eye, ArrowRight } from 'lucide-react';
import { useApp } from '../../store';
import { peso } from '../../utils/format';

const FILTERS = ['all', 'Pending', 'Processing', 'Ready for Pickup', 'Claimed', 'Cancelled'];

const STATUS_OPTIONS = [
  'Pending',
  'Processing',
  'Ready for Pickup',
  'Claimed',
  'Cancelled',
] as const;

type OrgOrderStatus = typeof STATUS_OPTIONS[number];

interface OrderCounts {
  pending: number;
  processing: number;
  ready: number;
  claimed: number;
  cancelled: number;
}

const EMPTY_COUNTS: OrderCounts = {
  pending: 0,
  processing: 0,
  ready: 0,
  claimed: 0,
  cancelled: 0,
};

export default function OrdersPage() {
  const { orders, setOrderStatus, refreshOrders, isLoading } = useApp();
  const navigate = useNavigate();
  
  const [filter, setFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const counts = orders.reduce<OrderCounts>((acc, o) => {
    switch (o.orderStatus) {
      case 'Pending': acc.pending++; break;
      case 'Processing': acc.processing++; break;
      case 'Ready for Pickup': acc.ready++; break;
      case 'Claimed': acc.claimed++; break;
      case 'Cancelled': acc.cancelled++; break;
    }
    return acc;
  }, { ...EMPTY_COUNTS });

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.orderStatus === filter;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdvance = useCallback(async (id: string, currentStatus: string) => {
    let nextStatus: OrgOrderStatus | null = null;
    
    if (currentStatus === 'Pending') nextStatus = 'Processing';
    else if (currentStatus === 'Processing') nextStatus = 'Ready for Pickup';
    else if (currentStatus === 'Ready for Pickup') nextStatus = 'Claimed';
    
    if (!nextStatus) return;

    setIsSubmitting(true);
    try {
      await setOrderStatus(id, nextStatus);
      await refreshOrders();
    } catch (error) {
      console.error('Failed to advance order:', error);
      alert('Failed to advance order.');
    } finally {
      setIsSubmitting(false);
    }
  }, [setOrderStatus, refreshOrders]);

  const handleSetStatus = useCallback(async (id: string, status: OrgOrderStatus) => {
    setIsSubmitting(true);
    try {
      await setOrderStatus(id, status);
      await refreshOrders();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to set status:', error);
      alert('Failed to update order status.');
    } finally {
      setIsSubmitting(false);
    }
  }, [setOrderStatus, refreshOrders]);

  return (
    <section className="page-orders">
      {/* HEADER */}
      <div className="ph">
        <div>
          <p className="eyebrow">Fulfillment</p>
          <h2>Order Management</h2>
          <p>View all order details, verify customer info, and track fulfillment.</p>
        </div>
        <button className="btn" onClick={refreshOrders} disabled={isLoading}>
          <RefreshCw size={18} className={isLoading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="stats s3">
        <div className="glass stat">
          <span className="ic g4"><Package size={24} /></span>
          <div>
            <small>Pending</small>
            <strong>{isLoading ? '...' : counts.pending}</strong>
          </div>
        </div>
        <div className="glass stat">
          <span className="ic g1"><RefreshCw size={24} /></span>
          <div>
            <small>Processing</small>
            <strong>{isLoading ? '...' : counts.processing}</strong>
          </div>
        </div>
        <div className="glass stat">
          <span className="ic g2"><Check size={24} /></span>
          <div>
            <small>Ready for Pickup</small>
            <strong>{isLoading ? '...' : counts.ready}</strong>
          </div>
        </div>
      </div>

      {/* TABLE/LIST */}
      <div className="glass card order-list-card">
        <div className="order-list-header">
          <h3>All Orders</h3>
          <div className="chips">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`chip ${filter === f ? 'on' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        <div className="order-items-list">
          {isLoading ? (
            <p className="empty-text">Loading orders…</p>
          ) : filteredOrders.length === 0 ? (
            <p className="empty-text">No orders in this status.</p>
          ) : (
            filteredOrders.map((o) => (
              <div key={o.id} className="order-item">
                {/* LARGE IMAGE */}
                <div className="order-item__image">
                  {(o.items[0] as any)?.image ? (
                    <img src={(o.items[0] as any).image} alt={o.items[0].name} />
                  ) : (
                    <div className="order-item__placeholder">
                      <Package size={32} />
                    </div>
                  )}
                </div>

                {/* DETAILS */}
                <div className="order-item__details">
                  <div className="order-item__header">
                    <h4>{o.customerName}</h4>
                    <span className="order-item__id">#{o.id}</span>
                  </div>
                  <p className="order-item__meta">
                    {o.items.length} item{o.items.length === 1 ? '' : 's'} · {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                  <div className="order-item__badges">
                    <span className={`pill ${o.orderStatus === 'Claimed' || o.orderStatus === 'Ready for Pickup' ? 'ok' : o.orderStatus === 'Cancelled' ? 'no' : 'wa'}`}>
                      {o.orderStatus}
                    </span>
                  </div>
                </div>

                {/* PRICE */}
                <div className="order-item__price">
                  {peso(o.totalAmount)}
                </div>

                {/* ACTIONS */}
                <div className="order-item__actions">
                  <button className="btn sm gh" onClick={() => navigate(`/org/orders/${o.id}`)}>
                    <Eye size={16} /> View
                  </button>

                  {o.orderStatus !== 'Claimed' && o.orderStatus !== 'Cancelled' && (
                    <button className="btn sm" onClick={() => handleAdvance(o.id, o.orderStatus)} disabled={isSubmitting}>
                      <ArrowRight size={16} /> Advance
                    </button>
                  )}

                  {/* DROPDOWN */}
                  <div className="admin-status-menu" ref={openMenuId === o.id ? menuRef : null}>
                    <button
                      type="button"
                      className="admin-status-menu__trigger"
                      onClick={() => setOpenMenuId((curr) => (curr === o.id ? null : o.id))}
                    >
                      <MoreVertical size={20} />
                    </button>

                    {openMenuId === o.id && (
                      <div className="admin-status-menu__dropdown">
                        <div className="admin-status-menu__header">Set status</div>
                        {STATUS_OPTIONS.map((status) => {
                          const isCurrent = o.orderStatus === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              className={`admin-status-menu__item ${isCurrent ? 'is-current' : ''}`}
                              onClick={() => handleSetStatus(o.id, status)}
                              disabled={isCurrent || isSubmitting}
                            >
                              <span className={`admin-status-menu__dot admin-status-menu__dot--${status.toLowerCase().replace(/\s+/g, '-')}`} />
                              <span>{status}</span>
                              {isCurrent && <Check size={14} className="admin-status-menu__check" />}
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
    </section>
  );
}