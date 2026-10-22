// src/pages/organization/ProfilePage.tsx

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../store';
import { Icon } from '../../components/Icon';
import { createUserNotification } from '../../services/userNotifications';
import { SUPPORT, FAQ } from '../../data/constants';
import type { Product, Order } from '../../types';
import '../../styles/organization/profile.css';

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'
  );
}

function totalStock(p: Product): number {
  if (p.sizeStocks && Object.keys(p.sizeStocks).length > 0) {
    return Object.values(p.sizeStocks).reduce(
      (a, b) => a + (Number(b) || 0),
      0
    );
  }
  return p.stock ?? 0;
}

export default function ProfilePage() {
  const { session, products, orders } = useApp();
  const org = session?.organization ?? '';
  const userId = session?.id ?? '';

  const [topic, setTopic] = useState('Password reset');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // ✅ Compute real data mula sa store
  const mine = useMemo(() => {
    const myProducts = products.filter((p) => p.organization === org);
    const myOrders = orders.filter((o) =>
      o.items.some((it) => it.organization === org)
    );
    const revenue = myOrders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((t, o) => t + o.totalAmount, 0);
    
    return { myProducts, myOrders, revenue };
  }, [products, orders, org]);

  // ✅ Get recent 10 orders as activity feed
  const recentActivity = useMemo(() => {
    return [...mine.myOrders]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 10);
  }, [mine.myOrders]);

  // ✅ Send support request (saves to notifications table)
  async function handleHelpRequest() {
    if (message.trim().length < 5 || !userId) return;
    setSending(true);
    try {
      await createUserNotification(userId, {
        type: 'system',
        title: `Support request: ${topic}`,
        message: message.trim(),
        link: '/org/profile',
        actionLabel: 'View',
        metadata: { topic },
      });
      setMessage('');
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      console.error('Failed to send request:', err);
    } finally {
      setSending(false);
    }
  }

  if (!session) return null;

  // ✅ Lock icon for admin-managed fields
  const lockValue = (v: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      {v}
      <Icon name="lock" style={{ width: 14, height: 14, color: 'var(--mu)' }} />
    </span>
  );

  return (
    <section className="page-profile">
      <div className="ph">
        <div>
          <h2>Profile</h2>
          <p>Your account details, status, and support.</p>
        </div>
        <Link to="/org/settings" className="btn">
          <Icon name="edit" style={{ width: 16, height: 16 }} /> Edit in Settings
        </Link>
      </div>

      {/* ID CARD */}
      <div className="glass card idc">
        <span className="av big">{initialsOf(session.name)}</span>
        <div>
          <h1>{session.name}</h1>
          <p>Organization · {session.organization || '—'}</p>
        </div>
        <span className="pill ok">Active</span>
      </div>

      <div className="set">
        {/* ACCOUNT INFO */}
        <div className="glass card">
          <h3><Icon name="user" /> Account Information</h3>
          <div className="fill">
            <div className="row2"><span>Full name</span><b>{session.name}</b></div>
            <div className="row2"><span>ID number</span><b>{session.idNumber || '—'}</b></div>
            <div className="row2"><span>Email</span><b>{lockValue(session.email)}</b></div>
            <div className="row2"><span>Organization</span><b>{lockValue(session.organization || '—')}</b></div>
            <div className="row2"><span>Role</span><b>{lockValue(session.role)}</b></div>
          </div>
          <small className="note2">
            Personal details can be edited in Settings. Email, organization, and role are set by your admin.
          </small>
        </div>

        {/* ACCOUNT STATUS */}
        <div className="glass card">
          <h3><Icon name="shield" /> Account Status</h3>
          <div className="fill">
            <div className="row2"><span>Status</span><b><span className="pill ok">Active</span></b></div>
            <div className="row2"><span>Account type</span><b>Organization account</b></div>
            <div className="row2"><span>Products managed</span><b>{mine.myProducts.length}</b></div>
            <div className="row2"><span>Orders handled</span><b>{mine.myOrders.length}</b></div>
            <div className="row2"><span>Total revenue</span><b>₱{mine.revenue.toLocaleString('en-PH')}</b></div>
            <div className="row2"><span>Units in stock</span><b>{mine.myProducts.reduce((t, p) => t + totalStock(p), 0)}</b></div>
          </div>
          <small className="note2">
            Only the person assigned to this organization can use this account.
          </small>
        </div>

        {/* HELP & SUPPORT */}
        <div className="glass card">
          <h3><Icon name="help" /> Help &amp; Support</h3>
          <p className="hs">Your system admin handles account changes and password resets.</p>
          <div className="row2"><span>Email</span><b>{SUPPORT.email}</b></div>
          <div className="row2"><span>Phone</span><b>{SUPPORT.phone}</b></div>
          <div className="row2"><span>Hours</span><b>{SUPPORT.hours}</b></div>

          {FAQ.map(([q, a]) => (
            <details className="faq" key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}

          <div className="hf">
            <select
              className="in"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              aria-label="Request type"
            >
              <option>Password reset</option>
              <option>Change account details</option>
              <option>Report a problem</option>
              <option>Other</option>
            </select>
            <textarea
              className="in"
              placeholder="Describe what you need help with"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className="btn"
              onClick={handleHelpRequest}
              disabled={sending || message.trim().length < 5}
            >
              <Icon name="send" style={{ width: 16, height: 16 }} />
              {sending ? 'Sending…' : sent ? 'Sent ✓' : 'Send request'}
            </button>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="glass card">
          <h3><Icon name="clock" /> Recent Activity</h3>
          <div className="fill">
            {recentActivity.length === 0 ? (
              <small style={{ color: 'var(--mu)' }}>No activity yet.</small>
            ) : (
              recentActivity.map((o: Order) => (
                <div className="li" key={o.id}>
                  <span className={`ic ${o.paymentStatus === 'Paid' ? 'g3' : 'g2'}`}>
                    <Icon name={o.paymentStatus === 'Paid' ? 'card' : 'cart'} />
                  </span>
                  <div>
                    <b>
                      {o.paymentStatus === 'Paid'
                        ? `Payment received • #${o.id}`
                        : `Order • #${o.id}`}
                    </b>
                    <small>{new Date(o.createdAt).toLocaleString()}</small>
                  </div>
                  <time>₱{o.totalAmount.toLocaleString('en-PH')}</time>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}