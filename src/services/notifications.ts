// src/services/notifications.ts

import { supabase } from '../lib/supabaseClient';
import type { Notification, NotificationType } from '../types/notification';
import { getCachedData, invalidateCache } from '../utils/cache';

/* ============================================
   FETCH — user notifications
   ============================================ */

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  return getCachedData(
    `notifications_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[Notifications] Failed to fetch:', error);
        return [];
      }

      return (data ?? []).map(mapNotificationRow);
    },
    2 * 60 * 1000
  );
}

/* ============================================
   CREATE
   ============================================ */

export async function createNotification(
  userId: string,
  notification: {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link ?? null,
    action_label: notification.actionLabel ?? null,
    metadata: notification.metadata ?? {},
  });

  if (error) {
    console.error('[Notifications] Failed to create:', error);
    throw new Error(error.message);
  }

  invalidateCache(`notifications_${userId}`);
}

/* ============================================
   ✅ MARK AS READ — with cache invalidation
   ============================================ */

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // ✅ Kunin muna yung user_id
  const { data: existing } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('id', notificationId)
    .maybeSingle();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('[Notifications] Failed to mark as read:', error);
    throw new Error(error.message);
  }

  // ✅ Invalidate user cache
  if (existing?.user_id) {
    invalidateCache(`notifications_${existing.user_id}`);
  }
}

/* ============================================
   ✅ MARK ALL AS READ
   ============================================ */

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('[Notifications] Failed to mark all as read:', error);
    throw new Error(error.message);
  }

  invalidateCache(`notifications_${userId}`);
}

/* ============================================
   ✅ DELETE — with cache invalidation
   ============================================ */

export async function deleteNotification(notificationId: string): Promise<void> {
  // ✅ Kunin muna yung user_id
  const { data: existing } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('id', notificationId)
    .maybeSingle();

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('[Notifications] Failed to delete:', error);
    throw new Error(error.message);
  }

  // ✅ Invalidate user cache
  if (existing?.user_id) {
    invalidateCache(`notifications_${existing.user_id}`);
  }
}

/* ============================================
   CLEAR ALL
   ============================================ */

export async function clearAllNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('[Notifications] Failed to clear all:', error);
    throw new Error(error.message);
  }

  invalidateCache(`notifications_${userId}`);
}

/* ============================================
   MAPPER
   ============================================ */

function mapNotificationRow(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link ?? undefined,
    actionLabel: row.action_label ?? undefined,
    read: row.read,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}