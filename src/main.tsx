import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import App from './App';
import { AppProvider } from './store';
import { ToastProvider } from './toast';
import { ensureSeeded } from './data/seed';
import { applyTheme, getStoredTheme } from './theme';


/**
 * Seeding is async because passwords are hashed with the Web Crypto API, so the
 * app mounts only once localStorage holds a consistent data set.
 */
async function bootstrap(): Promise<void> {
  await ensureSeeded();

  applyTheme(getStoredTheme());

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
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