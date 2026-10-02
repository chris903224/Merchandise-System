// src/types/notification.ts

export type NotificationType = 'order' | 'system' | 'promo' | 'pickup' | 'info';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  link?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}