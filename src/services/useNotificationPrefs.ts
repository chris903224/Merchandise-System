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

  /* ============================================================
     ✅ LOAD — kapag nagbago ang userId
  ============================================================ */
  useEffect(() => {
    // ✅ Kapag walang user, i-reset lahat sa defaults
    if (!userId) {
      setPrefs(DEFAULTS);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

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
          // ✅ Kung walang row, gamitin ang DEFAULTS
          setPrefs(data ?? DEFAULTS);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[Prefs] Load failed:', err);
        if (!cancelled) {
          setError(err.message);
          setPrefs(DEFAULTS);  // ✅ fallback sa defaults
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /* ============================================================
     ✅ SAVE — hindi na umaasa sa `prefs` closure
     Direkta nang tinatanggap ang buong NotificationPrefs object
  ============================================================ */
  const save = useCallback(
    async (next: NotificationPrefs) => {
      if (!userId) {
        throw new Error('No user logged in');
      }

      // ✅ Optimistic update — direkta nang gamitin ang `next`
      setPrefs(next);
      setSaving(true);
      setError(null);

      try {
        const { error } = await supabase
          .from('user_notification_prefs')
          .upsert(
            {
              user_id: userId,
              ...next,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) throw error;
      } catch (err: any) {
        console.error('[Prefs] Save failed:', err);
        setError(err.message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId]  // ✅ TANGGALIN ang `prefs` — hindi na kailangan
  );

  return { prefs, loading, saving, error, save };
}