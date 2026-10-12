// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

/* ============================================================
   ✅ SUPABASE CLIENTS
   - supabase → para sa USER
   - supabaseAdmin → para sa ADMIN (separate storage)
   - Isolated sessions — hindi na mag-o-overwrite
============================================================ */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Check your .env.local file and restart Vite.'
  );
}

/* ============================================
   ✅ USER CLIENT — sb-user-auth-token
============================================ */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'sb-user-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/* ============================================
   ✅ ADMIN CLIENT — sb-admin-auth-token
============================================ */
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'sb-admin-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

if (import.meta.env.DEV) {
  console.log('[Supabase] Clients initialized:', supabaseUrl);
}