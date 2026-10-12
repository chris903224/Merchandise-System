// src/services/userNotifications.ts
// ✅ Para sa ORDERS/PRODUCTS notifications (user_notifications table)

import { supabase } from '../lib/supabaseClient';
import type { Notification, NotificationType } from '../types/notification';
import { getCachedData, invalidateCache } from '../utils/cache';

const TABLE_NAME = 'user_notifications';

/* ============================================
   FETCH
============================================ */

export async function fetchUserNotifications(
  userId: string
): Promise<Notification[]> {
  return getCachedData(
    `user_notifications_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[UserNotifications] Failed to fetch:', error);
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

export async function createUserNotification(
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
  const { error } = await supabase.from(TABLE_NAME).insert({
    user_id: userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link ?? null,
    action_label: notification.actionLabel ?? null,
    metadata: notification.metadata ?? {},
  });

  if (error) {
    console.error('[UserNotifications] Failed to create:', error);
    throw new Error(error.message);
  }

  invalidateCache(`user_notifications_${userId}`);
}

/* ============================================
   MARK AS READ
============================================ */

export async function markUserNotificationAsRead(
  notificationId: string
): Promise<void> {
  const { data: existing } = await supabase
    .from(TABLE_NAME)
    .select('user_id')
    .eq('id', notificationId)
    .maybeSingle();

  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('[UserNotifications] Failed to mark as read:', error);
    throw new Error(error.message);
  }

  if (existing?.user_id) {
    invalidateCache(`user_notifications_${existing.user_id}`);
  }
}

/* ============================================
   MARK ALL AS READ
============================================ */

export async function markAllUserNotificationsAsRead(
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('[UserNotifications] Failed to mark all as read:', error);
    throw new Error(error.message);
  }

  invalidateCache(`user_notifications_${userId}`);
}

/* ============================================
   DELETE
============================================ */

export async function deleteUserNotification(
  notificationId: string
): Promise<void> {
  const { data: existing } = await supabase
    .from(TABLE_NAME)
    .select('user_id')
    .eq('id', notificationId)
    .maybeSingle();

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('[UserNotifications] Failed to delete:', error);
    throw new Error(error.message);
  }

  if (existing?.user_id) {
    invalidateCache(`user_notifications_${existing.user_id}`);
  }
}

/* ============================================
   CLEAR ALL
============================================ */

export async function clearAllUserNotifications(
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('[UserNotifications] Failed to clear all:', error);
    throw new Error(error.message);
  }

  invalidateCache(`user_notifications_${userId}`);
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