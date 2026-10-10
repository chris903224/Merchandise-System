// src/components/auth/RegisterGuidelinesPanel.tsx

import {
  CheckCircle2,
  IdCard,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react';

export default function RegisterGuidelinesPanel() {
  return (
    <div className="auth-guidelines">
      <div className="auth-section-heading">
        <span className="auth-section-heading__eyebrow">Before you begin</span>
        <h2>Registration Requirements</h2>
        <p>Make sure all details are correct before registering.</p>
      </div>

      <ul className="auth-requirement-list">
        {/* ✅ Full Name */}
        <li className="auth-requirement">
          <span className="auth-requirement__icon">
            <UserRound className="react-icon" aria-hidden="true" />
          </span>
          <div className="auth-requirement__copy">
            <p className="auth-requirement__title">Full Name</p>
            <p className="auth-requirement__desc">
              Enter the <strong>full name</strong> registered with the school.
            </p>
          </div>
          <CheckCircle2
            className="auth-requirement__check"
            aria-hidden="true"
          />
        </li>

        {/* ✅ Email */}
        <li className="auth-requirement">
          <span className="auth-requirement__icon">
            <Mail className="react-icon" aria-hidden="true" />
          </span>
          <div className="auth-requirement__copy">
            <p className="auth-requirement__title">PHINMAEd Email</p>
            <p className="auth-requirement__desc">
              The email address must end with <strong>@phinmaed.com</strong>.
            </p>
          </div>
          <CheckCircle2
            className="auth-requirement__check"
            aria-hidden="true"
          />
        </li>

        {/* ✅ Student ID */}
        <li className="auth-requirement">
          <span className="auth-requirement__icon">
            <IdCard className="react-icon" aria-hidden="true" />
          </span>
          <div className="auth-requirement__copy">
            <p className="auth-requirement__title">Student ID</p>
            <p className="auth-requirement__desc">
              Correct format: <code>XX-XXXX-XXXXXX</code>
            </p>
          </div>
          <CheckCircle2
            className="auth-requirement__check"
            aria-hidden="true"
          />
        </li>

        {/* ✅ Password */}
        <li className="auth-requirement">
          <span className="auth-requirement__icon">
            <LockKeyhole className="react-icon" aria-hidden="true" />
          </span>
          <div className="auth-requirement__copy">
            <p className="auth-requirement__title">Strong Password</p>
            <p className="auth-requirement__desc">
              Must have <strong>8+ characters</strong>, with{' '}
              <strong>uppercase</strong>, <strong>lowercase</strong>,{' '}
              <strong>number</strong>, and <strong>special character</strong>.
            </p>
          </div>
          <CheckCircle2
            className="auth-requirement__check"
            aria-hidden="true"
          />
        </li>
      </ul>

      <div className="auth-requirements-note">
        <strong>💡 Tip:</strong> After submitting, a{' '}
        <strong>6-digit verification code</strong> will be sent to your email.
      </div>
    </div>
  );
}