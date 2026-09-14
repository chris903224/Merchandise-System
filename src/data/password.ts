/**
 * Password hashing helpers built on the Web Crypto API.
 *
 * This is a browser-only demo store with no backend, so credentials never leave
 * the device. Hashing still matters: it keeps plaintext passwords out of
 * localStorage, where any script or curious student with DevTools can read them.
 *
 * `crypto.subtle` requires a secure context, which covers https:// and
 * http://localhost (so `npm run dev` and `npm run preview` both work).
 */

const SALT_BYTES = 16;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createPasswordSalt(): string {
  const bytes = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoded = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return bytesToHex(new Uint8Array(digest));
}

/** Length-independent comparison so a mismatch cannot be timed byte by byte. */
function constantTimeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  if (!salt || !expectedHash) return false;
  const actualHash = await hashPassword(password, salt);
  return constantTimeEquals(actualHash, expectedHash);
}
