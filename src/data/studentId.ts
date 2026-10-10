// src/data/studentId.ts

/* ============================================================
   ✅ STUDENT ID FORMAT HELPERS
   Format: XX-XXXX-XXXXXX
   - Part 1: 2-digit campus code
   - Part 2: 4-digit school year
   - Part 3: 6-digit student number
   Example: 00-0000-000000 (generic placeholder)
============================================================ */

/* ✅ Flexible pattern — accepts any 2-4-6 digit combo */
export const STUDENT_ID_PATTERN = /^\d{2}-\d{4}-\d{6}$/;

/* ✅ Generic placeholder — hindi totoong ID */
export const STUDENT_ID_EXAMPLE = '00-0000-000000';

/* ✅ Total digits without dashes */
export const STUDENT_ID_LENGTH = 12;

/* ✅ Max input length with dashes */
export const STUDENT_ID_MAX_LENGTH = 14;

/**
 * ✅ Auto-format student ID input as user types
 * Inserts dashes automatically: XX-XXXX-XXXXXX
 */
export function formatStudentId(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, STUDENT_ID_LENGTH);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
}

/**
 * ✅ Validate student ID format
 */
export function isValidStudentId(value: string): boolean {
  if (!value) return false;
  const normalized = value.trim();
  return STUDENT_ID_PATTERN.test(normalized);
}

/**
 * ✅ Get specific error message based on what's wrong
 */
export function getStudentIdErrorMessage(value: string): string | null {
  if (!value || value.trim() === '') {
    return 'Student ID is required.';
  }

  const digits = value.replace(/\D/g, '');

  if (digits.length < STUDENT_ID_LENGTH) {
    const missing = STUDENT_ID_LENGTH - digits.length;
    return `Missing ${missing} digit${missing === 1 ? '' : 's'}. Format: ${STUDENT_ID_EXAMPLE}`;
  }

  if (digits.length > STUDENT_ID_LENGTH) {
    return `Too many digits. Format: ${STUDENT_ID_EXAMPLE}`;
  }

  if (!STUDENT_ID_PATTERN.test(value.trim())) {
    return `Invalid format. Use: ${STUDENT_ID_EXAMPLE}`;
  }

  return null;
}