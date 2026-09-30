// src/services/admin/adminOrdersService.ts

import type { AdminOrder } from '../../store/adminStore';

/* ============================================
   MOCK DATA
   ============================================ */

let ORDERS: AdminOrder[] = [
  {
    id: '#SJCM-0087',
    status: 'Processing',
    customer: {
      name: 'Juan Dela Cruz',
      studentId: '2024-00123',
      email: 'juan.delacruz@phinmaed.com',
      phone: '0917 555 0123',
    },
    shipping: {
      method: 'Campus Pickup',
      location: 'SJCM Supply Office (Main Campus)',
      date: '2026-08-14',
    },
    payment: { method: 'GCash', ref: '1002938481', status: 'Paid' },
    items: [
      { name: 'College PE Uniform (M)', qty: 1, price: 1000 },
      { name: 'SJC ID Lace', qty: 2, price: 80 },
    ],
    date: 'Sep 21, 2025',
    time: '10:42 AM',
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=70',
  },
  {
    id: '#SJCM-0086',
    status: 'Ready for Pickup',
    customer: {
      name: 'Maria Santos',
      studentId: '2024-00456',
      email: 'maria.santos@phinmaed.com',
      phone: '0917 555 0456',
    },
    shipping: {
      method: 'Campus Pickup',
      location: 'School Cashier Counter B',
      date: '2026-08-13',
    },
    payment: { method: 'GCash', ref: '1002938482', status: 'Paid' },
    items: [{ name: 'CITE Shirt (L)', qty: 2, price: 350 }],
    date: 'Sep 21, 2025',
    time: '09:18 AM',
    img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=200&q=70',
  },
  {
    id: '#SJCM-0085',
    status: 'Pending',
    customer: {
      name: 'Ralph Mendoza',
      studentId: '2024-00789',
      email: 'ralph.mendoza@phinmaed.com',
      phone: '0917 555 0789',
    },
    shipping: {
      method: 'Campus Pickup',
      location: 'SJCM Supply Office (Main Campus)',
      date: '2026-08-15',
    },
    payment: { method: 'Over-the-Counter', ref: '—', status: 'Unpaid' },
    items: [{ name: 'SJC ID Lace', qty: 3, price: 80 }],
    date: 'Sep 20, 2025',
    time: '04:27 PM',
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&q=70',
  },
  {
    id: '#SJCM-0084',
    status: 'Completed',
    customer: {
      name: 'Angela Reyes',
      studentId: '2024-00321',
      email: 'angela.reyes@phinmaed.com',
      phone: '0917 555 0321',
    },
    shipping: {
      method: 'Campus Pickup',
      location: 'SJHS Lobby',
      date: '2026-08-12',
    },
    payment: { method: 'GCash', ref: '1002938484', status: 'Paid' },
    items: [{ name: 'SHS PE Uniform (S)', qty: 1, price: 300 }],
    date: 'Sep 20, 2025',
    time: '01:12 PM',
    img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200&q=70',
  },
  {
    id: '#SJCM-0083',
    status: 'Cancelled',
    customer: {
      name: 'Lance Cruz',
      studentId: '2024-00654',
      email: 'lance.cruz@phinmaed.com',
      phone: '0917 555 0654',
    },
    shipping: {
      method: 'Campus Pickup',
      location: 'SJCM Supply Office (Main Campus)',
      date: '2026-08-11',
    },
    payment: { method: 'GCash', ref: '1002938485', status: 'Refunded' },
    items: [{ name: 'MASID Uniform (L)', qty: 1, price: 500 }],
    date: 'Sep 20, 2025',
    time: '11:03 AM',
    img: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=200&q=70',
  },
];

/* ============================================
   CONSTANTS
   ============================================ */

export const ORDER_FLOW: AdminOrder['status'][] = [
  'Pending',
  'Processing',
  'Ready for Pickup',
  'Completed',
];

/* ============================================
   READ
   ============================================ */

export function getOrders(filter: string = 'all'): AdminOrder[] {
  if (filter === 'all') return [...ORDERS];
  return ORDERS.filter((o) => o.status === filter);
}

export function getAllOrders(): AdminOrder[] {
  return [...ORDERS];
}

export function getOrderById(id: string): AdminOrder | undefined {
  return ORDERS.find((o) => o.id === id);
}

export function getOrderCounts() {
  return {
    pending:    ORDERS.filter((o) => o.status === 'Pending').length,
    processing: ORDERS.filter((o) => o.status === 'Processing').length,
    ready:      ORDERS.filter((o) => o.status === 'Ready for Pickup').length,
    completed:  ORDERS.filter((o) => o.status === 'Completed').length,
    cancelled:  ORDERS.filter((o) => o.status === 'Cancelled').length,
  };
}

/* ============================================
   HELPERS
   ============================================ */

export function orderTotal(order: AdminOrder): number {
  return order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

export function orderItemCount(order: AdminOrder): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}

/* ============================================
   WRITE
   ============================================ */

export function advanceOrder(id: string): AdminOrder | null {
  const order = ORDERS.find((o) => o.id === id);
  if (!order) return null;

  const idx = ORDER_FLOW.indexOf(order.status);
  if (idx === -1 || idx >= ORDER_FLOW.length - 1) {
    // Hindi na pwede i-advance (Completed na o Cancelled)
    return order;
  }

  order.status = ORDER_FLOW[idx + 1];
  return order;
}

export function setOrderStatus(id: string, status: AdminOrder['status']): AdminOrder | null {
  const order = ORDERS.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  return order;
}

export function cancelOrder(id: string): AdminOrder | null {
  return setOrderStatus(id, 'Cancelled');
}