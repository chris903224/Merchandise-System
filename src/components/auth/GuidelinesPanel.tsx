import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  KeyRound,
  LifeBuoy,
  ShieldCheck,
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
      ? Check
      : icon === 'security'
        ? KeyRound
        : icon === 'review'
          ? ClipboardCheck
          : icon === 'support'
            ? LifeBuoy
            : ShieldCheck;

  return <Icon className="react-icon" aria-hidden="true" />;
}

export default function GuidelinesPanel() {
  const [openId, setOpenId] = useState<GuidelineItem['id'] | null>('account');

  return (
    <section className="auth-guidelines" aria-labelledby="auth-guidelines-title">
      <header className="auth-section-heading">
        <p className="auth-section-heading__eyebrow">Start here</p>
        <h2 id="auth-guidelines-title">System Guidelines</h2>
        <p>Keep your SJCM account secure and ready for campus pickup.</p>
      </header>

      <div className="auth-guidelines__list">
        {guidelines.map((item) => {
          const isOpen = item.id === openId;
          const panelId = `guideline-panel-${item.id}`;

          return (
            <article className={`auth-guideline ${isOpen ? 'is-open' : ''}`} key={item.id}>
              <button
                id={`${panelId}-trigger`}
                className="auth-guideline__trigger"
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <span className="auth-guideline__icon">
                  <GuidelineIcon icon={item.icon} />
                </span>
                <span className="auth-guideline__label">{item.label}</span>
                <ChevronDown className="auth-guideline__chevron" aria-hidden="true" />
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
            </article>
          );
        })}
      </div>
    </section>
  );
}
