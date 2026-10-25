// src/pages/organization/OrdersPage.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Package, MoreVertical, Check, Eye, ArrowRight } from 'lucide-react';
import { peso } from '../../utils/format';
import { 
  fetchFreshOrgOrders, 
  setOrgOrderStatus,
  ORG_ORDER_FLOW,
  type OrgOrderStatus
} from '../../services/organization/orgOrderService'; // 👈 Siguraduhing tama ang filename
import { useToast } from '../../toast';

const FILTERS = ['all', 'Pending', 'Processing', 'Ready for Pickup', 'Claimed', 'Cancelled'];

export default function OrdersPage() {
  const toast = useToast();
  const navigate = useNavigate();
  
  const [filter, setFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // ✅ Local state lang (walang global store na makikialam)
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🎯 LOCKING MECHANISM (Pigilan ang Realtime na mag-override)
  const isUpdatingRef = useRef(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // ✅ DIRECT FETCH (Walang Cache)
  const fetchOrders = useCallback(async () => {
    // Kung nag-a-update, wag munang i-fetch para hindi mag-revert
    if (isUpdatingRef.current) return;
    
    setIsLoading(true);
    try {
      const data = await fetchFreshOrgOrders();
      setLocalOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast('Failed to load orders', 'danger');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Close dropdown
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
     🎯 UPDATE STATUS (OPTIMISTIC + CACHE-FREE)
     ============================================ */
  const handleUpdateStatus = async (
    id: string, 
    newStatus: OrgOrderStatus, 
    currentStatus: string
  ) => {
    if (newStatus === currentStatus) return;

    // 1. I-LOCK ANG FETCH
    isUpdatingRef.current = true;
    setIsSubmitting(true);

    // 2. OPTIMISTIC UPDATE (Agad magbabago sa UI)
    setLocalOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, orderStatus: newStatus } : o))
    );

    try {
      // 3. I-UPDATE SA DB
      await setOrgOrderStatus(id, newStatus);
      toast(`Order updated to ${newStatus}`, 'success');
      setOpenMenuId(null);

      // 4. KUNAHIN ANG FRESH DATA (I-set agad sa UI)
      const freshData = await fetchFreshOrgOrders();
      setLocalOrders(freshData); 

      // ❌ WALA NANG refreshOrders() dito. Yan ang nagpapa-revert sa Pending.

    } catch (error) {
      console.error('Failed to update status:', error);
      toast('Failed to update status', 'danger');
      
      // I-revert kung nag-fail
      setLocalOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, orderStatus: currentStatus } : o))
      );
    } finally {
      // 5. I-UNLOCK ANG FETCH
      isUpdatingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleAdvance = async (id: string, currentStatus: string) => {
    const idx = ORG_ORDER_FLOW.indexOf(currentStatus as OrgOrderStatus);
    if (idx === -1 || idx >= ORG_ORDER_FLOW.length - 1) return;

    const nextStatus = ORG_ORDER_FLOW[idx + 1];
    await handleUpdateStatus(id, nextStatus, currentStatus);
  };

  /* ============================================
     COUNTS & FILTERS
     ============================================ */
  const counts = localOrders.reduce(
    (acc, o) => {
      if (o.orderStatus === 'Pending') acc.pending++;
      else if (o.orderStatus === 'Processing') acc.processing++;
      else if (o.orderStatus === 'Ready for Pickup') acc.ready++;
      else if (o.orderStatus === 'Claimed') acc.claimed++;
      else if (o.orderStatus === 'Cancelled') acc.cancelled++;
      return acc;
    },
    { pending: 0, processing: 0, ready: 0, claimed: 0, cancelled: 0 }
  );

  const filteredOrders = localOrders.filter((o) => {
    if (filter === 'all') return true;
    return o.orderStatus === filter;
  });

  return (
    <section className="page-orders">
      {/* HEADER */}
      <div className="ph">
        <div>
          <p className="eyebrow">Fulfillment</p>
          <h2>Order Management</h2>
          <p>View all order details, verify customer info, and track fulfillment.</p>
        </div>
        <button className="btn" onClick={fetchOrders} disabled={isLoading}>
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
                {/* IMAGE */}
                <div className="order-item__image" style={{ overflow: 'hidden', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                  {o.img ? (
                    <img 
                      src={o.img} 
                      alt={o.items[0]?.name || 'Product image'} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
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
                <div className="order-item__price">{peso(o.totalAmount)}</div>

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
                        {ORG_ORDER_FLOW.concat('Cancelled').map((status: OrgOrderStatus) => {
                          const isCurrent = o.orderStatus === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              className={`admin-status-menu__item ${isCurrent ? 'is-current' : ''}`}
                              onClick={() => handleUpdateStatus(o.id, status, o.orderStatus)}
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