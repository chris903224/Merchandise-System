// src/components/admin/AdminUserDropdown.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings as SettingsIcon, User, ChevronDown } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { clearAdminSession } from '../../services/admin';

interface Props {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function AdminUserDropdown({ open, onToggle, onClose }: Props) {
  const navigate = useNavigate();
  const { session, clearSession } = useAdminStore();
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);

  const name = session?.user.name ?? 'Admin';
  const email = session?.user.email ?? 'admin@sjcm.edu.ph';
  const role = session?.user.role ?? 'Administrator';

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  const handleLogoutClick = () => {
    setIsConfirmingLogout(true);
  };

  const handleLogoutConfirm = () => {
    clearAdminSession();
    clearSession();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (!open) setIsConfirmingLogout(false);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="admin-topbar__user"
        onClick={onToggle}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="admin-topbar__avatar">{initials}</div>
        <div className="admin-topbar__user-info">
          <span className="admin-topbar__user-name">{name}</span>
          <span className="admin-topbar__user-role">{role}</span>
        </div>
        <ChevronDown
          className={`react-icon admin-topbar__chevron ${open ? 'is-open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="admin-dropdown admin-dropdown--user" role="menu">
          {!isConfirmingLogout ? (
            <>
              <div className="admin-dropdown__user-header">
                <div className="admin-topbar__avatar admin-topbar__avatar--lg">{initials}</div>
                <div>
                  <p className="admin-dropdown__user-name">{name}</p>
                  <p className="admin-dropdown__user-email">{email}</p>
                </div>
              </div>

              <hr className="admin-dropdown__divider" />

              <button
                type="button"
                className="admin-dropdown__item"
                onClick={() => { onClose(); navigate('/admin/profile'); }}
              >
                <User className="react-icon" aria-hidden="true" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                className="admin-dropdown__item"
                onClick={() => { onClose(); navigate('/admin/settings'); }}
              >
                <SettingsIcon className="react-icon" aria-hidden="true" />
                <span>Settings</span>
              </button>

              <hr className="admin-dropdown__divider" />

              <button
                type="button"
                className="admin-dropdown__item admin-dropdown__item--danger"
                onClick={handleLogoutClick}
              >
                <LogOut className="react-icon" aria-hidden="true" />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <div className="admin-dropdown__confirm">
              <p className="admin-dropdown__confirm-text">
                Log out of the SJCM Admin Console?
              </p>
              <div className="admin-dropdown__confirm-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                  onClick={() => setIsConfirmingLogout(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--sm"
                  onClick={handleLogoutConfirm}
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}