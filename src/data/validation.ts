// src/data/validation.ts

/**
 * Shared form validation rules for the SJCM app.
 */

// ============================================
// CONSTANTS
// ============================================

export const PHINMAED_DOMAIN = '@phinmaed.com';
export const STUDENT_ID_PATTERN = /^06-2526-\d{6}$/;
export const STUDENT_ID_EXAMPLE = '06-2526-004945';

// ============================================
// EMAIL
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isPhinmaedEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(PHINMAED_DOMAIN);
}

// ============================================
// STUDENT ID
// ============================================

export function isValidStudentId(id: string): boolean {
  return STUDENT_ID_PATTERN.test(id.trim());
}

// ============================================
// PASSWORD
// ============================================

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
  if (!isStrongPassword(password)) {
    return 'Password must be at least 8 characters, with uppercase, lowercase, number, and special character.';
  }
  return null;
}