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
import { supabase } from './lib/supabaseClient'; // 🚨 SIGURADUHING NAKA-IMPORT ITO

restoreAdminAppearance();

const ALLOWED_ADMINS = [
  'ropu.sengco.sjc@phinmaed.com',
  'javi.borlagdan.sjc@phinmaed.com',
  'leda.lutrania.sjc@phinmaed.com',
  'chpe.villanueva.sjc@phinmaed.com',
  'chdi.lomocso.sjc@phinmaed.com'
];

function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_ADMINS.includes(email.toLowerCase().trim());
}

function Root() {
  useEffect(() => {
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.body.style.setProperty('overflow', 'auto', 'important');
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
  const SECRET_ADMIN_URL = '/sjcm-internal-portal-2026';

  const isMagicLink = window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token');
  
  if (isMagicLink) {
    sessionStorage.setItem('sjc_magic_link_auth', 'true');
    console.log('[Main] 🎟️ Magic link detected. Waiting for Supabase...');
    
    await new Promise<void>((resolve) => {
      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        console.log('[Main] Auth Event:', event);
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          authListener.subscription.unsubscribe();
          resolve();
        }
      });

      setTimeout(() => {
        authListener.subscription.unsubscribe();
        resolve();
      }, 3000);
    });
  }

  const isTestAdmin = sessionStorage.getItem('sjc_test_admin') === 'true';
  const isImpersonating = sessionStorage.getItem('sjc_impersonating') === 'true';
  const isOrgRoute = pathname.startsWith('/org');
  const isAdminRoute = pathname.startsWith('/admin') || pathname === SECRET_ADMIN_URL;

  if (!pathname.startsWith('/org') && !pathname.startsWith('/admin') && pathname !== SECRET_ADMIN_URL) {
    localStorage.removeItem('sjcm_org_session');
    localStorage.removeItem('sjc-org-session');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const currentEmail = session?.user?.email?.toLowerCase().trim() ?? null;
  const isSystemAdmin = session?.user?.app_metadata?.is_system_admin === true;
  const isAdminEmail = isAllowedAdminEmail(currentEmail);

  const shouldBypassEmailCheck = isTestAdmin || isImpersonating || isMagicLink || isOrgRoute || isAdminRoute;
  
  if (currentEmail && !currentEmail.endsWith('@phinmaed.com') && !isAdminEmail && !shouldBypassEmailCheck) {
    console.warn('[Main] 🚨 Gmail user detected. Forcing signout.');
    await supabase.auth.signOut();
    localStorage.clear();
    if (isAdminRoute) {
      window.location.replace('/login');
      return;
    }
  }

  if (isAdminRoute) {
    const isPublicAdminRoute = pathname === SECRET_ADMIN_URL || pathname === '/admin/otp';
    
    if (!currentEmail && !isPublicAdminRoute) {
      window.location.replace('/login');
      return;
    }
    
    if (currentEmail && !isPublicAdminRoute) {
      if (!isAdminEmail || !isSystemAdmin) {
        console.warn('[Main] 🚨 Unauthorized admin user blocked:', currentEmail, 'isSystemAdmin:', isSystemAdmin);
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.replace('/login');
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