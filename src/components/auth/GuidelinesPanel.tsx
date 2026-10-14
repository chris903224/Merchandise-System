// src/components/auth/GuidelinesPanel.tsx

import { useState } from 'react';
import {
  ChevronDown,
  FileText,
  HelpCircle,
  ShieldCheck,
  UserRound,
  Clock,      // ✅ BAGONG IDAGDAG
  Package,    // ✅ BAGONG IDAGDAG
} from 'lucide-react';
import type { GuidelineItem } from './authTypes';

const guidelines: GuidelineItem[] = [
  {
    id: 'account',
    label: 'Account registration',
    body: 'Use your institutional email address and a username that you will recognize when reserving campus merchandise.',
    icon: 'account',
  },
  {
    id: 'security',
    label: 'Keep credentials private',
    body: 'Never share your password or verification code. SJCM staff will not ask for either one through chat or social media.',
    icon: 'security',
  },
  {
    id: 'review',
    label: 'Review your details',
    body: 'Double-check your email, student ID number, and password before creating an account so order updates reach you.',
    icon: 'review',
  },
  // ✅ BAGONG ITEM — Campus pickup
  {
    id: 'pickup',
    label: 'Campus pickup only',
    body: 'All items are for pickup at the SJCM Supply Office. Bring a valid school ID when collecting your reservation.',
    icon: 'pickup',
  },
  // ✅ BAGONG ITEM — Order updates
  {
    id: 'updates',
    label: 'Track your reservation',
    body: 'Check your dashboard for live stock updates and pickup status. You will also receive email notifications for order changes.',
    icon: 'updates',
  },
  {
    id: 'support',
    label: 'Need help?',
    body: 'Contact the SJCM merchandise office if you need help with your account, campus pickup, or an existing reservation.',
    icon: 'support',
  },
];

function GuidelineIcon({ icon }: { icon: GuidelineItem['icon'] }) {
  const Icon =
    icon === 'account'
      ? UserRound
      : icon === 'security'
        ? ShieldCheck
        : icon === 'review'
          ? FileText
          : icon === 'pickup'
            ? Package           // ✅ BAGONG ICON
            : icon === 'updates'
              ? Clock           // ✅ BAGONG ICON
              : HelpCircle;

  return <Icon className="react-icon" aria-hidden="true" />;
}

export default function GuidelinesPanel() {
  const [openId, setOpenId] = useState<GuidelineItem['id'] | null>(null);

  return (
    <section
      className="auth-guidelines"
      aria-labelledby="auth-guidelines-title"
    >
      <header className="auth-section-heading">
        <p className="auth-section-heading__eyebrow">Start here</p>
        <h2 id="auth-guidelines-title">System Guidelines</h2>
        <p>Keep your SJCM account secure and ready for campus pickup.</p>
      </header>

      <ol className="auth-guidelines__list">
        {guidelines.map((item, index) => {
          const isOpen = item.id === openId;
          const panelId = `guideline-panel-${item.id}`;
          const number = String(index + 1).padStart(2, '0');

          return (
            <li
              key={item.id}
              className={`auth-guideline ${isOpen ? 'is-open' : ''}`}
            >
              <button
                id={`${panelId}-trigger`}
                className="auth-guideline__trigger"
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <span className="auth-guideline__number">{number}</span>
                <span className="auth-guideline__icon">
                  <GuidelineIcon icon={item.icon} />
                </span>
                <span className="auth-guideline__label">{item.label}</span>
                <ChevronDown
                  className="auth-guideline__chevron"
                  aria-hidden="true"
                />
              </button>
              <div
                id={panelId}
                className="auth-guideline__content"
                role="region"
                aria-labelledby={`${panelId}-trigger`}
                hidden={!isOpen}
              >
                <p>{item.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}