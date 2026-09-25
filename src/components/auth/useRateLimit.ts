// src/components/auth/useRateLimit.ts

import { useEffect, useState } from 'react';
import {
  clearRateLimit,
  checkRateLimit,
  formatLockoutTime,
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

  // Countdown tick
  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setSecondsLeft(0);
        setAttemptsRemaining(RATE_LIMIT_CONFIG.MAX_ATTEMPTS);
        clearRateLimit(identifier);
        return;
      }
      setSecondsLeft(remaining);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [lockedUntil, identifier]);

  // Sync state kapag nagbago ang identifier
  useEffect(() => {
    if (!identifier.trim()) {
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
    }
  }, [identifier]);

  // Helper functions para sa LoginPage
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