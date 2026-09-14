// src/store/notificationStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification, NotificationType } from '../types/notification';  // 👈 ADD NotificationType

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
  getNotifications: () => Notification[];
}

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
};

// Get current timestamp
const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Storage key
const STORAGE_KEY = 'sjcm_notifications';

// Helper to get current user ID from session
const getUserId = (): string | null => {
  try {
    const stored = localStorage.getItem('sjcm-store-storage');
    if (stored) {
      const data = JSON.parse(stored);
      const state = data.state;
      if (state && state.session && state.session.id) {
        return state.session.id;
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const userId = getUserId();
        if (!userId) return;

        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          userId: userId,
          createdAt: getCurrentTimestamp(),
          read: false,
        };

        set((state) => {
          const updated = [newNotification, ...state.notifications];
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },

      markAsRead: (id) => {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => {
          const updated = state.notifications.map((n) => ({ ...n, read: true }));
          return {
            notifications: updated,
            unreadCount: 0,
          };
        });
      },

      deleteNotification: (id) => {
        set((state) => {
          const updated = state.notifications.filter((n) => n.id !== id);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      getUnreadCount: () => {
        return get().unreadCount;
      },

      getNotifications: () => {
        return get().notifications;
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// Helper functions for creating notifications
export const createOrderNotification = (
  orderId: string,
  status: string,
  message?: string
) => {
  const titles: Record<string, string> = {
    Pending: 'Order Placed',
    Processing: 'Order Processing',
    'Ready for Pickup': 'Order Ready for Pickup',
    Claimed: 'Order Claimed',
    Cancelled: 'Order Cancelled',
  };

  const messages: Record<string, string> = {
    Pending: `Your order #${orderId} has been placed successfully.`,
    Processing: `Your order #${orderId} is now being processed.`,
    'Ready for Pickup': `Your order #${orderId} is now ready for pickup at the SJCM Supply Office.`,
    Claimed: `Your order #${orderId} has been claimed. Thank you for shopping!`,
    Cancelled: `Your order #${orderId} has been cancelled.`,
  };

  const types: Record<string, NotificationType> = {
    Pending: 'order',
    Processing: 'order',
    'Ready for Pickup': 'pickup',
    Claimed: 'info',
    Cancelled: 'info',
  };

  return {
    title: titles[status] || 'Order Update',
    message: message || messages[status] || `Your order #${orderId} has been updated.`,
    type: types[status] || 'order',
    link: `/orders/${orderId}`,
    actionLabel: 'View Order',
    metadata: { orderId, status },
  };
};

export const createPromoNotification = (title: string, message: string, link?: string) => ({
  title,
  message,
  type: 'promo' as NotificationType,
  link: link || '/catalog',
  actionLabel: 'Browse',
});

export const createSystemNotification = (title: string, message: string) => ({
  title,
  message,
  type: 'system' as NotificationType,
  link: undefined,
  actionLabel: undefined,
});