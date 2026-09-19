// src/store/notificationStore.ts

import { create } from 'zustand';
import type { Notification } from '../types/notification';
import { supabase } from '../lib/supabaseClient';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationService,
  clearAllNotifications,
} from '../services/notifications';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  realtimeChannel: ReturnType<typeof supabase.channel> | null;
  loadNotifications: (userId: string) => Promise<void>;
  subscribeToRealtime: (userId: string) => void;
  unsubscribeFromRealtime: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: (userId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  realtimeChannel: null,

  // ============================================
  // LOAD NOTIFICATIONS FROM SUPABASE
  // ============================================
  loadNotifications: async (userId: string) => {
    set({ isLoading: true });
    const notifications = await fetchNotifications(userId);
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount, isLoading: false });
  },

  // ============================================
  // REAL-TIME SUBSCRIPTION
  // ============================================
  subscribeToRealtime: (userId: string) => {
    const existing = get().realtimeChannel;
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Notifications] Realtime INSERT:', payload.new);
          const newNotification: Notification = {
            id: payload.new.id,
            userId: payload.new.user_id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            link: payload.new.link ?? undefined,
            actionLabel: payload.new.action_label ?? undefined,
            read: payload.new.read,
            metadata: payload.new.metadata ?? {},
            createdAt: payload.new.created_at,
          };
          get().addNotification(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Notifications] Realtime UPDATE:', payload.new);
          set((state) => {
            const notifications = state.notifications.map((n) =>
              n.id === payload.new.id
                ? {
                    ...n,
                    read: payload.new.read,
                    title: payload.new.title,
                    message: payload.new.message,
                  }
                : n
            );
            const unreadCount = notifications.filter((n) => !n.read).length;
            return { notifications, unreadCount };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Notifications] Realtime DELETE:', payload.old);
          set((state) => {
            const notifications = state.notifications.filter(
              (n) => n.id !== payload.old.id
            );
            const unreadCount = notifications.filter((n) => !n.read).length;
            return { notifications, unreadCount };
          });
        }
      )
      .subscribe((status) => {
        console.log('[Notifications] Realtime status:', status);
      });

    set({ realtimeChannel: channel });
  },

  unsubscribeFromRealtime: () => {
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ realtimeChannel: null });
    }
  },

  // ============================================
  // ADD NOTIFICATION (optimistic)
  // ============================================
  addNotification: (notification: Notification) => {
    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }
      const notifications = [notification, ...state.notifications];
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });
  },

  // ============================================
  // MARK AS READ
  // ============================================
  markAsRead: async (id: string) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('[Notifications] Failed to mark as read:', error);
    }
  },

  // ============================================
  // MARK ALL AS READ
  // ============================================
  markAllAsRead: async () => {
    const userId = get().notifications[0]?.userId;
    if (!userId) return;

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));

    try {
      await markAllNotificationsAsRead(userId);
    } catch (error) {
      console.error('[Notifications] Failed to mark all as read:', error);
    }
  },

  // ============================================
  // DELETE NOTIFICATION
  // ============================================
  deleteNotification: async (id: string) => {
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });

    try {
      await deleteNotificationService(id);
    } catch (error) {
      console.error('[Notifications] Failed to delete:', error);
    }
  },

  // ============================================
  // ✅ CLEAR ALL NOTIFICATIONS
  // ============================================
  clearAll: async (userId: string) => {
    // Optimistic update — instant UI clear
    set({ notifications: [], unreadCount: 0 });

    try {
      await clearAllNotifications(userId);
    } catch (error) {
      console.error('[Notifications] Failed to clear all:', error);
      // Revert kung may error
      const notifications = await fetchNotifications(userId);
      const unreadCount = notifications.filter((n) => !n.read).length;
      set({ notifications, unreadCount });
      throw error;
    }
  },

  // ============================================
  // RESET
  // ============================================
  reset: () => {
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
    }
    set({
      notifications: [],
      unreadCount: 0,
      realtimeChannel: null,
    });
  },
}));