// src/pages/admin/AdminLayout.tsx

import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AdminSidebar, AdminTopbar, AdminToastStack } from '../../components/admin';
import { useAdminStore } from '../../store/adminStore';
import { readAdminSession } from '../../services/admin';
import '../../styles/admin/admin.css';
import '../../styles/admin/palettes/base.css';
import '../../styles/admin/palettes/midnight.css';
import '../../styles/admin/palettes/sand.css';
import '../../styles/admin/palettes/ocean.css';
import '../../styles/admin/clay-theme.css';
import '../../styles/admin/glass-theme.css';

// 🚨 I-IMPORT NATIN ITO PARA MAGAMIT
import { applyAdminTheme, getAdminTheme } from '../../lib/adminTheme';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, setSession } = useAdminStore();

  // 🚨 THEME APPLICATION: Ito ang magpapa-andar sa mga design/theme
  useEffect(() => {
    const currentTheme = getAdminTheme();
    applyAdminTheme(currentTheme);
  }, []);

  useEffect(() => {
    const stored = readAdminSession();

    console.log('[AdminLayout] Session check:', {
      hasStoreSession: !!session,
      hasStoredSession: !!stored,
      currentPath: location.pathname,
    });

    if (!session && !stored) {
      console.log('[AdminLayout] ❌ No session — redirecting to /admin/login');
      navigate('/admin/login', { replace: true });
      return;
    }

    if (stored && !session) {
      console.log('[AdminLayout] 🔄 Hydrating session from storage');
      setSession(stored);
    }

    console.log('[AdminLayout] ✅ Access granted');
  }, [navigate, session, setSession, location.pathname]);

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