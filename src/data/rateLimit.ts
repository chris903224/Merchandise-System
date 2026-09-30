// src/data/rateLimit.ts

const STORAGE_KEY = 'sjcm:rate-limit:login';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // ✅ 5 minutes (not 15)
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;   // ✅ 5 minutes

export interface AttemptRecord {
  email: string;
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

interface RateLimitStore {
  [email: string]: AttemptRecord;
}

/* ✅ NEW — helper to expose currently-locked emails (for UI on mount) */
export function getActiveLock(): { email: string; lockedUntil: number } | null {
  const store = readStore();
  const now = Date.now();

  let best: { email: string; lockedUntil: number } | null = null;
  Object.values(store).forEach((r) => {
    if (r.lockedUntil && r.lockedUntil > now) {
      if (!best || r.lockedUntil > best.lockedUntil) {
        best = { email: r.email, lockedUntil: r.lockedUntil };
      }
    }
  });

  return best;
}

function readStore(): RateLimitStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RateLimitStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: RateLimitStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('[RateLimit] Failed to write store:', error);
  }
}

export interface RateLimitStatus {
  allowed: boolean;
  attemptsRemaining: number;
  lockedUntil: number | null;
  secondsUntilUnlock: number;
}

export function checkRateLimit(email: string): RateLimitStatus {
  const normalizedEmail = email.trim().toLowerCase();
  const store = readStore();
  const record = store[normalizedEmail];

  if (!record) {
    return { allowed: true, attemptsRemaining: MAX_ATTEMPTS, lockedUntil: null, secondsUntilUnlock: 0 };
  }

  const now = Date.now();

  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      allowed: false,
      attemptsRemaining: 0,
      lockedUntil: record.lockedUntil,
      secondsUntilUnlock: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  if (record.lockedUntil && record.lockedUntil <= now) {
    delete store[normalizedEmail];
    writeStore(store);
    return { allowed: true, attemptsRemaining: MAX_ATTEMPTS, lockedUntil: null, secondsUntilUnlock: 0 };
  }

  const windowExpired = now - record.firstAttemptAt > ATTEMPT_WINDOW_MS;
  if (windowExpired) {
    delete store[normalizedEmail];
    writeStore(store);
    return { allowed: true, attemptsRemaining: MAX_ATTEMPTS, lockedUntil: null, secondsUntilUnlock: 0 };
  }

  return {
    allowed: record.attempts < MAX_ATTEMPTS,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - record.attempts),
    lockedUntil: null,
    secondsUntilUnlock: 0,
  };
}

export function recordFailedAttempt(email: string): RateLimitStatus {
  const normalizedEmail = email.trim().toLowerCase();
  const store = readStore();
  const now = Date.now();

  const existing = store[normalizedEmail];
  const windowExpired = existing && now - existing.firstAttemptAt > ATTEMPT_WINDOW_MS;

  const record: AttemptRecord = windowExpired || !existing
    ? { email: normalizedEmail, attempts: 1, firstAttemptAt: now, lockedUntil: null }
    : { ...existing, attempts: existing.attempts + 1 };

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  store[normalizedEmail] = record;
  writeStore(store);

  return checkRateLimit(normalizedEmail);
}

export function clearRateLimit(email: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  const store = readStore();
  delete store[normalizedEmail];
  writeStore(store);
}

export function formatLockoutTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  ATTEMPT_WINDOW_MS,
};