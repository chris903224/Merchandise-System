// src/main.tsx
import { StrictMode, useEffect } from 'react'; // ✅ Idinagdag ang useEffect
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './store';
import { ToastProvider } from './toast';
import { ensureSeeded } from './data/seed';
import { applyTheme, getStoredTheme } from './theme';
import ScrollToTop from './components/ScrollToTop';
import { STORAGE_KEYS, readStorage } from './data/storage';
import type { SessionUser } from './types';
import './styles/index.css';

// ✅ DAGDAG: Root component para i-unlock ang scroll ng buong app
function Root() {
  useEffect(() => {
    // I-force ang scroll sa html at body
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('overflow', 'auto', 'important');
    document.body.style.setProperty('height', 'auto', 'important');
    
    // I-unlock ang React root container
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

  // ✅ ORGANIZATION URL VALIDATION GUARD
  const isOrgRoute = window.location.pathname.startsWith('/org') && window.location.pathname !== '/org/login';

  if (isOrgRoute) {
    const session = readStorage<SessionUser | null>(STORAGE_KEYS.session, null);
    if (!session || session.role !== 'Organization') {
      window.location.replace('/org/login');
      return;
    }
  }

  // ✅ ORGANIZATION LOGIN GUARD
  const isOrgLoginRoute = window.location.pathname === '/org/login';
  if (isOrgLoginRoute) {
    const session = readStorage<SessionUser | null>(STORAGE_KEYS.session, null);
    if (session && session.role === 'Organization') {
      window.location.replace('/org/dashboard');
      return;
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ScrollToTop />
        <ToastProvider>
          <AppProvider>
            {/* ✅ Pinalitan ang <App /> ng <Root /> */}
            <Root />
          </AppProvider>
        </ToastProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}

void bootstrap();