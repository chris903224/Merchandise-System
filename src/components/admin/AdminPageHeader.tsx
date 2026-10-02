// src/components/admin/AdminPageHeader.tsx

import type { ReactNode } from 'react';

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: Props) {
  return (
    <header className="admin-page-header">
      <div>
        <span className="admin-page-header__eyebrow">{eyebrow}</span>
        <h1 className="admin-page-header__title">{title}</h1>
        {description && (
          <p className="admin-page-header__desc">{description}</p>
        )}
      </div>
      {actions && <div className="admin-page-header__actions">{actions}</div>}
    </header>
  );
}