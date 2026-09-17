import type { CSSProperties, ReactNode } from 'react';
import { authAssets } from './authAssets';
import type { AuthMode } from './authTypes';

interface AuthCardProps {
  mode: AuthMode;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function AuthCard({ mode, title, description, children }: AuthCardProps) {
  const style = {
    '--auth-card-background': `url("${authAssets.registerBackground}")`,
  } as CSSProperties;

  return (
    <section
      className={`auth-card auth-card--${mode}`}
      style={style}
      aria-labelledby="auth-card-title"
    >
      <header className="auth-card__header">
        <p className="auth-card__eyebrow">{mode === 'register' ? 'New student access' : 'SJCM Store access'}</p>
        <h2 id="auth-card-title" className="auth-card__title">
          {title}
        </h2>
        {description ? <p className="auth-card__description">{description}</p> : null}
      </header>
      <div className="auth-card__body">{children}</div>
    </section>
  );
}
