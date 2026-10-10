// src/components/auth/useRateLimit.ts

import { useCallback, useEffect, useState } from 'react';

/* ============================================
   ✅ GLOBAL SHARED STATE
   Naka-share sa LAHAT ng instances ng useRateLimit
============================================ */
type LockState = {
  lockUntil: number | null;
  attempts: number;
  identifier: string;
};

const STORAGE_KEY = 'sjcm_rate_limit_state';

function readGlobalLock(): LockState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lockUntil: null, attempts: 0, identifier: '' };
    const parsed = JSON.parse(raw) as LockState;
    // linisin kung expired na
    if (parsed.lockUntil && Date.now() >= parsed.lockUntil) {
      parsed.lockUntil = null;
      parsed.attempts = 0;
    }
    return parsed;
  } catch {
    return { lockUntil: null, attempts: 0, identifier: '' };
  }
}

function writeGlobalLock(state: LockState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/* ✅ Module-level state — shared sa lahat ng hook instances */
let globalLockState: LockState = readGlobalLock();
const listeners = new Set<(state: LockState) => void>();

function setGlobalLockState(next: LockState) {
  globalLockState = next;
  writeGlobalLock(next);
  listeners.forEach((fn) => fn(next));
}

/* ============================================
   ✅ RATE LIMIT CONFIG
============================================ */
export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_SECONDS: 300, // 5 minutes
};

/* ============================================
   ✅ HOOK
============================================ */
export function useRateLimit(_key?: string) {
  const [state, setState] = useState<LockState>(() => readGlobalLock());
  const [tick, setTick] = useState(0);

  /* ✅ Subscribe sa global changes */
  useEffect(() => {
    const listener = (next: LockState) => setState(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  /* ✅ Periodic tick para mag-update ang countdown + auto-unlock */
  useEffect(() => {
    const id = window.setInterval(() => {
      const current = readGlobalLock();
      if (
        current.lockUntil !== globalLockState.lockUntil ||
        current.attempts !== globalLockState.attempts
      ) {
        setGlobalLockState(current);
      }
      setTick((n) => n + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  void tick; // for re-render
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const isLocked =
    state.lockUntil !== null && Date.now() < state.lockUntil;

  const secondsLeft = isLocked
    ? Math.max(0, Math.ceil((state.lockUntil! - Date.now()) / 1000))
    : 0;

  const attemptsRemaining = Math.max(
    0,
    RATE_LIMIT_CONFIG.MAX_ATTEMPTS - state.attempts
  );

  const formatLockoutTime = useCallback((totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  const guard = useCallback(() => {
    const current = readGlobalLock();
    if (current.lockUntil && Date.now() < current.lockUntil) {
      const secs = Math.ceil((current.lockUntil - Date.now()) / 1000);
      return { allowed: false, secondsUntilUnlock: secs };
    }
    return { allowed: true, secondsUntilUnlock: 0 };
  }, []);

  const recordFailure = useCallback(() => {
    const current = readGlobalLock();
    const nextAttempts = current.attempts + 1;

    if (nextAttempts >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
      const next: LockState = {
        lockUntil: Date.now() + RATE_LIMIT_CONFIG.LOCKOUT_SECONDS * 1000,
        attempts: 0, // reset attempts after lockout
        identifier: current.identifier,
      };
      setGlobalLockState(next);
      return {
        allowed: false,
        secondsUntilUnlock: RATE_LIMIT_CONFIG.LOCKOUT_SECONDS,
        attemptsRemaining: 0,
      };
    }

    const next: LockState = {
      lockUntil: null,
      attempts: nextAttempts,
      identifier: current.identifier,
    };
    setGlobalLockState(next);
    return {
      allowed: true,
      secondsUntilUnlock: 0,
      attemptsRemaining: RATE_LIMIT_CONFIG.MAX_ATTEMPTS - nextAttempts,
    };
  }, []);

  const clear = useCallback(() => {
    setGlobalLockState({ lockUntil: null, attempts: 0, identifier: '' });
  }, []);

  return {
    isLocked,
    secondsLeft,
    attemptsRemaining,
    formatLockoutTime,
    RATE_LIMIT_CONFIG,
    guard,
    recordFailure,
    clear,
  };
}