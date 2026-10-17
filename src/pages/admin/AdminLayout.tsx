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
import { applyAdminTheme, getAdminTheme } from '../../lib/adminTheme';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { session, setSession } = useAdminStore();

  useEffect(() => {
    // ✅ Session guard — redirect sa /admin/login kung walang session
    const stored = readAdminSession();

    if (!stored && !session) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // ✅ Hydrate store mula localStorage kung wala pa sa memory
    if (stored && !session) {
      setSession(stored);
    }
  }, [navigate, session, setSession]);
  
  // Restore the saved admin appearance (default / clay / glass)
  useEffect(() => {
    applyAdminTheme(getAdminTheme(), false);
  }, []);

  // Hindi pa naka-load yung session — render nothing
  if (!session && !readAdminSession()) {
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