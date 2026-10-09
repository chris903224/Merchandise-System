// src/services/useNotificationPrefs.ts

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/* ============================================================
   ✅ NOTIFICATION PREFERENCES HOOK
   Nasa services/ folder — hindi na kailangan ng bagong hooks/ folder
   4 toggles: email, order_updates, ready_for_delivery, pickup_reminders
============================================================ */

export type NotificationPrefs = {
  email_notifications: boolean;
  order_updates: boolean;
  ready_for_delivery: boolean;
  pickup_reminders: boolean;
};

const DEFAULTS: NotificationPrefs = {
  email_notifications: true,
  order_updates: true,
  ready_for_delivery: true,
  pickup_reminders: true,
};

export function useNotificationPrefs(userId: string | undefined) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('user_notification_prefs')
          .select(
            'email_notifications, order_updates, ready_for_delivery, pickup_reminders'
          )
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (!cancelled) {
          setPrefs(data ?? DEFAULTS);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[Prefs] Load failed:', err);
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const save = useCallback(
    async (next: Partial<NotificationPrefs>) => {
      if (!userId) return;

      const merged = { ...prefs, ...next };
      setPrefs(merged);
      setSaving(true);
      setError(null);

      try {
        const { error } = await supabase
          .from('user_notification_prefs')
          .upsert(
            {
              user_id: userId,
              ...merged,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) throw error;
      } catch (err: any) {
        console.error('[Prefs] Save failed:', err);
        setError(err.message);
        setPrefs(prefs);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, prefs]
  );

  return { prefs, loading, saving, error, save };
}