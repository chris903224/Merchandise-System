// src/services/admin/adminSession.ts

import type { AdminSession } from '../../store/adminStore';

const SESSION_KEY = 'sjcm_admin_auth';
const LAST_EMAIL_KEY = 'sjcm:last-login-email';

/* ============================================
   READ
   ============================================ */

export function readAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.user) return null;

    return parsed as AdminSession;
  } catch (error) {
    console.warn('[AdminSession] Failed to read session:', error);
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  return readAdminSession() !== null;
}

export function getAdminUser() {
  return readAdminSession()?.user ?? null;
}

/* ============================================
   WRITE
   ============================================ */

export function saveAdminSession(session: AdminSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (session.remember && session.user.email) {
      localStorage.setItem(LAST_EMAIL_KEY, session.user.email);
    }
  } catch (error) {
    console.warn('[AdminSession] Failed to save session:', error);
  }
}

export function clearAdminSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LAST_EMAIL_KEY);
  } catch (error) {
    console.warn('[AdminSession] Failed to clear session:', error);
  }
}

export function getLastLoginEmail(): string | null {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY);
  } catch {
    return null;
  }
}

/* ============================================
   REDIRECT HELPERS
   ============================================ */

export function getAdminLoginRedirect(nextPath = '/admin'): string {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}