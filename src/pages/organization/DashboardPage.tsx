// src/pages/organization/DashboardPage.tsx

import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../store';
import StatCard from '../../components/organization/StatCard';
import SalesChart from '../../components/organization/SalesChart';
import ActivityFeed from '../../components/organization/ActivityFeed';
import QuickAction from '../../components/organization/QuickAction';
import UpcomingList from '../../components/organization/UpcomingList';
import { Icon } from '../../components/Icon';
import { peso } from '../../utils/format';
import { supabase } from '../../lib/supabaseClient'; // 👈 IDINAGDAG
import type { Product, Order } from '../../types';
import type { SalesPoint, ActivityItem } from '../../types/organization';

const LOW_STOCK = 10;

/* ============================================================
   ANIMATED NUMBER HOOK
   ============================================================ */
function useAnimatedNumber(target: number, isCurrency = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) return;

    const duration = 1000; 
    const startTime = performance.now();

    const updateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    };

    requestAnimationFrame(updateNumber);
  }, [target]);

  if (isCurrency) return peso(count);
  return count.toLocaleString();
}

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */
function totalStock(p: Product): number {
  if (p.sizeStocks && Object.keys(p.sizeStocks).length > 0) {
    return Object.values(p.sizeStocks).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  return p.stock ?? 0;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function DashboardPage() {
  const { session, products, orders } = useApp();
  const [range, setRange] = useState<7 | 30>(7);
  
  // ✅ Bagong state para sa product images
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  // ✅ Fetch products (id, image lang) pagka-load
  useEffect(() => {
    async function fetchImages() {
      const { data } = await supabase.from('products').select('id, image');
      if (data) setDbProducts(data);
    }
    fetchImages();
  }, []);

  const myProducts = useMemo(() => products, [products]);
  const myOrders = useMemo(() => orders, [orders]);

  const revenue = useMemo(
    () => myOrders.filter((o) => o.paymentStatus === 'Paid').reduce((t, o) => t + o.totalAmount, 0),
    [myOrders]
  );
  const members = useMemo(() => new Set(myOrders.map((o) => o.userId)).size, [myOrders]);

  const animatedProducts = useAnimatedNumber(myProducts.length);
  const animatedRevenue = useAnimatedNumber(revenue, true);
  const animatedOrders = useAnimatedNumber(myOrders.length);
  const animatedMembers = useAnimatedNumber(members);

  const sales: SalesPoint[] = useMemo(
    () => buildSalesPoints(myOrders, range),
    [myOrders, range]
  );

  // ✅ Ipinasa ang dbProducts para magamit sa image mapping
  const activity: ActivityItem[] = useMemo(
    () => buildActivity(myOrders, myProducts, dbProducts),
    [myOrders, myProducts, dbProducts]
  );

  const firstName = session?.name?.trim().split(' ')[0] ?? 'there';

  return (
    <section className="page-dashboard">
      {/* ROW 1 — WELCOME CARD */}
      <div className="glass hero">
        <div className="hero-body">
          <div className="hero-main">
            <div className="greeting-row">
              <span className="greeting-badge">
                <span className="dot"></span> {getGreeting()}
              </span>
              <span className="hero-date">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1>Welcome back, <span className="hl">{firstName}</span>.</h1>
            <p className="hero-desc">
              Here's your organization's performance overview for today.
            </p>
          </div>
          <div className="hero-side">
            <div className="status-indicator">
              <span className="status-dot"></span>
              System Online
            </div>
            <p className="hero-quote">
              "Small steps every day lead to big results."
            </p>
          </div>
        </div>
      </div>

      {/* ROW 2 — KPI STATS */}
      <div className="stats">
        <StatCard color="g1" icon="box" label="Total Products" value={animatedProducts} />
        <StatCard color="g2" icon="card" label="Total Revenue" value={animatedRevenue} />
        <StatCard color="g3" icon="cart" label="Total Orders" value={animatedOrders} />
        <StatCard color="g4" icon="users" label="Active Members" value={animatedMembers} />
      </div>

      {/* ROW 3 — BENTO GRID */}
      <div className="glass card b-chart">
        <h3>
          <Icon name="chart" />
          <span className="ttl">Sales Overview</span>
          <label className="sel-wrap">
            <Icon name="calendar" />
            <select
              className="sel"
              value={range}
              aria-label="Sales range"
              onChange={(e) => setRange(Number(e.target.value) as 7 | 30)}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </label>
        </h3>
        <SalesChart data={sales} />
      </div>

      <div className="glass card b-activity">
        <h3>
          <Icon name="clock" />
          <span className="ttl">Recent Activity</span>
          <Link to="/org/notifications" className="link">View all</Link>
        </h3>
        {activity.length > 0 ? (
          <ActivityFeed items={activity} />
        ) : (
          <p className="dash-empty">No recent activity yet. New orders and stock alerts will show up here.</p>
        )}
      </div>

      <div className="b-side">
        <div className="glass card b-actions">
          <h3>
            <Icon name="bolt" />
            <span className="ttl">Quick Actions</span>
          </h3>
          <QuickAction to="/org/products" color="#7c5cff" icon="plus" label="Add Product" />
          <QuickAction to="/org/orders"   color="#3b7bff" icon="cart" label="View Orders" />
          <QuickAction to="/org/orders"   color="#2fb594" icon="card" label="Manage Payments" />
        </div>

        <div className="glass card b-upcoming">
          <h3>
            <Icon name="calendar" />
            <span className="ttl">Upcoming</span>
            <Link to="/org/orders" className="link">View all</Link>
          </h3>
          {activity.length > 0 ? (
            <UpcomingList items={activity.slice(0, 3)} />
          ) : (
            <p className="dash-empty">Nothing upcoming right now.</p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */
function buildSalesPoints(orders: Order[], days: 7 | 30): SalesPoint[] {
  const buckets: Record<string, number> = {};
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets[localDayKey(d)] = 0;
  }

  orders
    .filter((o) => o.paymentStatus === 'Paid')
    .forEach((o) => {
      const key = localDayKey(new Date(o.createdAt));
      if (key in buckets) buckets[key] += o.totalAmount / 1000;
    });

  return Object.entries(buckets).map(([k, v]) => {
    const [y, m, d] = k.split('-').map(Number);
    return {
      label: new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: v,
    };
  });
}

/* ✅ UPDATED: May kasamang dbProducts para mag-attach ng image */
function buildActivity(
  orders: Order[], 
  products: Product[], 
  dbProducts: any[] // 👈 Bagong parameter
): ActivityItem[] {
  const items: ActivityItem[] = [];

  // Helper para hanapin ang image ng product
  const getImage = (order: Order) => {
    const firstItem = order.items[0];
    if (!firstItem) return null;
    
    // Try multiple ID fields
    const itemId = (firstItem as any).productId || (firstItem as any).id;
    if (!itemId) return null;

    const product = dbProducts.find((p) => String(p.id) === String(itemId));
    return product?.image || null;
  };

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
        image: getImage(o), // 👈 I-attach ang image
      } as any);
    });

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
        image: p.image, // 👈 I-attach ang image ng product
      } as any);
    });

  return items.slice(0, 4);
}