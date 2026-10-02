// src/pages/admin/DashboardPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { AdminStatCard } from '../../components/admin';
import {
  getOrderCounts,
  getOrders,
  getSalesChartData,
  getTopSellingProducts,
} from '../../services/admin';
import type { AdminOrder } from '../../store/adminStore';

/* ============================================
   TYPES
   ============================================ */

interface OrderCounts {
  pending: number;
  processing: number;
  ready: number;
  completed: number;
  cancelled: number;
}

interface SalesPoint {
  label: string;
  value: number;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  image: string | null;
  totalQty: number;
  totalRevenue: number;
}

const EMPTY_COUNTS: OrderCounts = {
  pending: 0,
  processing: 0,
  ready: 0,
  completed: 0,
  cancelled: 0,
};

/* ============================================
   CHART HELPERS
   ============================================ */

const CHART_W = 600;
const CHART_H = 220;
const CHART_TOP = 30;
const CHART_BOTTOM = 200;
const CHART_LEFT = 40;
const CHART_RIGHT = 590;

function valueToY(value: number, maxValue: number): number {
  if (maxValue <= 0) return CHART_BOTTOM;
  const ratio = value / maxValue;
  return CHART_BOTTOM - ratio * (CHART_BOTTOM - CHART_TOP);
}

function indexToX(index: number, total: number): number {
  if (total <= 1) return CHART_LEFT;
  return CHART_LEFT + (CHART_RIGHT - CHART_LEFT) * (index / (total - 1));
}

function buildLinePath(points: SalesPoint[], maxValue: number): string {
  return points
    .map((p, i) => {
      const x = indexToX(i, points.length);
      const y = valueToY(p.value, maxValue);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildAreaPath(points: SalesPoint[], maxValue: number): string {
  if (points.length === 0) return '';
  const line = buildLinePath(points, maxValue);
  const lastX = indexToX(points.length - 1, points.length);
  const firstX = indexToX(0, points.length);
  return `${line} L ${lastX.toFixed(2)} ${CHART_BOTTOM} L ${firstX.toFixed(2)} ${CHART_BOTTOM} Z`;
}

function formatK(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

/* ============================================
   COMPONENT
   ============================================ */

export default function DashboardPage() {
  const [counts, setCounts] = useState<OrderCounts>(EMPTY_COUNTS);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartRange, setChartRange] = useState('Last 7 days');

  /* ✅ Load lahat ng data from Supabase */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [countsData, ordersData, salesChart, topSelling] = await Promise.all([
          getOrderCounts(),
          getOrders('all'),
          getSalesChartData(7),
          getTopSellingProducts(4),
        ]);

        if (!cancelled) {
          setCounts(countsData);
          setRecentOrders(ordersData.slice(0, 5));
          setSalesData(salesChart);
          setTopProducts(topSelling);
        }
      } catch (error) {
        console.error('[Dashboard] Failed to load:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ✅ Compute chart metrics */
  const maxSales = Math.max(...salesData.map((p) => p.value), 1000);
  const linePath = buildLinePath(salesData, maxSales);
  const areaPath = buildAreaPath(salesData, maxSales);

  return (
    <>
      {/* HERO */}
      <section className="admin-hero">
        <div className="admin-hero__copy">
          <span className="admin-hero__eyebrow">Admin Dashboard</span>
          <h1 className="admin-hero__title">Welcome back, Admin 👋</h1>
          <p className="admin-hero__desc">
            Manage products, orders, payments, and organizations in the SJCM
            Store.
          </p>
        </div>
        <div className="admin-hero__script">
          One Campus<br />One Community
        </div>
      </section>

      {/* STATS */}
      <section className="admin-stats">
        <AdminStatCard
          label="Pending Orders"
          value={isLoading ? '…' : String(counts.pending)}
          delta="+12%"
          icon={ShoppingBag}
          spark="0,18 10,14 20,16 30,10 40,12 50,6 60,8"
        />
        <AdminStatCard
          label="Processing"
          value={isLoading ? '…' : String(counts.processing)}
          delta="+8%"
          icon={Package}
          spark="0,16 10,18 20,12 30,14 40,8 50,10 60,4"
        />
        <AdminStatCard
          label="Ready for Pickup"
          value={isLoading ? '…' : String(counts.ready)}
          delta="+8%"
          icon={Users}
          spark="0,20 10,18 20,14 30,16 40,10 50,8 60,6"
        />
        <AdminStatCard
          label="Completed"
          value={isLoading ? '…' : String(counts.completed)}
          delta="+15%"
          icon={TrendingUp}
          spark="0,22 10,18 20,20 30,12 40,14 50,8 60,4"
        />
      </section>

      {/* PANELS */}
      <section className="admin-panels">
        <div className="admin-panel-stack">
          {/* ✅ SALES OVERVIEW — Dynamic */}
          <div className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h2 className="admin-panel__title">Sales Overview</h2>
                <p className="admin-panel__sub">
                  Total sales for the {chartRange.toLowerCase()}
                </p>
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

            {isLoading ? (
              <p className="admin-empty" style={{ padding: '60px 0', textAlign: 'center' }}>
                Loading chart…
              </p>
            ) : salesData.length === 0 ? (
              <p className="admin-empty" style={{ padding: '60px 0', textAlign: 'center' }}>
                No sales data yet.
              </p>
            ) : (
              <>
                <div className="admin-chart">
                  <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22915c" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#22915c" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Y-axis labels — dynamic */}
                    {[0.25, 0.5, 0.75, 1].map((ratio) => (
                      <text
                        key={ratio}
                        className="admin-chart__axis-label"
                        x="8"
                        y={valueToY(maxSales * ratio, maxSales) + 3}
                      >
                        {formatK(maxSales * ratio)}
                      </text>
                    ))}
                    <text className="admin-chart__axis-label" x="22" y={CHART_BOTTOM + 3}>
                      0
                    </text>

                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75, 1].map((ratio) => (
                      <line
                        key={ratio}
                        className="admin-chart__grid"
                        x1={CHART_LEFT}
                        y1={valueToY(maxSales * ratio, maxSales)}
                        x2={CHART_RIGHT}
                        y2={valueToY(maxSales * ratio, maxSales)}
                      />
                    ))}

                    {/* Area + Line — dynamic */}
                    <path className="admin-chart__area" d={areaPath} />
                    <path className="admin-chart__line" d={linePath} />

                    {/* Points — dynamic */}
                    {salesData.map((p, i) => (
                      <circle
                        key={i}
                        className="admin-chart__point"
                        cx={indexToX(i, salesData.length)}
                        cy={valueToY(p.value, maxSales)}
                        r="3.5"
                      >
                        <title>
                          {p.label}: ₱{p.value.toLocaleString()}
                        </title>
                      </circle>
                    ))}
                  </svg>
                </div>

                <div
                  className="admin-chart__xaxis"
                  style={{ gridTemplateColumns: `repeat(${salesData.length}, 1fr)` }}
                >
                  {salesData.map((p) => (
                    <span key={p.label}>{p.label}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ✅ TOP SELLING PRODUCTS — Dynamic */}
          <div className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h2 className="admin-panel__title">Top Selling Products</h2>
                <p className="admin-panel__sub">Based on total orders</p>
              </div>
              <Link className="admin-panel__link" to="/admin/products">
                View all →
              </Link>
            </div>

            {isLoading ? (
              <p className="admin-empty" style={{ padding: '32px 0', textAlign: 'center' }}>
                Loading products…
              </p>
            ) : topProducts.length === 0 ? (
              <p className="admin-empty" style={{ padding: '32px 0', textAlign: 'center' }}>
                No products sold yet.
              </p>
            ) : (
              <div className="admin-products-grid">
                {topProducts.map((p) => (
                  <div key={p.id} className="admin-product-card">
                    <div className="admin-product-card__image">
                      {p.image ? (
                        <img src={p.image} alt={p.name} loading="lazy" />
                      ) : (
                        <div className="admin-product-card__placeholder">
                          <Package className="react-icon" />
                        </div>
                      )}
                    </div>
                    <div className="admin-product-card__body">
                      <p className="admin-product-card__name">{p.name}</p>
                      <p className="admin-product-card__sales">
                        {p.totalQty} order{p.totalQty === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="admin-panel-stack">
          {/* RECENT ORDERS */}
          <div className="admin-panel">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Recent Orders</h2>
              <Link className="admin-panel__link" to="/admin/orders">
                View all →
              </Link>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      Loading orders…
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <span className="admin-order-id">{o.id}</span>
                      </td>
                      <td>
                        <span className="admin-order-customer">
                          {o.customer.name}
                        </span>
                      </td>
                      <td>{o.items.length}</td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${o.status
                            .toLowerCase()
                            .replace(/\s+/g, '-')}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-order-date">{o.date}</div>
                        <div className="admin-order-date">{o.time}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* QUICK ACTIONS */}
          <div className="admin-panel">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Quick Actions</h2>
            </div>

            <div className="admin-quick-actions">
              <Link className="admin-quick-action" to="/admin/products">
                <span className="admin-quick-action__icon">
                  <Package className="react-icon" aria-hidden="true" />
                </span>
                Add Product
              </Link>

              <Link className="admin-quick-action" to="/admin/orders">
                <span className="admin-quick-action__icon">
                  <ShoppingBag className="react-icon" aria-hidden="true" />
                </span>
                Manage Orders
              </Link>

              <Link className="admin-quick-action" to="/admin/payments">
                <span className="admin-quick-action__icon">
                  <ArrowRight className="react-icon" aria-hidden="true" />
                </span>
                Payments
              </Link>

              <Link className="admin-quick-action" to="/admin/console">
                <span className="admin-quick-action__icon">
                  <Users className="react-icon" aria-hidden="true" />
                </span>
                View Reports
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}