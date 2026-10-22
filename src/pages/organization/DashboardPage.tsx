// src/pages/organization/DashboardPage.tsx

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../store';
import StatCard from '../../components/organization/StatCard';
import SalesChart from '../../components/organization/SalesChart';
import ActivityFeed from '../../components/organization/ActivityFeed';
import QuickAction from '../../components/organization/QuickAction';
import UpcomingList from '../../components/organization/UpcomingList';
import { Icon } from '../../components/Icon';
import { peso } from '../../utils/format';
import type { Product, Order } from '../../types';
import type { KPI, SalesPoint, ActivityItem } from '../../types/organization';

const LOW_STOCK = 10;

function totalStock(p: Product): number {
  if (p.sizeStocks && Object.keys(p.sizeStocks).length > 0) {
    return Object.values(p.sizeStocks).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  return p.stock ?? 0;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function kpiColor(k: KPI['key']): 'g1' | 'g2' | 'g3' | 'g4' {
  const map: Record<KPI['key'], 'g1' | 'g2' | 'g3' | 'g4'> = { 
    products: 'g1', 
    revenue: 'g2', 
    orders: 'g3', 
    members: 'g4' 
  };
  return map[k];
}

function kpiIcon(k: KPI['key']): string {
  return { products: 'box', revenue: 'card', orders: 'cart', members: 'users' }[k];
}

export default function DashboardPage() {
  const { session, products, orders } = useApp();
  const [range, setRange] = useState<7 | 30>(7);

  // ✅ Kinukuha lahat ng products at orders (walang filter)
  const myProducts = useMemo(() => products, [products]);
  const myOrders = useMemo(() => orders, [orders]);

  const kpis: KPI[] = useMemo(() => {
    const revenue = myOrders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((t, o) => t + o.totalAmount, 0);

    const members = new Set(myOrders.map((o) => o.userId)).size;

    return [
      { key: 'products', label: 'Total Products', value: myProducts.length },
      { key: 'revenue',  label: 'Total Revenue',  value: peso(revenue) },
      { key: 'orders',   label: 'Total Orders',   value: myOrders.length },
      { key: 'members',  label: 'Active Members', value: members },
    ];
  }, [myProducts, myOrders]);

  const sales: SalesPoint[] = useMemo(
    () => buildSalesPoints(myOrders, range),
    [myOrders, range]
  );

  const activity: ActivityItem[] = useMemo(
    () => buildActivity(myOrders, myProducts),
    [myOrders, myProducts]
  );

  const firstName = session?.name?.trim().split(' ')[0] ?? 'there';

  return (
    <section className="page-dashboard">
      {/* HERO SECTION */}
      <div className="glass hero">
        <small>{getGreeting()}</small>
        <h1>Welcome back, {firstName}!</h1>
        <p>Here's what's happening with your organization today.</p>
        <p className="dt">
          <Icon name="calendar" />
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </p>
        <blockquote className="quote">Small steps every day lead to big results.</blockquote>
      </div>

      {/* KPI STATS CARDS */}
      <div className="stats">
        {kpis.map((k) => (
          <StatCard
            key={k.key}
            color={kpiColor(k.key)}
            icon={kpiIcon(k.key)}
            label={k.label}
            value={k.value}
          />
        ))}
      </div>

      {/* MAIN CONTENT COLUMNS */}
      <div className="cols">
        {/* LEFT COLUMN: Sales Chart & Activity */}
        <div className="stack">
          <div className="glass card">
            <h3>
              <Icon name="chart" /> Sales Overview
              <select
                className="sel"
                value={range}
                onChange={(e) => setRange(Number(e.target.value) as 7 | 30)}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </h3>
            <SalesChart data={sales} />
          </div>

          <div className="glass card">
            <h3>
              <Icon name="clock" /> Recent Activity
              <Link to="/org/notifications" className="link">View all</Link>
            </h3>
            <ActivityFeed items={activity} />
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions & Upcoming */}
        <div className="stack">
          <div className="glass card">
            <h3><Icon name="bolt" /> Quick Actions</h3>
            <QuickAction to="/org/products" color="#7c5cff" icon="plus" label="Add Product" />
            <QuickAction to="/org/orders"   color="#3b7bff" icon="cart" label="View Orders" />
            <QuickAction to="/org/orders"   color="#2fb594" icon="card" label="Manage Payments" />
            <QuickAction to="/org/settings" color="#f0933a" icon="gear" label="Adjust Settings" />
          </div>

          <div className="glass card">
            <h3>
              <Icon name="calendar" /> Upcoming
              <Link to="/org/orders" className="link">View all</Link>
            </h3>
            <UpcomingList items={activity.slice(0, 3)} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

function buildSalesPoints(orders: Order[], days: 7 | 30): SalesPoint[] {
  const buckets: Record<string, number> = {};
  const now = new Date();

  // Initialize buckets for each day
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = 0;
  }

  // Add order amounts to buckets
  orders
    .filter((o) => o.paymentStatus === 'Paid')
    .forEach((o) => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += o.totalAmount / 1000;
    });

  return Object.entries(buckets).map(([k, v]) => ({
    label: new Date(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: v,
  }));
}

function buildActivity(orders: Order[], products: Product[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  // Recent Orders (Top 3)
  [...orders]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 3)
    .forEach((o) => {
      items.push({
        id: `order-${o.id}`,
        icon: o.paymentStatus === 'Paid' ? 'card' : 'cart',
        color: o.paymentStatus === 'Paid' ? 'g3' : 'g2',
        title: o.paymentStatus === 'Paid'
          ? `Payment received • #${o.id}`
          : `New order • #${o.id}`,
        subtitle: `${o.customerName} • ${peso(o.totalAmount)}`,
        at: o.createdAt,
      });
    });

  // Low Stock Alerts (Top 2)
  products
    .filter((p) => totalStock(p) <= LOW_STOCK)
    .slice(0, 2)
    .forEach((p) => {
      const t = totalStock(p);
      items.push({
        id: `stock-${p.id}`,
        icon: 'box',
        color: t <= 0 ? 'g5' : 'g4',
        title: t <= 0 ? `Out of stock • ${p.name}` : `Low stock • ${p.name}`,
        subtitle: `${t} unit${t === 1 ? '' : 's'} left`,
        at: new Date().toISOString(),
      });
    });

  return items.slice(0, 4);
}