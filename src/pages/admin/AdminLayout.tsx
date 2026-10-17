// src/pages/admin/AdminLayout.tsx

import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AdminSidebar, AdminTopbar, AdminToastStack } from '../../components/admin';
import { useAdminStore } from '../../store/adminStore';
import { readAdminSession } from '../../services/admin';
import '../../styles/admin/admin.css';
<<<<<<< HEAD
=======
import '../../styles/admin/palettes/base.css';
import '../../styles/admin/palettes/midnight.css';
import '../../styles/admin/palettes/sand.css';
import '../../styles/admin/palettes/ocean.css';
import '../../styles/admin/clay-theme.css';
import '../../styles/admin/glass-theme.css';
import { applyAdminTheme, getAdminTheme } from '../../lib/adminTheme';
>>>>>>> a7179a9 ( admin side themes)

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, setSession } = useAdminStore();

  useEffect(() => {
    // ✅ I-check ang stored session
    const stored = readAdminSession();

    console.log('[AdminLayout] Session check:', {
      hasStoreSession: !!session,
      hasStoredSession: !!stored,
      currentPath: location.pathname,
    });

    // ✅ Kung WALANG session sa store at WALANG stored session
    // → redirect sa login
    if (!session && !stored) {
      console.log('[AdminLayout] ❌ No session — redirecting to /admin/login');
      navigate('/admin/login', { replace: true });
      return;
    }

    // ✅ Kung may stored session pero walang store session
    // → hydrate ang store
    if (stored && !session) {
      console.log('[AdminLayout] 🔄 Hydrating session from storage');
      setSession(stored);
    }

    // ✅ Kung may session (store or stored) — allow access
    console.log('[AdminLayout] ✅ Access granted');
  }, [navigate, session, setSession, location.pathname]);

  // ✅ Render nothing habang nag-w-wait ng session
  const stored = readAdminSession();
  if (!session && !stored) {
    return null;
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">
        <AdminTopbar />
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
      <AdminToastStack />
    </div>
  );
}