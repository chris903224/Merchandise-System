// src/components/auth/PasswordStrength.tsx

import { Check, X } from 'lucide-react';

/* ============================================
   ✅ PASSWORD RULES
============================================ */
export const PASSWORD_RULES = [
  {
    key: 'minLength',
    label: '8+ characters',
    test: (v: string) => v.length >= 8,
  },
  {
    key: 'hasUppercase',
    label: '1 uppercase (A-Z)',
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    key: 'hasLowercase',
    label: '1 lowercase (a-z)',
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    key: 'hasNumber',
    label: '1 number (0-9)',
    test: (v: string) => /\d/.test(v),
  },
  {
    key: 'hasSpecial',
    label: '1 special (@#$%^&*!?._-)',
    test: (v: string) => /[@#$%^&*!?._-]/.test(v),
  },
] as const;

export function isStrongPassword(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

/* ============================================
   ✅ PASSWORD STRENGTH — FLOATING POPOVER
   ✅ Naka-absolute — hindi nag-a-adjust ng layout
============================================ */

interface PasswordStrengthProps {
  value: string;
  visible?: boolean;
}

export default function PasswordStrength({
  value,
  visible = true,
}: PasswordStrengthProps) {
  if (!visible || !value) return null;

  const allPassed = isStrongPassword(value);

  return (
    <div
      className={`password-popover ${allPassed ? 'is-all-passed' : ''}`}
      role="tooltip"
      aria-label="Password requirements"
    >
      <div className="password-popover__header">
        <span className="password-popover__title">
          {allPassed ? '✓ Strong password' : 'Password requirements'}
        </span>
      </div>

      <ul className="password-popover__list">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(value);
          return (
            <li
              key={rule.key}
              className={`password-popover__rule ${
                passed ? 'is-passed' : 'is-pending'
              }`}
            >
              {passed ? (
                <Check className="react-icon" aria-hidden="true" />
              ) : (
                <X className="react-icon" aria-hidden="true" />
              )}
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}