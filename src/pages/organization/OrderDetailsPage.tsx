// src/pages/organization/OrderDetailsPage.tsx

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../store';
import OrderStatusPill from '../../components/organization/OrderStatusPill';
import { Icon } from '../../components/Icon';
import { peso } from '../../utils/format';
import { supabase } from '../../lib/supabaseClient';
import { setOrgOrderStatus } from '../../services/organization/orgOrderService';
import type { Order } from '../../types';

const NEXT_STATUS: Record<string, string[]> = {
  Pending:            ['Processing', 'Cancelled'],
  Processing:         ['Ready for Pickup', 'Cancelled'],
  'Ready for Pickup': ['Claimed'],
  Claimed:            [],
  Cancelled:          [],
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useApp();
  const org = session?.organization ?? 'SJC Supply Office';

  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<any[]>([]); // 👈 Para sa image mapping
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);

      // 1. Fetch order
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      // 2. Fetch products para sa images
      const { data: productData } = await supabase
        .from('products')
        .select('id, image, name, organization'); // Kunin din ang organization

      if (orderData) {
        const mapped: Order = {
          id: orderData.id,
          userId: orderData.user_id,
          customerName: orderData.customer_name,
          studentId: orderData.student_id ?? '',
          email: orderData.email ?? '',
          phone: orderData.phone ?? '',
          items: orderData.items ?? [],
          totalAmount: Number(orderData.total_amount),
          paymentMethod: orderData.payment_method ?? '',
          paymentRef: orderData.payment_ref ?? null,
          paymentStatus: orderData.payment_status ?? '',
          orderStatus: orderData.order_status ?? '',
          claimLocation: orderData.claim_location ?? '',
          claimDate: orderData.claim_date ?? '',
          createdAt: orderData.created_at,
        };
        setOrder(mapped);
      }

      setProducts(productData ?? []);
      setLoading(false);
    }

    loadData();
  }, [id]);

  async function handleStatus(next: string) {
    if (!order) return;
    setBusy(next);
    try {
      await setOrgOrderStatus(order.id, next as any);
      
      // Refresh order
      const { data } = await supabase.from('orders').select('*').eq('id', order.id).maybeSingle();
      if (data) {
        setOrder((prev) => prev ? { ...prev, orderStatus: data.order_status } : null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    } finally {
      setBusy(null);
    }
  }

  async function handleMarkPaid() {
    if (!order) return;
    setBusy('paid');
    try {
      await supabase.from('orders').update({ payment_status: 'Paid' }).eq('id', order.id);
      setOrder((prev) => prev ? { ...prev, paymentStatus: 'Paid' } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;

  if (!order) return (
    <div className="glass card" style={{ textAlign: 'center', padding: '40px' }}>
      <h2>Order not found</h2>
      <Link to="/org/orders" className="btn" style={{ marginTop: '20px' }}>Back to Orders</Link>
    </div>
  );

  // Filter items base sa session organization
  const myItems = order.items.filter((it) => {
    // Kung may organization ang item, i-match. Kung wala, ipakita pa rin (fallback)
    if (it.organization) return it.organization === org;
    return true; 
  });

  const transitions = NEXT_STATUS[order.orderStatus] ?? [];

  // Helper para sa image
  const getImage = (item: any) => {
    if (item.image) return item.image;
    const product = products.find((p) => p.id === item.id);
    return product?.image || null;
  };

  return (
    <section className="page-order-details">
      <nav className="crumb">
        <Link to="/org/orders">Orders</Link>
        <Icon name="right" />
        <span>#{order.id}</span>
      </nav>

      <div className="glass card" style={{ padding: '32px' }}>
        <div className="ph" style={{ marginBottom: '24px', borderBottom: '1px solid var(--theme-border)', paddingBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--theme-text)' }}>Order #{order.id}</h2>
            <p style={{ color: 'var(--theme-text-muted)', marginTop: '4px' }}>
              {order.customerName} · {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <OrderStatusPill status={order.orderStatus} />
        </div>

        {/* Key Values */}
        <div className="kv" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: 'var(--theme-surface-2)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          <div><small style={{ color: 'var(--theme-text-muted)' }}>Total</small><b style={{ display: 'block', fontSize: '18px', color: 'var(--theme-text)' }}>{peso(order.totalAmount)}</b></div>
          <div><small style={{ color: 'var(--theme-text-muted)' }}>Payment</small><b style={{ display: 'block', fontSize: '18px', color: 'var(--theme-text)' }}>{order.paymentStatus}</b></div>
          <div><small style={{ color: 'var(--theme-text-muted)' }}>Method</small><b style={{ display: 'block', fontSize: '18px', color: 'var(--theme-text)' }}>{order.paymentMethod}</b></div>
        </div>

        {/* Customer Info */}
        <span className="lbl" style={{ display: 'block', fontWeight: 700, color: 'var(--theme-text)', marginBottom: '12px' }}>Customer Information</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--theme-text-muted)' }}><span>Name</span><b style={{ color: 'var(--theme-text)' }}>{order.customerName}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--theme-text-muted)' }}><span>Student ID</span><b style={{ color: 'var(--theme-text)' }}>{order.studentId || '—'}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--theme-text-muted)' }}><span>Email</span><b style={{ color: 'var(--theme-text)' }}>{order.email || '—'}</b></div>
        </div>

        {/* LARGE PRODUCT CARDS */}
        <span className="lbl" style={{ display: 'block', fontWeight: 700, color: 'var(--theme-text)', marginBottom: '12px' }}>Items from your organization</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {myItems.map((it) => {
            const img = getImage(it);
            return (
              <div key={`${it.id}-${it.size}`} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                background: 'var(--theme-surface-2)', 
                borderRadius: '12px', 
                border: '1px solid var(--theme-border)',
                overflow: 'hidden'
              }}>
                {/* LARGE IMAGE */}
                <div style={{ width: '100%', height: '180px', background: 'var(--theme-bg)' }}>
                  {img ? (
                    <img src={img} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--theme-text-muted)' }}>
                      <Icon name="box" />
                    </div>
                  )}
                </div>
                {/* DETAILS */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ color: 'var(--theme-text)', fontSize: '16px' }}>{it.name}</b>
                  {it.size && <small style={{ color: 'var(--theme-text-muted)' }}>Size: {it.size}</small>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'var(--theme-text)' }}>
                    <span>Qty: {it.qty}</span>
                    <b>{peso(it.price * it.qty)}</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {order.paymentStatus !== 'Paid' && (
            <button className="btn" disabled={busy === 'paid'} onClick={handleMarkPaid}>
              {busy === 'paid' ? 'Saving...' : 'Mark paid'}
            </button>
          )}
          {transitions.map((s) => (
            <button key={s} className={`btn ${s === 'Cancelled' ? 'gh' : ''}`} disabled={busy === s} onClick={() => handleStatus(s)}>
              {busy === s ? 'Saving...' : `Move to ${s}`}
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