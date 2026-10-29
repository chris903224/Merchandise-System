// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

/* ============================================================
   ✅ SUPABASE CLIENTS
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
    detectSessionInUrl: true,
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

/* ============================================
   ✅ ORGANIZATION CLIENT — sb-org-auth-token
============================================ */
export const supabaseOrg = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'sb-org-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/* ============================================
   🚨 IMPERSONATION FUNCTION (Backend API)
   ✅ Wala nang service role key sa browser
   ✅ Tumatawag sa server.ts endpoint
============================================ */
export async function viewAsStudent(studentEmail: string) {
  // 🚨 1. Kunin ang Admin JWT Token
  const { data: { session: adminSession } } = await supabaseAdmin.auth.getSession();
  
  if (!adminSession?.access_token) {
    throw new Error('Admin session not found. Please log in again.');
  }

  // 🚨 2. Tawagin ang backend API na may JWT
  const response = await fetch('http://localhost:3001/api/admin/impersonate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminSession.access_token}`,
    },
    body: JSON.stringify({ studentEmail }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to impersonate');
  }

  const data = await response.json();

  // 🚨 3. I-save ang Admin Session
  localStorage.setItem('admin_backup_session', JSON.stringify(adminSession));
  sessionStorage.setItem('sjc_impersonating', 'true');

  // 🚨 4. Redirect
  window.location.href = data.actionLink;
}