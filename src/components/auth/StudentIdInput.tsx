// src/components/auth/StudentIdInput.tsx

import { useState } from 'react';
import { Check, IdCard, X } from 'lucide-react';
import {
  formatStudentId,
  isValidStudentId,
  STUDENT_ID_EXAMPLE,
  STUDENT_ID_LENGTH,
} from '../../data/studentId';

interface StudentIdInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function StudentIdInput({
  value,
  onChange,
  error,
  disabled,
}: StudentIdInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const digits = value.replace(/\D/g, '');
  const progress = digits.length;
  const isValid = isValidStudentId(value);
  const showHint = isFocused || value.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatStudentId(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="auth-field">
      <label htmlFor="register-id">
        Student ID
        <span className="auth-field__required">*</span>
      </label>

      <div className="auth-input-wrap">
        <IdCard className="react-icon" aria-hidden="true" />
        <input
          id="register-id"
          className={`auth-input ${error ? 'has-error' : ''} ${
            isValid ? 'is-valid' : ''
          }`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          placeholder={STUDENT_ID_EXAMPLE}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          maxLength={14}
          aria-invalid={Boolean(error)}
        />

        {value.length > 0 && (
          <span
            className={`auth-input__status ${
              isValid ? 'is-valid' : 'is-invalid'
            }`}
            aria-hidden="true"
          >
            {isValid ? (
              <Check className="react-icon" />
            ) : (
              <X className="react-icon" />
            )}
          </span>
        )}
      </div>

      {showHint && !isValid && (
        <div className="auth-hint-row">
          <span className="auth-hint">
            Format: <strong>{STUDENT_ID_EXAMPLE}</strong>
          </span>
          <span
            className={`auth-hint--counter ${
              progress === STUDENT_ID_LENGTH ? 'is-complete' : ''
            }`}
          >
            {progress}/{STUDENT_ID_LENGTH} digits
          </span>
        </div>
      )}

      {error && <span className="auth-error">{error}</span>}

      {isValid && (
        <span className="auth-hint auth-hint--success">
          ✓ Valid Student ID format
        </span>
      )}
    </div>
  );
}