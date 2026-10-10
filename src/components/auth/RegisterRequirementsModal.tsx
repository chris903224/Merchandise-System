// src/components/auth/RegisterRequirementsModal.tsx

import {
  CheckCircle2,
  IdCard,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react';

interface RegisterRequirementsModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

export default function RegisterRequirementsModal({
  isOpen,
  onContinue,
}: RegisterRequirementsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="register-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
    >
      <div className="register-modal">
        {/* Header */}
        <div className="register-modal__header">
          <span className="register-modal__eyebrow">Before you begin</span>
          <h2 id="register-modal-title" className="register-modal__title">
            Registration Requirements
          </h2>
          <p className="register-modal__desc">
            Make sure you have the following before registering:
          </p>
        </div>

        {/* Requirements list */}
        <ul className="register-modal__list">
          {/* ✅ Full Name */}
          <li className="register-modal__item">
            <span className="register-modal__icon">
              <UserRound className="react-icon" aria-hidden="true" />
            </span>
            <div className="register-modal__copy">
              <p className="register-modal__label">Full Name</p>
              <p className="register-modal__hint">
                Full name registered with the school.
              </p>
            </div>
            <CheckCircle2
              className="register-modal__check"
              aria-hidden="true"
            />
          </li>

          {/* ✅ PHINMAEd Email */}
          <li className="register-modal__item">
            <span className="register-modal__icon">
              <Mail className="react-icon" aria-hidden="true" />
            </span>
            <div className="register-modal__copy">
              <p className="register-modal__label">PHINMAEd Email</p>
              <p className="register-modal__hint">
                The email must end with <strong>@phinmaed.com</strong>.
              </p>
            </div>
            <CheckCircle2
              className="register-modal__check"
              aria-hidden="true"
            />
          </li>

          {/* ✅ Student ID */}
          <li className="register-modal__item">
            <span className="register-modal__icon">
              <IdCard className="react-icon" aria-hidden="true" />
            </span>
            <div className="register-modal__copy">
              <p className="register-modal__label">Student ID</p>
              <p className="register-modal__hint">
                Correct format: <code>XX-XXXX-XXXXXX</code>
              </p>
            </div>
            <CheckCircle2
              className="register-modal__check"
              aria-hidden="true"
            />
          </li>

          {/* ✅ Strong Password */}
          <li className="register-modal__item">
            <span className="register-modal__icon">
              <LockKeyhole className="react-icon" aria-hidden="true" />
            </span>
            <div className="register-modal__copy">
              <p className="register-modal__label">Strong Password</p>
              <p className="register-modal__hint">
                8+ characters, uppercase, lowercase, number, and special
                character.
              </p>
            </div>
            <CheckCircle2
              className="register-modal__check"
              aria-hidden="true"
            />
          </li>
        </ul>

        {/* Note */}
        <div className="register-modal__note">
          <strong>💡 Tip:</strong> After submitting, a{' '}
          <strong>6-digit verification code</strong> will be sent to your email.
        </div>

        {/* Footer — Continue button */}
        <div className="register-modal__footer">
          <button
            type="button"
            className="register-modal__btn"
            onClick={onContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}