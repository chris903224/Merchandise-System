// src/types/organization.ts

import type { Product, Order, SessionUser } from '../types';

// Re-export real types para madaling i-import
export type { Product, Order };

/* ============================================
   SESSION ALIAS
   Ito ang hinahanap ng Sidebar at Topbar components
============================================ */
export type Session = SessionUser;

/* ============================================
   KPIs (Dashboard)
============================================ */
export interface KPI {
  key: 'products' | 'revenue' | 'orders' | 'members';
  label: string;
  value: number | string;
  delta?: string;
}

export interface SalesPoint {
  label: string;
  value: number;
}

export interface ActivityItem {
  id: string;
  icon: string;
  color: 'g1' | 'g2' | 'g3' | 'g4' | 'g5';
  title: string;
  subtitle: string;
  at: string;
}

/* ============================================
   Products (Filters)
============================================ */
export interface ProductFiltersState {
  category: string;
  stock: 'ALL' | 'IN' | 'LOW' | 'OUT';
  sort: 'featured' | 'sa' | 'sd' | 'n' | 'pa';
  page: number;
  search: string;
}

/* ============================================
   Orders (Filters)
============================================ */
export type OrderFilter =
  | 'all'
  | 'pending-payment'
  | 'paid'
  | 'pending-order'
  | 'processing'
  | 'ready'
  | 'claimed'
  | 'cancelled';

/* ============================================
   Settings
============================================ */
export interface OrgPreferences {
  language: 'en' | 'fil' | 'es' | 'zh' | 'ja' | 'ko' | 'fr';
  timezone: string;
  dateFormat: 'MDY' | 'DMY' | 'ISO';
  hourFormat: '12' | '24';
  notif: { orders: boolean; payments: boolean; weekly: boolean };
  theme: string;
  uiStyle: 'glass' | 'neu' | 'clay' | 'skeu';
}