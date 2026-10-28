// src/pages/organization/OrganizationLayout.tsx

import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../../store';
import { useUIStore } from '../../store/uiStore';
import OrgSidebar from '../../components/organization/Sidebar';
import OrgTopbar from '../../components/organization/Topbar';
import ThemeModal from '../../components/organization/ThemeModal';
import LanguageModal from '../../components/organization/LanguageModal';
import '../../styles/organization/index.css';

export default function OrganizationLayout() {
  const { session, isLoading } = useApp();
  const navigate = useNavigate();
  const { themeOpen, langOpen } = useUIStore();

  // 1. Theme & UI Initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('sjc-theme') ?? 'midnight';
    const savedMode = localStorage.getItem('sjc-mode') ?? 'dark';
    const savedUi = localStorage.getItem('sjc-ui') ?? 'glass';

    document.documentElement.dataset.theme = savedTheme;
    document.documentElement.dataset.mode = savedMode;
    document.documentElement.dataset.ui = savedUi;
  }, []);

  // 2. Auth Guard
  useEffect(() => {
    if (isLoading) return;
    
    if (!session || session.role !== 'Organization') {
      localStorage.removeItem('sjc-session');
      localStorage.removeItem('sjc-org-session');
      navigate('/login', { replace: true });
    }
  }, [session, isLoading, navigate]);

  if (isLoading || !session || session.role !== 'Organization') return null;

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