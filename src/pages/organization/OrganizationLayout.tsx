// src/pages/organization/OrganizationLayout.tsx

import { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../../store';
import { useUIStore } from '../../store/uiStore';
import OrgSidebar from '../../components/organization/Sidebar';
import OrgTopbar from '../../components/organization/Topbar';
import ThemeModal from '../../components/organization/ThemeModal';
import LanguageModal from '../../components/organization/LanguageModal';

export default function OrganizationLayout() {
  const { session, isLoading } = useApp();
  const navigate = useNavigate();
  const { themeOpen, langOpen } = useUIStore();
  const cssInjected = useRef(false);

  // 🚨 DYNAMIC CSS INJECTION (Isang beses lang i-inject)
  useEffect(() => {
    if (cssInjected.current) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/organization/index.css';
    link.id = 'org-layout-css';
    document.head.appendChild(link);
    cssInjected.current = true;

    const savedTheme = localStorage.getItem('sjc-theme') ?? 'midnight';
    const savedMode = localStorage.getItem('sjc-mode') ?? 'dark';
    const savedUi = localStorage.getItem('sjc-ui') ?? 'glass';

    document.documentElement.dataset.theme = savedTheme;
    document.documentElement.dataset.mode = savedMode;
    document.documentElement.dataset.ui = savedUi;

    document.body.classList.add('org-body-bg');

    return () => {
      const existingLink = document.getElementById('org-layout-css');
      if (existingLink) {
        existingLink.remove();
      }
      document.body.classList.remove('org-body-bg');
      cssInjected.current = false;
    };
  }, []);

  // 🚨 AUTH GUARD (Hintayin ma-load ang session bago mag-redirect)
  useEffect(() => {
    // Kung naglo-load pa, wag muna gumawa ng desisyon
    if (isLoading) return;

    // 🚨 Check kung may local org session (backup)
    const savedOrg = localStorage.getItem('sjcm_org_session') || localStorage.getItem('sjc-org-session');
    const savedSession = localStorage.getItem('sjc-session');
    
    let localOrgUser = null;
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed?.role === 'Organization') localOrgUser = parsed;
      } catch {}
    }

    // Kung may session sa store, okay na
    if (session && session.role === 'Organization') {
      return;
    }

    // Kung may naka-save na backup, huwag mag-redirect (hintayin lang)
    if (savedOrg && localOrgUser) {
      return;
    }

    // Wala talaga, throw out
    localStorage.removeItem('sjc-session');
    localStorage.removeItem('sjc-org-session');
    localStorage.removeItem('sjcm_org_session');
    navigate('/org/login', { replace: true });
  }, [session, isLoading, navigate]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050a16', color: '#fff' }}>
        Loading...
      </div>
    );
  }

  if (!session || session.role !== 'Organization') {
    return null; // Ipapasa na lang sa useEffect ang redirect
  }

  return (
    <div className="org-shell org-compact">
      <OrgSidebar session={session} />
      
      <main className="org-main">
        <OrgTopbar session={session} />
        <div className="org-content">
          <Outlet />
        </div>
      </main>

      {themeOpen && <ThemeModal />}
      {langOpen && <LanguageModal />}
    </div>
  );
}