// src/services/admin/adminActivityService.ts

import { supabase } from '../../lib/supabaseClient';

export interface AdminNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'order' | 'payment' | 'stock' | 'info';
  link?: string;
  actionLabel?: string;
}

/* ============================================
   TIME HELPER
   ============================================ */

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/* ============================================
   MAPPER
   ============================================ */

function mapNotifRow(row: any): AdminNotification {
  return {
    id: row.id,
    title: row.title,
    desc: row.message,
    time: timeAgo(row.created_at),
    read: Boolean(row.read),
    type: row.type,
    link: row.link ?? undefined,
    actionLabel: row.action_label ?? undefined,
  };
}

/* ============================================
   READ
   ============================================ */

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[Notifications] Failed to fetch:', error);
    return [];
  }

  return (data ?? []).map(mapNotifRow);
}

/* ============================================
   WRITE
   ============================================ */

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) {
    console.error('[Notifications] Mark read failed:', error);
    throw new Error(error.message);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ read: true })
    .eq('read', false);

  if (error) {
    console.error('[Notifications] Mark all read failed:', error);
    throw new Error(error.message);
  }
}

/* ============================================
   REAL-TIME SUBSCRIPTION
   ============================================ */

export function subscribeToAdminNotifications(
  onInsert: (notif: AdminNotification) => void
): () => void {
  const channel = supabase
    .channel('admin-notifications-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications',
      },
      (payload: any) => {
        onInsert(mapNotifRow(payload.new));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/* ============================================
   ACTIVITY FEED (existing)
   ============================================ */

export interface AdminActivity {
  text: string;
  time: string;
  type?: '' | 'warn' | 'info';
}

export async function getActivity(): Promise<AdminActivity[]> {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('title, message, created_at, type')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[Activity] Failed:', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    text: `${row.title} — ${row.message}`,
    time: timeAgo(row.created_at),
    type: row.type === 'stock' ? 'warn' : row.type === 'info' ? 'info' : '',
  }));
}