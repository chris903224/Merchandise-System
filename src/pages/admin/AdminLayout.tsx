// src/pages/admin/AdminLayout.tsx

import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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

import { restoreAdminAppearance } from '../../lib/adminTheme';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { session, setSession } = useAdminStore();

  // 🚨 Ibalik ang saved theme
  useEffect(() => {
    restoreAdminAppearance();
  }, []);

  useEffect(() => {
    // 🚨 CHECK #1: Basahin ang session mula sa localStorage
    const stored = readAdminSession();

    // 🚨 Kung may naka-save, i-hydrate ang store
    if (stored && !session) {
      console.log('[AdminLayout] 🔄 Hydrating session from storage');
      setSession(stored);
      return;
    }

    // 🚨 Kung wala talaga (kahit sa localStorage), doon lang tayo mag-redirect sa login
    if (!session && !stored) {
      console.log('[AdminLayout] ❌ No session found — redirecting to /admin/login');
      navigate('/admin/login', { replace: true });
    }
  }, [navigate, session, setSession]);

  // 🚨 BASAHIN ULIT: Para sure na naka-render lang tayo kapag may session
  const currentSession = session || readAdminSession();

  // Kung wala pa ring session, wag i-render (para hindi mag-flicker)
  if (!currentSession) {
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