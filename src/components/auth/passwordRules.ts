// src/components/auth/passwordRules.ts

export interface PasswordCheck {
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordCheck[] = [
  {
    label: 'At least 8 characters',
    test: (v) => v.length >= 8,
  },
  {
    label: 'First letter is uppercase',
    test: (v) => /^[A-Z]/.test(v),
  },
  {
    label: 'Contains a lowercase letter',
    test: (v) => /[a-z]/.test(v),
  },
  {
    label: 'Contains a number',
    test: (v) => /[0-9]/.test(v),
  },
  {
    label: 'Contains a special character (!@#$%^&* etc.)',
    test: (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v),
  },
];

export function isStrongPassword(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}