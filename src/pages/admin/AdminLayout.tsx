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

  useEffect(() => {
    restoreAdminAppearance();
  }, []);

  useEffect(() => {
    const stored = readAdminSession();
    if (stored && !session) {
      setSession(stored);
      return;
    }

    // 🚨 CHECK KUNG NAKA-TEST MODE
    const isTestAdmin = sessionStorage.getItem('sjc_test_admin') === 'true';

    // 🚨 KUNG WALANG SESSION AT WALANG TEST MODE, DOON LANG MAG-REDIRECT
    if (!session && !stored && !isTestAdmin) {
      console.log('[AdminLayout] ❌ No session found — redirecting to secret portal');
      navigate('/sjcm-internal-portal-2026', { replace: true });
    }
  }, [navigate, session, setSession]);

  const currentSession = session || readAdminSession();
  const isTestAdmin = sessionStorage.getItem('sjc_test_admin') === 'true';

  // 🚨 KUNG WALANG SESSION PERO NAKA-TEST MODE, PAYAGAN MAG-RENDER
  if (!currentSession && !isTestAdmin) {
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