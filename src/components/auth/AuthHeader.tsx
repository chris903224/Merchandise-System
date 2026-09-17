import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authAssets } from './authAssets';

interface AuthHeaderProps {
  identifier: string;
  password: string;
  isSubmitting: boolean;
  isLocked: boolean;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function AuthHeader({
  identifier,
  password,
  isSubmitting,
  isLocked,
  onIdentifierChange,
  onPasswordChange,
  onSubmit,
}: AuthHeaderProps) {
  return (
    <header className="auth-experience__header">
      <Link to="/" className="auth-brand" aria-label="Saint Jude College Manila home">
        <img
          className="auth-brand__logo"
          src={authAssets.logo}
          alt="Saint Jude College Manila logo"
          width={76}
          height={76}
        />
        <span className="auth-brand__copy">
          <span className="auth-brand__name">Saint Jude College</span>
          <span className="auth-brand__name">Manila</span>
        </span>
      </Link>

      <form className="auth-quick-login" onSubmit={onSubmit} aria-label="Quick login">
        <label className="auth-sr-only" htmlFor="quick-login-username">
          Username
        </label>
        <input
          id="quick-login-username"
          className="auth-quick-login__input"
          type="text"
          inputMode="email"
          autoComplete="username"
          placeholder="Username"
          value={identifier}
          onChange={(event) => onIdentifierChange(event.target.value)}
          disabled={isLocked}
        />
        <label className="auth-sr-only" htmlFor="quick-login-password">
          Password
        </label>
        <input
          id="quick-login-password"
          className="auth-quick-login__input"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          disabled={isLocked}
        />
        <button
          className="auth-quick-login__submit"
          type="submit"
          disabled={isSubmitting || isLocked}
        >
          {isSubmitting ? '…' : 'Login'}
        </button>
      </form>
    </header>
  );
}
