// src/services/organization/orgSessionService.ts

export interface OrgSession {
  userId: string;
  email: string;
  role: 'admin' | 'staff' | 'member' | string; // Pinalawak para sure
  name: string;
  organization: string;
}

const ORG_SESSION_KEY = 'sjcm_org_session';

/* ============================================
   SAVE SESSION
   ============================================ */
export function saveOrgSession(session: OrgSession): void {
  try {
    localStorage.setItem(ORG_SESSION_KEY, JSON.stringify(session));
    console.log('[OrgSession] ✅ Session saved:', session);
  } catch (error) {
    console.error('[OrgSession] ❌ Failed to save session:', error);
  }
}

/* ============================================
   GET SESSION
   ============================================ */
export function getOrgSession(): OrgSession | null {
  try {
    const raw = localStorage.getItem(ORG_SESSION_KEY);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    
    // Basic validation para sure na tama ang structure
    if (parsed && typeof parsed.userId === 'string') {
      return parsed as OrgSession;
    }
    return null;
  } catch (error) {
    console.error('[OrgSession] ❌ Failed to parse session:', error);
    return null;
  }
}

/* ============================================
   CLEAR SESSION (Para sa Logout)
   ============================================ */
export function clearOrgSession(): void {
  localStorage.removeItem(ORG_SESSION_KEY);
  console.log('[OrgSession] 🗑️ Session cleared');
}

/* ============================================
   GET AUTH HEADERS (Para sa Database Trigger)
   ============================================ */
export function getOrgAuthHeaders(): Record<string, string> {
  const session = getOrgSession();
  
  if (!session) {
    return {
      'x-org-role': '',
      'x-org-user-id': '',
    };
  }

  return {
    'x-org-role': session.role ?? '',
    'x-org-user-id': session.userId ?? '',
  };
}