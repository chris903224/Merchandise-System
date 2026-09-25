// src/components/auth/useOtpTimer.ts

import { useEffect, useState } from 'react';

export const OTP_EXPIRY_SECONDS = 300;

export function useOtpTimer(active: boolean, onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);

  useEffect(() => {
    if (!active) return;
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, timeLeft, onExpire]);

  const reset = () => setTimeLeft(OTP_EXPIRY_SECONDS);

  const format = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return { timeLeft, reset, format };
}