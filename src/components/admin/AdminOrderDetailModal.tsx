// src/components/admin/AdminOrderDetailModal.tsx

import { getOrderById, orderTotal } from '../../services/admin';
import AdminModal from './AdminModal';

interface Props {
  orderId: string | null;
  onClose: () => void;
  onAdvance?: (id: string) => void;
}

export default function AdminOrderDetailModal({ orderId, onClose, onAdvance }: Props) {
  const order = orderId ? getOrderById(orderId) : null;
  const open = Boolean(order);

  if (!order) {
    return <AdminModal open={false} title="" onClose={onClose}>{null}</AdminModal>;
  }

  const total = orderTotal(order);

  return (
    <AdminModal
      open={open}
      title={`Order ${order.id}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="admin-btn admin-btn--ghost" onClick={onClose}>
            Close
          </button>
          {onAdvance && order.status !== 'Completed' && order.status !== 'Cancelled' && (
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => { onAdvance(order.id); onClose(); }}
            >
              Advance Status
            </button>
          )}
        </>
      }
    >
      <div className="admin-order-detail">
        <section className="admin-order-detail__section">
          <p className="admin-order-detail__section-title">Customer Information</p>
          <Row label="Full Name" value={order.customer.name} />
          <Row label="Student ID" value={order.customer.studentId} />
          <Row label="Email" value={order.customer.email} />
          <Row label="Phone" value={order.customer.phone} />
        </section>

        <section className="admin-order-detail__section">
          <p className="admin-order-detail__section-title">Pickup / Shipping</p>
          <Row label="Method" value={order.shipping.method} />
          <Row label="Location" value={order.shipping.location} />
          <Row label="Claim Date" value={order.shipping.date} />
        </section>

        <section className="admin-order-detail__section">
          <p className="admin-order-detail__section-title">Payment</p>
          <Row label="Method" value={order.payment.method} />
          <Row label="Reference #" value={order.payment.ref} />
          <Row label="Status" value={order.payment.status} />
        </section>

        <section className="admin-order-detail__section">
          <p className="admin-order-detail__section-title">Order Items</p>
          <ul className="admin-order-detail__items">
            {order.items.map((it, i) => (
              <li key={i}>
                <span>{it.name} <strong>× {it.qty}</strong></span>
                <span>₱ {(it.qty * it.price).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="admin-order-detail__total">
            <span>Total</span>
            <span>₱ {total.toLocaleString()}</span>
          </div>
        </section>

        <section className="admin-order-detail__section">
          <p className="admin-order-detail__section-title">Current Status</p>
          <Row
            label="Status"
            value={
              <span className={`admin-badge admin-badge--${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {order.status}
              </span>
            }
          />
          <Row label="Ordered At" value={`${order.date} · ${order.time}`} />
        </section>
      </div>
    </AdminModal>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="admin-order-detail__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}