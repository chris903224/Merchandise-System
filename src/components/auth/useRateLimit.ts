// src/components/auth/useRateLimit.ts

import { useEffect, useState } from 'react';
import {
  clearRateLimit,
  checkRateLimit,
  formatLockoutTime,
  getActiveLock,
  RATE_LIMIT_CONFIG,
  recordFailedAttempt,
} from '../../data/rateLimit';

export function useRateLimit(identifier: string) {
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(
    RATE_LIMIT_CONFIG.MAX_ATTEMPTS
  );

  const isLocked = lockedUntil !== null && secondsLeft > 0;

  /* ============================================
     ✅ FIX #1 — Sa MOUNT, i-restore yung active lock
     kahit walang laman yung email input
     ============================================ */
  useEffect(() => {
    const active = getActiveLock();
    if (active) {
      setLockedUntil(active.lockedUntil);
      setSecondsLeft(Math.ceil((active.lockedUntil - Date.now()) / 1000));
      setAttemptsRemaining(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================
     Countdown tick
     ============================================ */
  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setSecondsLeft(0);
        setAttemptsRemaining(RATE_LIMIT_CONFIG.MAX_ATTEMPTS);
        if (identifier) clearRateLimit(identifier);
        return;
      }
      setSecondsLeft(remaining);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [lockedUntil, identifier]);

  /* ============================================
     ✅ FIX #2 — Sync state kapag nagbago ang identifier
     HUWAG i-reset kung may active lock pa
     ============================================ */
  useEffect(() => {
    if (!identifier.trim()) {
      // ✅ Check muna kung may active lock bago mag-reset
      const active = getActiveLock();
      if (active) {
        setLockedUntil(active.lockedUntil);
        setSecondsLeft(Math.ceil((active.lockedUntil - Date.now()) / 1000));
        setAttemptsRemaining(0);
        return;
      }
      setAttemptsRemaining(RATE_LIMIT_CONFIG.MAX_ATTEMPTS);
      setLockedUntil(null);
      setSecondsLeft(0);
      return;
    }

    const status = checkRateLimit(identifier);
    setAttemptsRemaining(status.attemptsRemaining);
    if (!status.allowed && status.lockedUntil) {
      setLockedUntil(status.lockedUntil);
      setSecondsLeft(status.secondsUntilUnlock);
    } else if (status.allowed) {
      // ✅ Clear lock state kung allowed na (lock expired)
      setLockedUntil(null);
      setSecondsLeft(0);
    }
  }, [identifier]);

  const guard = () => checkRateLimit(identifier);

  const recordFailure = () => {
    const status = recordFailedAttempt(identifier);
    setAttemptsRemaining(status.attemptsRemaining);
    if (!status.allowed && status.lockedUntil) {
      setLockedUntil(status.lockedUntil);
      setSecondsLeft(status.secondsUntilUnlock);
    }
    return status;
  };

  const clear = () => {
    clearRateLimit(identifier);
    setAttemptsRemaining(RATE_LIMIT_CONFIG.MAX_ATTEMPTS);
    setLockedUntil(null);
    setSecondsLeft(0);
  };

  return {
    isLocked,
    lockedUntil,
    secondsLeft,
    attemptsRemaining,
    formatLockoutTime,
    RATE_LIMIT_CONFIG,
    guard,
    recordFailure,
    clear,
  };
}