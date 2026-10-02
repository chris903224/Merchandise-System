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

/* ✅ UPDATED — may link + actionLabel na */
export interface AdminNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type?: 'order' | 'payment' | 'stock' | 'info';
  link?: string;
  actionLabel?: string;
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
  img: string | null;
}

/* ============================================
   PAYMENTS — GCash + COD only
   ============================================ */

export type AdminPaymentMethod = 'GCash' | 'COD';

export type AdminPaymentStatus =
  | 'Pending'
  | 'Verified'
  | 'Paid'
  | 'Refunded';

export interface AdminPayment {
  ref: string;
  customer: string;
  method: AdminPaymentMethod;
  account: string;
  amount: number;
  status: AdminPaymentStatus;
  date: string;
  orderId?: string;
}

/* ============================================
   PAYMONGO (keep as-is for now)
   ============================================ */

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

/* ============================================
   ORGANIZATIONS
   ============================================ */

export type AdminOrgType = 'College' | 'SHS' | 'Interest-Based';

export interface AdminOrg {
  id?: string;
  name: string;
  type: AdminOrgType;
  members: number;
  products: number;
  revenue: string;
  revenueRaw?: number;
  description?: string;
  email?: string;
  adviser?: string;
  createdAt?: string;
}

/* ============================================
   PAGES
   ============================================ */

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
   STORE INTERFACE
   ============================================ */

interface AdminStore {
  // Session
  session: AdminSession | null;
  setSession: (s: AdminSession | null) => void;
  clearSession: () => void;

  // Notifications — dynamic na
  notifications: AdminNotification[];
  setNotifications: (n: AdminNotification[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Sidebar
  isSidebarOpen: boolean;
  isSidebarPinned: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  togglePin: () => void;
  toggleSidebar: () => void;

  // Current page
  currentPage: AdminPage;
  setCurrentPage: (p: AdminPage) => void;
}

/* ============================================
   SESSION HELPERS
   ============================================ */

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

/* ============================================
   STORE
   ============================================ */

export const useAdminStore = create<AdminStore>((set, get) => ({
  /* ---------- SESSION ---------- */
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

  /* ---------- NOTIFICATIONS (dynamic) ---------- */
  notifications: [],

  setNotifications: (n) => set({ notifications: n }),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearNotifications: () => set({ notifications: [] }),

  /* ---------- SIDEBAR ---------- */
  isSidebarOpen: false,
  isSidebarPinned: false,

  openSidebar: () => set({ isSidebarOpen: true }),

  closeSidebar: () => {
    if (!get().isSidebarPinned) set({ isSidebarOpen: false });
  },

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  togglePin: () =>
    set((state) => ({
      isSidebarPinned: !state.isSidebarPinned,
      isSidebarOpen: !state.isSidebarPinned ? true : state.isSidebarOpen,
    })),

  /* ---------- CURRENT PAGE ---------- */
  currentPage: 'home',
  setCurrentPage: (p) => set({ currentPage: p }),
}));