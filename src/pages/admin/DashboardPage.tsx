// src/pages/admin/DashboardPage.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Package, Users, TrendingUp, ArrowRight,
} from 'lucide-react';
import { AdminStatCard, AdminPageHeader } from '../../components/admin';
import { getOrders, getOrderCounts } from '../../services/admin';
import type { AdminOrder } from '../../store/adminStore';

const RECENT_ORDERS: AdminOrder[] = [
  { id: '#SJCM-0087', status: 'Processing', customer: { name: 'Juan Dela Cruz', studentId: '', email: '', phone: '' }, shipping: { method: '', location: '', date: '' }, payment: { method: 'GCash', ref: '', status: 'Paid' }, items: [{ name: 'PE Uniform', qty: 2, price: 500 }], date: 'Sep 21, 2025', time: '10:42 AM', img: '' },
  { id: '#SJCM-0086', status: 'Ready for Pickup', customer: { name: 'Maria Santos', studentId: '', email: '', phone: '' }, shipping: { method: '', location: '', date: '' }, payment: { method: 'GCash', ref: '', status: 'Paid' }, items: [{ name: 'CITE Shirt', qty: 1, price: 350 }], date: 'Sep 21, 2025', time: '09:18 AM', img: '' },
  { id: '#SJCM-0085', status: 'Pending', customer: { name: 'Ralph Mendoza', studentId: '', email: '', phone: '' }, shipping: { method: '', location: '', date: '' }, payment: { method: 'OTC', ref: '', status: 'Unpaid' }, items: [{ name: 'ID Lace', qty: 3, price: 80 }], date: 'Sep 20, 2025', time: '04:27 PM', img: '' },
  { id: '#SJCM-0084', status: 'Completed', customer: { name: 'Angela Reyes', studentId: '', email: '', phone: '' }, shipping: { method: '', location: '', date: '' }, payment: { method: 'GCash', ref: '', status: 'Paid' }, items: [{ name: 'SHS PE Uniform', qty: 1, price: 300 }], date: 'Sep 20, 2025', time: '01:12 PM', img: '' },
];

const TOP_PRODUCTS = [
  { name: 'PE Uniform', sales: '45 orders', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=70' },
  { name: 'Org Shirt', sales: '32 orders', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=70' },
  { name: 'ID Laces', sales: '28 orders', img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=70' },
  { name: 'Regular Uniform', sales: '22 orders', img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=70' },
];

export default function DashboardPage() {
  const [counts, setCounts] = useState(getOrderCounts());
  const [chartRange, setChartRange] = useState('Last 7 days');

  useEffect(() => {
    setCounts(getOrderCounts());
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="admin-hero">
        <div className="admin-hero__copy">
          <span className="admin-hero__eyebrow">Admin Dashboard</span>
          <h1 className="admin-hero__title">Welcome back, Admin 👋</h1>
          <p className="admin-hero__desc">
            Manage products, orders, payments, and organizations in the SJCM Store.
          </p>
        </div>
        <div className="admin-hero__script">One Campus<br />One Community</div>
      </section>

      {/* STATS */}
      <section className="admin-stats">
        <AdminStatCard label="Total Orders" value="248" delta="+12%" icon={ShoppingBag} spark="0,18 10,14 20,16 30,10 40,12 50,6 60,8" />
        <AdminStatCard label="Total Products" value="86" delta="+8%" icon={Package} spark="0,16 10,18 20,12 30,14 40,8 50,10 60,4" />
        <AdminStatCard label="Total Users" value="1,245" delta="+8%" icon={Users} spark="0,20 10,18 20,14 30,16 40,10 50,8 60,6" />
        <AdminStatCard label="Total Revenue" value="₱ 124,820" delta="+15%" icon={TrendingUp} spark="0,22 10,18 20,20 30,12 40,14 50,8 60,4" />
      </section>

      {/* PANELS */}
      <section className="admin-panels">
        <div className="admin-panel-stack">
          <div className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h2 className="admin-panel__title">Sales Overview</h2>
                <p className="admin-panel__sub">Total sales for the {chartRange.toLowerCase()}</p>
              </div>
              <select
                className="admin-panel__select"
                value={chartRange}
                onChange={(e) => setChartRange(e.target.value)}
              >
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>This quarter</option>
              </select>
            </div>
            <div className="admin-chart">
              <svg viewBox="0 0 600 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22915c" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#22915c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <text className="admin-chart__axis-label" x="8" y="30">40K</text>
                <text className="admin-chart__axis-label" x="8" y="80">30K</text>
                <text className="admin-chart__axis-label" x="8" y="130">20K</text>
                <text className="admin-chart__axis-label" x="8" y="180">10K</text>
                <text className="admin-chart__axis-label" x="22" y="208">0</text>
                <line className="admin-chart__grid" x1="40" y1="30" x2="590" y2="30" />
                <line className="admin-chart__grid" x1="40" y1="80" x2="590" y2="80" />
                <line className="admin-chart__grid" x1="40" y1="130" x2="590" y2="130" />
                <line className="admin-chart__grid" x1="40" y1="180" x2="590" y2="180" />
                <path
                  className="admin-chart__area"
                  d="M 40 180 L 130 155 L 220 168 L 310 130 L 400 145 L 490 108 L 580 85 L 580 200 L 40 200 Z"
                />
                <path
                  className="admin-chart__line"
                  d="M 40 180 L 130 155 L 220 168 L 310 130 L 400 145 L 490 108 L 580 85"
                />
              </svg>
            </div>
            <div className="admin-chart__xaxis">
              <span>Sep 15</span><span>Sep 16</span><span>Sep 17</span>
              <span>Sep 18</span><span>Sep 19</span><span>Sep 20</span><span>Sep 21</span>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h2 className="admin-panel__title">Top Selling Products</h2>
                <p className="admin-panel__sub">Based on total orders</p>
              </div>
              <Link className="admin-panel__link" to="/admin/products">View all →</Link>
            </div>
            <div className="admin-products-grid">
              {TOP_PRODUCTS.map((p) => (
                <div key={p.name} className="admin-product-card">
                  <div className="admin-product-card__image">
                    <img src={p.img} alt={p.name} loading="lazy" />
                  </div>
                  <div className="admin-product-card__body">
                    <p className="admin-product-card__name">{p.name}</p>
                    <p className="admin-product-card__sales">{p.sales}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-panel-stack">
          <div className="admin-panel">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Recent Orders</h2>
              <Link className="admin-panel__link" to="/admin/orders">View all →</Link>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th><th>Customer</th><th>Items</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map((o) => (
                  <tr key={o.id}>
                    <td><span className="admin-order-id">{o.id}</span></td>
                    <td><span className="admin-order-customer">{o.customer.name}</span></td>
                    <td>{o.items.length}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${o.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-order-date">{o.date}</div>
                      <div className="admin-order-date">{o.time}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Quick Actions</h2>
            </div>
            <div className="admin-quick-actions">
              <Link className="admin-quick-action" to="/admin/products">
                <span className="admin-quick-action__icon"><Package className="react-icon" /></span>
                Add Product
              </Link>
              <Link className="admin-quick-action" to="/admin/orders">
                <span className="admin-quick-action__icon"><ShoppingBag className="react-icon" /></span>
                Manage Orders
              </Link>
              <Link className="admin-quick-action" to="/admin/payments">
                <span className="admin-quick-action__icon"><ArrowRight className="react-icon" /></span>
                Payments
              </Link>
              <Link className="admin-quick-action" to="/admin/console">
                <span className="admin-quick-action__icon"><Users className="react-icon" /></span>
                View Reports
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}