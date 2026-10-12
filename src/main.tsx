// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './store';
import { ToastProvider } from './toast';
import { ensureSeeded } from './data/seed';
import { applyTheme, getStoredTheme } from './theme';
import ScrollToTop from './components/ScrollToTop';   // ✅ IDAGDAG
import './styles/index.css';

async function bootstrap(): Promise<void> {
  await ensureSeeded();

  applyTheme(getStoredTheme());

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ScrollToTop />   {/* ✅ IDAGDAG ITO — sa loob ng BrowserRouter */}
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