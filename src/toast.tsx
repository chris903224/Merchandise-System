import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

type ToastType = 'info' | 'success' | 'warning' | 'danger';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type ToastContextValue = (message: string, type?: ToastType) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  danger: XCircle,
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setToasts((previous) => [...previous, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div id="app-toast-container" className="toast-stack" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type];
          return (
            <div key={toast.id} className={`toast toast--${toast.type}`} role={toast.type === 'danger' ? 'alert' : 'status'}>
              <Icon className="react-icon" aria-hidden="true" />
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
