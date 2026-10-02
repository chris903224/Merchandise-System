// src/components/admin/AdminOrderDetailModal.tsx

import { useState, useEffect } from 'react';
import { getOrderById, orderTotal } from '../../services/admin';
import AdminModal from './AdminModal';
import type { AdminOrder } from '../../store/adminStore';

interface Props {
  orderId: string | null;
  onClose: () => void;
  onAdvance?: (id: string) => void;
}

export default function AdminOrderDetailModal({
  orderId,
  onClose,
  onAdvance,
}: Props) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ============================================
     LOAD ORDER (async)
     ============================================ */
  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getOrderById(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data ?? null);
      })
      .catch((err) => {
        console.error('[OrderDetail] Failed to load:', err);
        if (!cancelled) setOrder(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  /* ============================================
     RENDER
     ============================================ */
  const isOpen = Boolean(orderId);
  const title = order ? `Order ${order.id}` : 'Loading…';
  const total = order ? orderTotal(order) : 0;

  const canAdvance =
    order &&
    order.status !== 'Completed' &&
    order.status !== 'Cancelled' &&
    Boolean(onAdvance);

  return (
    <AdminModal
      open={isOpen}
      title={title}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="admin-btn admin-btn--ghost" onClick={onClose}>
            Close
          </button>
          {canAdvance && order && (
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => {
                onAdvance?.(order.id);
                onClose();
              }}
            >
              Advance Status
            </button>
          )}
        </>
      }
    >
      {isLoading ? (
        <p
          className="admin-empty"
          style={{ textAlign: 'center', padding: '24px 0' }}
        >
          Loading order…
        </p>
      ) : !order ? (
        <p
          className="admin-empty"
          style={{ textAlign: 'center', padding: '24px 0' }}
        >
          Order not found.
        </p>
      ) : (
        <div className="admin-order-detail">
          {/* ============================================
              CUSTOMER INFORMATION
              ============================================ */}
          <section className="admin-order-detail__section">
            <p className="admin-order-detail__section-title">
              Customer Information
            </p>
            <Row label="Full Name" value={order.customer.name} />
            <Row label="Student ID" value={order.customer.studentId || '—'} />
            <Row label="Email" value={order.customer.email || '—'} />
            <Row label="Phone" value={order.customer.phone || '—'} />
          </section>

          {/* ============================================
              PICKUP / SHIPPING
              ============================================ */}
          <section className="admin-order-detail__section">
            <p className="admin-order-detail__section-title">
              Pickup / Shipping
            </p>
            <Row label="Method" value={order.shipping.method || '—'} />
            <Row label="Location" value={order.shipping.location || '—'} />
            <Row label="Claim Date" value={order.shipping.date || '—'} />
          </section>

          {/* ============================================
              PAYMENT
              ============================================ */}
          <section className="admin-order-detail__section">
            <p className="admin-order-detail__section-title">Payment</p>
            <Row label="Method" value={order.payment.method || '—'} />
            <Row label="Reference #" value={order.payment.ref || '—'} />
            <Row label="Status" value={order.payment.status || '—'} />
          </section>

          {/* ============================================
              ITEMS
              ============================================ */}
          <section className="admin-order-detail__section">
            <p className="admin-order-detail__section-title">Order Items</p>
            <ul className="admin-order-detail__items">
              {order.items.map((it, i) => (
                <li key={i}>
                  <span>
                    {it.name} <strong>× {it.qty}</strong>
                  </span>
                  <span>₱ {(it.qty * it.price).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="admin-order-detail__total">
              <span>Total</span>
              <span>₱ {total.toLocaleString()}</span>
            </div>
          </section>

          {/* ============================================
              STATUS
              ============================================ */}
          <section className="admin-order-detail__section">
            <p className="admin-order-detail__section-title">
              Current Status
            </p>
            <Row
              label="Status"
              value={
                <span
                  className={`admin-badge admin-badge--${order.status
                    .toLowerCase()
                    .replace(/\s+/g, '-')}`}
                >
                  {order.status}
                </span>
              }
            />
            <Row label="Ordered At" value={`${order.date} · ${order.time}`} />
          </section>
        </div>
      )}
    </AdminModal>
  );
}

/* ============================================
   SUB-COMPONENT
   ============================================ */

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="admin-order-detail__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}