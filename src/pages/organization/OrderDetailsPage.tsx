// src/pages/organization/OrderDetailsPage.tsx

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../store';
import OrderStatusPill from '../../components/organization/OrderStatusPill';
import { Icon } from '../../components/Icon';
import { peso } from '../../utils/format';
import type { Order } from '../../types';

// ✅ TANGGALIN ANG CSS IMPORT DITO para hindi mag-conflict (nasa OrganizationLayout na)
// import '../../styles/organization/orders.css';

const NEXT_STATUS: Record<string, string[]> = {
  Pending:            ['Processing', 'Cancelled'],
  Processing:         ['Ready for Pickup', 'Cancelled'],
  'Ready for Pickup': ['Claimed'],
  Claimed:            [],
  Cancelled:          [],
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { session, orders, setOrderStatus, setOrderPaymentStatus } = useApp();
  const org = session?.organization ?? '';

  const order = useMemo(
    () =>
      orders.find(
        (o) => o.id === id && o.items.some((it) => it.organization === org)
      ) ?? null,
    [orders, id, org]
  );

  const [busy, setBusy] = useState<string | null>(null);

  async function handleStatus(next: string) {
    if (!order) return;
    setBusy(next);
    try {
      await setOrderStatus(order.id, next);
    } finally {
      setBusy(null);
    }
  }

  async function handleMarkPaid() {
    if (!order) return;
    setBusy('paid');
    try {
      await setOrderPaymentStatus(order.id, 'Paid');
    } finally {
      setBusy(null);
    }
  }

  // ✅ NAKA-CENTER NA ERROR STATE
  if (!order) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh', 
        width: '100%',
        textAlign: 'center' 
      }}>
        <div className="glass card" style={{ padding: '48px 32px', maxWidth: '420px', width: '100%' }}>
          <span className="ic g5" style={{ margin: '0 auto 20px', width: '72px', height: '72px', borderRadius: '50%' }}>
            <Icon name="inbox" style={{ width: '36px', height: '36px' }} />
          </span>
          
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--tx)' }}>
            Order not found
          </h2>
          
          <p style={{ color: 'var(--mu)', marginBottom: '24px', fontSize: '15px', lineHeight: 1.5 }}>
            This order does not contain items from your organization or might have been removed.
          </p>
          
          <Link to="/org/orders" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
            <Icon name="back" style={{ width: 18, height: 18 }} /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const transitions = NEXT_STATUS[order.orderStatus] ?? [];
  const myItems = order.items.filter((it) => it.organization === org);

  return (
    <section className="page-order-details">
      {/* Breadcrumbs */}
      <nav className="crumb">
        <Link to="/org/orders">Orders</Link>
        <Icon name="right" />
        <span>#{order.id}</span>
      </nav>

      <div className="glass card" style={{ padding: '28px' }}>
        {/* Header */}
        <div className="ph" style={{ marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--tx)' }}>
              Order #{order.id}
            </h2>
            <p style={{ color: 'var(--mu)', fontSize: '14px', marginTop: '4px' }}>
              {order.customerName} · {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <OrderStatusPill status={order.orderStatus} />
        </div>

        {/* Key Values (Total, Payment, Method) */}
        <div className="kv" style={{ marginBottom: '24px' }}>
          <div><small>Total</small><b>{peso(order.totalAmount)}</b></div>
          <div><small>Payment</small><b>{order.paymentStatus}</b></div>
          <div><small>Method</small><b>{order.paymentMethod}</b></div>
        </div>

        {/* Customer Info */}
        <span className="lbl">Customer Information</span>
        <div className="row2"><span>Name</span><b>{order.customerName}</b></div>
        <div className="row2"><span>Student ID</span><b>{order.studentId || '—'}</b></div>
        <div className="row2"><span>Email</span><b>{order.email || '—'}</b></div>
        <div className="row2"><span>Phone</span><b>{order.phone || '—'}</b></div>
        <div className="row2"><span>Claim location</span><b>{order.claimLocation || '—'}</b></div>
        <div className="row2"><span>Claim date</span><b>{order.claimDate || '—'}</b></div>

        {/* Items List */}
        <span className="lbl" style={{ marginTop: '24px' }}>Items from your organization</span>
        <ul className="order-items">
          {myItems.length === 0 ? (
            <li><small>No items from your organization on this order.</small></li>
          ) : (
            myItems.map((it) => (
              <li key={`${it.id}-${it.size}`} style={{ padding: '16px', borderBottom: '1px solid var(--bd)' }}>
                <div>
                  <b style={{ fontSize: '15px' }}>{it.name}</b>
                  {it.size && <small style={{ display: 'block', marginTop: '2px' }}>Size: {it.size}</small>}
                </div>
                <span style={{ color: 'var(--mu)', fontWeight: 600 }}>× {it.qty}</span>
                <b style={{ fontSize: '15px' }}>{peso(it.price * it.qty)}</b>
              </li>
            ))
          )}
        </ul>

        {/* Actions */}
        <span className="lbl" style={{ marginTop: '24px' }}>Actions</span>
        <div className="seg" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          {order.paymentStatus !== 'Paid' && (
            <button
              className="btn"
              disabled={busy === 'paid'}
              onClick={handleMarkPaid}
            >
              {busy === 'paid' ? 'Saving…' : 'Mark paid'}
            </button>
          )}
          {transitions.map((s) => (
            <button
              key={s}
              className={`btn${s === 'Cancelled' ? ' gh' : ''}`}
              disabled={busy === s}
              onClick={() => handleStatus(s)}
            >
              {s === 'Cancelled'
                ? busy === s ? 'Cancelling…' : 'Cancel order'
                : busy === s ? 'Saving…' : `Move to ${s}`}
            </button>
          ))}
          <Link to="/org/orders" className="btn gh">
            <Icon name="back" /> Back to Orders
          </Link>
        </div>
      </div>
    </section>
  );
}