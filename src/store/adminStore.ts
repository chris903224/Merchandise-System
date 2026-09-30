// src/store/adminStore.ts

import { create } from 'zustand';

/* ============================================
   TYPES
   ============================================ */

export interface AdminSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
  };
  loginAt: number;
  remember: boolean;
}

export interface AdminNotification {
  id: number;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  stockState: 'in-stock' | 'low-stock' | 'out';
  stockLabel: string;
  img: string;
}

export type AdminOrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Ready for Pickup'
  | 'Completed'
  | 'Cancelled';

export interface AdminOrder {
  id: string;
  status: AdminOrderStatus;
  customer: {
    name: string;
    studentId: string;
    email: string;
    phone: string;
  };
  shipping: {
    method: string;
    location: string;
    date: string;
  };
  payment: {
    method: string;
    ref: string;
    status: string;
  };
  items: {
    name: string;
    qty: number;
    price: number;
  }[];
  date: string;
  time: string;
  img: string;
}

export type AdminPaymentMethod = 'GCash' | 'Bank' | 'OTC';
export type AdminPaymentStatus = 'Verified' | 'Pending' | 'Refunded';

export interface AdminPayment {
  ref: string;
  customer: string;
  method: AdminPaymentMethod;
  account: string;
  amount: number;
  status: AdminPaymentStatus;
  date: string;
}

export type AdminPayMongoChannel = 'QR Ph' | 'GCash' | 'Maya' | 'Card';
export type AdminPayMongoStatus = 'Paid' | 'Pending' | 'Failed' | 'Expired';

export interface AdminPayMongoTxn {
  id: string;
  customer: string;
  channel: AdminPayMongoChannel;
  amount: number;
  status: AdminPayMongoStatus;
  date: string;
}

export type AdminOrgType = 'College' | 'SHS' | 'Interest-Based';

export interface AdminOrg {
  name: string;
  type: AdminOrgType;
  members: number;
  products: number;
  revenue: string;
}

export type AdminPage =
  | 'home'
  | 'products'
  | 'orders'
  | 'payments'
  | 'paymongo'
  | 'orgs'
  | 'console'
  | 'profile'
  | 'settings';

/* ============================================
   STORE
   ============================================ */

interface AdminStore {
  // Session
  session: AdminSession | null;
  setSession: (s: AdminSession | null) => void;
  clearSession: () => void;

  // Notifications
  notifications: AdminNotification[];
  markNotificationRead: (id: number) => void;
  markAllNotificationsRead: () => void;

  // Sidebar
  isSidebarOpen: boolean;
  isSidebarPinned: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  togglePin: () => void;
  toggleSidebar: () => void;

  // Current page (fallback — router usually handles this)
  currentPage: AdminPage;
  setCurrentPage: (p: AdminPage) => void;
}

const SESSION_KEY = 'sjcm_admin_auth';

function loadSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  { id: 1, title: 'New order placed', desc: 'Juan Dela Cruz — ₱1,000 PE Uniform', time: '2 min ago', read: false },
  { id: 2, title: 'Payment pending', desc: 'GCash #TXN-0450 awaiting verification', time: '32 min ago', read: false },
  { id: 3, title: 'Low stock', desc: 'CITE Windbreaker is out of stock', time: '1 hr ago', read: false },
  { id: 4, title: 'Weekly report ready', desc: 'Sales summary for Sep 14–20', time: '5 hrs ago', read: true },
];

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Session
  session: loadSession(),
  setSession: (s) => {
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('[AdminStore] Failed to persist session:', error);
    }
    set({ session: s });
  },
  clearSession: () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('sjcm:last-login-email');
    } catch (error) {
      console.warn('[AdminStore] Failed to clear session:', error);
    }
    set({ session: null });
  },

  // Notifications
  notifications: INITIAL_NOTIFICATIONS,
  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  // Sidebar
  isSidebarOpen: false,
  isSidebarPinned: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => {
    if (!get().isSidebarPinned) set({ isSidebarOpen: false });
  },
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  togglePin: () =>
    set((state) => ({
      isSidebarPinned: !state.isSidebarPinned,
      isSidebarOpen: !state.isSidebarPinned ? true : state.isSidebarOpen,
    })),

  // Current page
  currentPage: 'home',
  setCurrentPage: (p) => set({ currentPage: p }),
}));