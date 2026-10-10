// src/data/validation.ts

/**
 * Shared form validation rules for the SJCM app.
 */

/* ============================================
   CONSTANTS
============================================ */

export const PHINMAED_DOMAIN = '@phinmaed.com';

/* ✅ FLEXIBLE student ID pattern: XX-XXXX-XXXXXX
   - Part 1: 2-digit campus code
   - Part 2: 4-digit school year
   - Part 3: 6-digit student number
*/
export const STUDENT_ID_PATTERN = /^\d{2}-\d{4}-\d{6}$/;

/* ✅ GENERIC placeholder — hindi totoong ID */
export const STUDENT_ID_EXAMPLE = '00-0000-000000';
export const STUDENT_ID_LENGTH = 12;
export const STUDENT_ID_MAX_LENGTH = 14;

/* ============================================
   EMAIL
============================================ */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isPhinmaedEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(PHINMAED_DOMAIN);
}

/* ============================================
   ✅ STUDENT ID
============================================ */

export function isValidStudentId(id: string): boolean {
  if (!id) return false;
  const normalized = id.trim();
  return STUDENT_ID_PATTERN.test(normalized);
}

export function formatStudentId(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, STUDENT_ID_LENGTH);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
}

export function getStudentIdErrorMessage(value: string): string | null {
  if (!value || value.trim() === '') {
    return 'Student ID is required.';
  }

  const digits = value.replace(/\D/g, '');

  if (digits.length < STUDENT_ID_LENGTH) {
    const missing = STUDENT_ID_LENGTH - digits.length;
    return `Missing ${missing} digit${missing === 1 ? '' : 's'}.`;
  }

  if (digits.length > STUDENT_ID_LENGTH) {
    return `Too many digits.`;
  }

  if (!STUDENT_ID_PATTERN.test(value.trim())) {
    return `Invalid format. Use: XX-XXXX-XXXXXX`;
  }

  return null;
}

/* ============================================
   ✅ PASSWORD
============================================ */

export interface PasswordCheck {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function checkPassword(password: string): PasswordCheck {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@#$%^&*!?._-]/.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  const check = checkPassword(password);
  return Object.values(check).every(Boolean);
}

export function getPasswordErrorMessage(password: string): string | null {
  if (!password) return 'Password is required.';

  const check = checkPassword(password);
  const missing: string[] = [];

  if (!check.minLength) missing.push('at least 8 characters');
  if (!check.hasUppercase) missing.push('1 uppercase letter');
  if (!check.hasLowercase) missing.push('1 lowercase letter');
  if (!check.hasNumber) missing.push('1 number');
  if (!check.hasSpecial) missing.push('1 special character (@#$%^&*!?._-)');

  if (missing.length > 0) {
    return `Password must include: ${missing.join(', ')}.`;
  }

  return null;
}

/* ✅ Password rules for live feedback UI */
export const PASSWORD_RULES = [
  {
    label: 'At least 8 characters',
    test: (v: string) => v.length >= 8,
  },
  {
    label: 'Contains an uppercase letter',
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    label: 'Contains a lowercase letter',
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    label: 'Contains a number',
    test: (v: string) => /\d/.test(v),
  },
  {
    label: 'Contains a special character (@#$%^&*!?._-)',
    test: (v: string) => /[@#$%^&*!?._-]/.test(v),
  },
];