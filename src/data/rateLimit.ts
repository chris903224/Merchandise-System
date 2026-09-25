// src/data/rateLimit.ts

/**
 * Simple client-side rate limiting for login attempts.
 * Tracks failed attempts per email + IP in localStorage.
 *
 * NOTE: Client-side rate limiting is NOT a substitute for
 * server-side rate limiting (which Supabase provides via
 * its built-in auth rate limits). This adds an extra UX layer.
 */

const STORAGE_KEY = 'sjcm:rate-limit:login';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // attempts tracked within 15 min window

export interface AttemptRecord {
  email: string;
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

interface RateLimitStore {
  [email: string]: AttemptRecord;
}

// ============================================
// HELPERS
// ============================================

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

// ============================================
// PUBLIC API
// ============================================

export interface RateLimitStatus {
  allowed: boolean;
  attemptsRemaining: number;
  lockedUntil: number | null;
  secondsUntilUnlock: number;
}

/**
 * Check if the given email is allowed to attempt login.
 */
export function checkRateLimit(email: string): RateLimitStatus {
  const normalizedEmail = email.trim().toLowerCase();
  const store = readStore();
  const record = store[normalizedEmail];

  // No record yet → allowed
  if (!record) {
    return {
      allowed: true,
      attemptsRemaining: MAX_ATTEMPTS,
      lockedUntil: null,
      secondsUntilUnlock: 0,
    };
  }

  const now = Date.now();

  // Currently locked out?
  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      allowed: false,
      attemptsRemaining: 0,
      lockedUntil: record.lockedUntil,
      secondsUntilUnlock: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  // Lock expired → reset and allow
  if (record.lockedUntil && record.lockedUntil <= now) {
    delete store[normalizedEmail];
    writeStore(store);
    return {
      allowed: true,
      attemptsRemaining: MAX_ATTEMPTS,
      lockedUntil: null,
      secondsUntilUnlock: 0,
    };
  }

  // Outside attempt window → reset
  const windowExpired = now - record.firstAttemptAt > ATTEMPT_WINDOW_MS;
  if (windowExpired) {
    delete store[normalizedEmail];
    writeStore(store);
    return {
      allowed: true,
      attemptsRemaining: MAX_ATTEMPTS,
      lockedUntil: null,
      secondsUntilUnlock: 0,
    };
  }

  // Within window and attempts remaining
  return {
    allowed: record.attempts < MAX_ATTEMPTS,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - record.attempts),
    lockedUntil: null,
    secondsUntilUnlock: 0,
  };
}

/**
 * Record a failed login attempt.
 * After MAX_ATTEMPTS, lock the account for LOCKOUT_DURATION_MS.
 */
export function recordFailedAttempt(email: string): RateLimitStatus {
  const normalizedEmail = email.trim().toLowerCase();
  const store = readStore();
  const now = Date.now();

  const existing = store[normalizedEmail];
  const windowExpired =
    existing && now - existing.firstAttemptAt > ATTEMPT_WINDOW_MS;

  const record: AttemptRecord = windowExpired || !existing
    ? {
        email: normalizedEmail,
        attempts: 1,
        firstAttemptAt: now,
        lockedUntil: null,
      }
    : {
        ...existing,
        attempts: existing.attempts + 1,
      };

  // Lock if max attempts reached
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  store[normalizedEmail] = record;
  writeStore(store);

  return checkRateLimit(normalizedEmail);
}

/**
 * Clear the rate limit record after successful login.
 */
export function clearRateLimit(email: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  const store = readStore();
  delete store[normalizedEmail];
  writeStore(store);
}

/**
 * Format seconds into MM:SS for display.
 */
export function formatLockoutTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  ATTEMPT_WINDOW_MS,
};