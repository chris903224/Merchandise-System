// src/main.tsx
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './store';
import { ToastProvider } from './toast';
import { ensureSeeded } from './data/seed';
import { applyTheme, getStoredTheme } from './theme';
import ScrollToTop from './components/ScrollToTop';
import './styles/index.css';
import { restoreAdminAppearance } from './lib/adminTheme';
import { supabase } from './lib/supabaseClient';

restoreAdminAppearance();

function Root() {
  useEffect(() => {
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('overflow', 'auto', 'important');
    document.body.style.setProperty('height', 'auto', 'important');
    
    const root = document.getElementById('root');
    if (root) {
      root.style.setProperty('overflow', 'visible', 'important');
      root.style.setProperty('height', 'auto', 'important');
    }
  }, []);

  return <App />;
}

async function bootstrap(): Promise<void> {
  await ensureSeeded();
  applyTheme(getStoredTheme());

  const pathname = window.location.pathname;

  // 🚨 HARANG #1: Org Session Clear (Idinagdag ang /admin/otp sa exception)
  if (!pathname.startsWith('/org') && 
      pathname !== '/admin/login' && 
      pathname !== '/admin/otp') {
    localStorage.removeItem('sjcm_org_session');
    localStorage.removeItem('sjc-org-session');
  }

  // 🚨 HARANG #2: Admin Access Check
  const isAdminRoute = pathname.startsWith('/admin') && 
                       pathname !== '/admin/login' && 
                       pathname !== '/admin/otp';

  if (isAdminRoute) {
    // 🚨 CHECK #1: Kung may localStorage session, payagan agad
    const adminSession = localStorage.getItem('sjcm_admin_auth');
    
    if (adminSession) {
      console.log('[Main] Admin session found in localStorage. Allowing access.');
    } else {
      // 🚨 CHECK #2: Kung wala, tignan ang JWT claim OR RPC fallback
      const { data: { session } } = await supabase.auth.getSession();
      
      let isAuthorized = session?.user.app_metadata?.is_system_admin === true;
      
      if (!isAuthorized && session?.user?.email) {
        const { data } = await supabase.rpc('verify_admin_email', { p_email: session.user.email });
        isAuthorized = data === true;
      }

      if (!isAuthorized) {
        console.warn('[Main] ⚠️ Unauthorized admin access attempt. Redirecting to login.');
        window.location.replace('/admin/login');
        return;
      }
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ScrollToTop />
        <ToastProvider>
          <AppProvider>
            <Root />
          </AppProvider>
        </ToastProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}

void bootstrap();