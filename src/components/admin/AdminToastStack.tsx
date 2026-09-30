// src/components/admin/AdminToastStack.tsx

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

let externalPush: ((message: string, type: ToastType, duration: number) => void) | null = null;

/** ✅ Programmatic API — pwede mong i-call kahit saan: adminToast.success('Saved!') */
export const adminToast = {
  success: (msg: string, duration = 2800) => externalPush?.(msg, 'success', duration),
  error: (msg: string, duration = 3200) => externalPush?.(msg, 'error', duration),
  info: (msg: string, duration = 2400) => externalPush?.(msg, 'info', duration),
  warning: (msg: string, duration = 3000) => externalPush?.(msg, 'warning', duration),
};

export default function AdminToastStack() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    externalPush = (message, type, duration) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };
    return () => {
      externalPush = null;
    };
  }, []);

  return (
    <div className="admin-toast-stack" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div key={t.id} className={`admin-toast admin-toast--${t.type}`}>
            <Icon className="admin-toast__icon" aria-hidden="true" />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}