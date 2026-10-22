// src/main.tsx
import { StrictMode } from 'react';
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
            <App />
          </AppProvider>
        </ToastProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}

void bootstrap();