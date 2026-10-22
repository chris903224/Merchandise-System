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

  useEffect(() => {
    const savedTheme = localStorage.getItem('sjc-theme') ?? 'midnight';
    const savedUi = localStorage.getItem('sjc-ui') ?? 'glass';
    document.documentElement.dataset.theme = savedTheme;
    document.documentElement.dataset.ui = savedUi;
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!session || session.role !== 'Organization') {
      navigate('/login', { replace: true });
    }
  }, [session, isLoading, navigate]);

  if (isLoading || !session || session.role !== 'Organization') return null;

  return (
    <div className="org-shell">
      {/* ✅ Sidebar nasa loob ng grid */}
      <OrgSidebar session={session} />
      
      {/* ✅ Main content kasama ang Topbar */}
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