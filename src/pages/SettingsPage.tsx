// src/pages/SettingsPage.tsx

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Shield, Bell, Palette, Lock as LockIcon, Mail, CreditCard,
  Calendar, MapPin, Home, Globe, Trash2, AlertTriangle, Save, Camera,
  Pencil, ChevronRight, LifeBuoy, Eye, EyeOff, Menu, X, Store, Package,
  ShoppingCart, Check,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import {
  applyTheme,
  getStoredTheme,
  themeOptions,
  type ThemeId,
} from '../theme';
import { fetchProfileImages } from '../data/storage';
import './SettingsPage.css';

type SettingsTab = 'account' | 'security' | 'notifications' | 'appearance' | 'privacy';

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy', icon: Eye },
];

const sideNavItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/catalog', label: 'Shop', icon: Store },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/dashboard', label: 'My Orders', icon: Package },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Shield, active: true },
];

export default function SettingsPage() {
  const { session, updateProfilePicture } = useApp();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);

  const [profilePicture, setProfilePicture] = useState<string | null>(
    session?.profilePicture ?? null
  );

  const sidebarRef = useRef<HTMLElement>(null);
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [courseStrand, setCourseStrand] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [dob, setDob] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [pickupReminders, setPickupReminders] = useState(true);

  const [theme, setTheme] = useState<ThemeId>(getStoredTheme());

  const [showActivityToOthers, setShowActivityToOthers] = useState(true);
  const [showProfileInDirectory, setShowProfileInDirectory] = useState(true);

  const [language, setLanguage] = useState('en-US');

  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [draftAddress, setDraftAddress] = useState(shippingAddress);
  const [draftLabel, setDraftLabel] = useState('Default');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/dashboard');
      return;
    }
    setFullName(session.name || '');
    setEmail(session.email || '');
    setStudentId(session.idNumber || '');
    setProfilePicture(session.profilePicture || null);

    const loadAvatar = async () => {
      try {
        const { avatar_url } = await fetchProfileImages(session.id);
        if (avatar_url) {
          setProfilePicture(avatar_url);
        }
      } catch (error) {
        console.warn('[Settings] Failed to fetch avatar:', error);
      }
    };

    void loadAvatar();
  }, [session, navigate]);

  useEffect(() => {
    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
    if (!isDesktop()) return;

    const openSidebar = () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsSidebarOpen(true);
    };

    const scheduleClose = () => {
      if (isSidebarPinned) return;
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = window.setTimeout(() => {
        setIsSidebarOpen(false);
      }, 150);
    };

    const zone = hoverZoneRef.current;
    const sidebar = sidebarRef.current;
    if (!zone || !sidebar) return;

    zone.addEventListener('mouseenter', openSidebar);
    sidebar.addEventListener('mouseenter', openSidebar);
    sidebar.addEventListener('mouseleave', scheduleClose);
    zone.addEventListener('mouseleave', scheduleClose);

    return () => {
      zone.removeEventListener('mouseenter', openSidebar);
      sidebar.removeEventListener('mouseenter', openSidebar);
      sidebar.removeEventListener('mouseleave', scheduleClose);
      zone.removeEventListener('mouseleave', scheduleClose);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, [isSidebarPinned, session]);

  useEffect(() => {
    if (!isAddressModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAddressModalOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isAddressModalOpen]);

  const handleTabChange = (tab: SettingsTab) => setActiveTab(tab);

  if (!session) return null;

  const getInitials = () => {
    const source = fullName || session.name || '';
    return (
      source
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || 'U'
    );
  };

  const handleProfilePictureUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast('Image size must be less than 5MB.', 'warning');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast('Please upload a valid image file.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setProfilePicture(imageUrl);
        updateProfilePicture(imageUrl);
        toast('Profile picture updated!', 'success');
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast('Account details saved!', 'success');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match.', 'danger');
      return;
    }
    if (newPassword.length < 6) {
      toast('Password must be at least 6 characters.', 'danger');
      return;
    }
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast('Failed to change password.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = () => toast('Notification preferences updated!', 'success');

  const handleSaveAppearance = () => {
    applyTheme(theme);
    toast('Appearance updated!', 'success');
  };

  const handleSavePrivacy = () => toast('Privacy preferences updated!', 'success');

  const handleDeleteAccount = () => {
    if (!window.confirm('This will permanently delete your account and data. Continue?')) return;
    toast('Account deletion requested — wire this up to your backend.', 'warning');
  };

  const openAddressModal = () => {
    setDraftAddress(shippingAddress);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    if (isSavingAddress) return;
    setIsAddressModalOpen(false);
  };

  const handleSaveAddress = async () => {
    if (!draftAddress.trim()) {
      toast('Address cannot be empty.', 'warning');
      return;
    }
    setIsSavingAddress(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setShippingAddress(draftAddress.trim());
      toast('Shipping address updated!', 'success');
      setIsAddressModalOpen(false);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const currentThemeOption = themeOptions.find((t) => t.id === theme);

  return (
    <div className={`settings-shell ${isSidebarOpen ? 'is-sidebar-open' : ''}`}>
      <div
        ref={hoverZoneRef}
        className="settings-hover-zone"
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        className={`settings-sidebar ${isSidebarOpen ? 'is-open' : ''}`}
      >
        <div className="settings-sidebar__top">
          <button
            type="button"
            className="settings-sidebar__pin"
            onClick={() => setIsSidebarPinned((p) => !p)}
            aria-label={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            title={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            {isSidebarPinned ? (
              <X className="react-icon" />
            ) : (
              <ChevronRight className="react-icon" />
            )}
          </button>

          <Link to="/" className="settings-sidebar__brand" onClick={() => setIsSidebarOpen(false)}>
            <span className="settings-sidebar__brand-mark">SJ</span>
            <span className="settings-sidebar__brand-copy">
              <span className="settings-sidebar__brand-name">SJCM STORE</span>
              <span className="settings-sidebar__brand-tag">Official School Merchandise</span>
            </span>
          </Link>

          <nav className="settings-sidebar__nav">
            {sideNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active || item.to === '/settings';
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`settings-sidebar__item ${isActive ? 'is-active' : ''}`}
                  onClick={() => setIsSidebarOpen(false)}
                  data-label={item.label}
                >
                  <Icon className="react-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="settings-sidebar__bottom">
          <p className="settings-sidebar__motto">"Faith • Excellence • Service"</p>
          <p className="settings-sidebar__campus">Saint Jude College</p>
        </div>
      </aside>

      {isSidebarOpen ? (
        <div
          className="settings-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div className="settings-main">
        <button
          type="button"
          className="settings-mobile-menu"
          aria-label="Toggle settings navigation"
          onClick={() => setIsSidebarOpen((p) => !p)}
        >
          {isSidebarOpen ? (
            <X className="react-icon" aria-hidden="true" />
          ) : (
            <Menu className="react-icon" aria-hidden="true" />
          )}
        </button>

        <div className="settings-scroll">
          <section className="settings-hero">
            <div className="settings-hero__copy">
              <h1 className="settings-hero__title">Settings</h1>
              <p className="settings-hero__description">
                Manage your account preferences, security, and more.
              </p>
            </div>
            <div className="settings-hero__quote">
              <span>"Better</span>
              <span>Students</span>
              <span>Build a</span>
              <span>Brighter</span>
              <span>Tomorrow"</span>
            </div>
          </section>

          <nav className="settings-tabs" role="tablist" aria-label="Settings sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`settings-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <Icon className="react-icon" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="settings-layout">
            <div className="settings-content">
              {activeTab === 'account' && (
                <>
                  <section className="settings-panel">
                    <header className="settings-panel__header">
                      <div className="settings-panel__heading">
                        <span className="settings-panel__icon">
                          <User className="react-icon" aria-hidden="true" />
                        </span>
                        <div>
                          <h2 className="settings-panel__title">Profile Information</h2>
                          <p className="settings-panel__subtitle">
                            Update your personal details and profile picture.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="settings-btn settings-btn--primary"
                        onClick={handleSaveAccount}
                        disabled={isSavingAccount}
                      >
                        <Save className="react-icon" aria-hidden="true" />
                        <span>{isSavingAccount ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </header>

                    <div className="settings-panel__body settings-panel__body--split">
                      <div className="settings-photo">
                        <div className="settings-photo__frame">
                          {profilePicture ? (
                            <img src={profilePicture} alt={fullName} />
                          ) : (
                            <span className="settings-photo__fallback">{getInitials()}</span>
                          )}
                          <button
                            type="button"
                            className="settings-photo__badge"
                            onClick={handleProfilePictureUpload}
                            aria-label="Upload profile picture"
                          >
                            <Camera className="react-icon" aria-hidden="true" />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="settings-photo__btn"
                          onClick={handleProfilePictureUpload}
                        >
                          <Camera className="react-icon" aria-hidden="true" />
                          <span>Change Photo</span>
                        </button>
                      </div>

                      <div className="settings-fields">
                        <div className="settings-field">
                          <label className="settings-field__label">
                            Full Name
                            <span className="settings-field__lock" title="Managed by your registration record">
                              <LockIcon className="react-icon" aria-hidden="true" />
                              <span>Locked</span>
                            </span>
                          </label>
                          <input
                            className="settings-field__input settings-field__input--locked"
                            value={fullName}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="settings-field">
                          <label className="settings-field__label">
                            Student ID
                            <span className="settings-field__lock" title="Managed by your registration record">
                              <LockIcon className="react-icon" aria-hidden="true" />
                              <span>Locked</span>
                            </span>
                          </label>
                          <input
                            className="settings-field__input settings-field__input--locked"
                            value={studentId}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="settings-field">
                          <label className="settings-field__label">Course / Strand</label>
                          <select
                            className="settings-field__select"
                            value={courseStrand}
                            onChange={(e) => setCourseStrand(e.target.value)}
                          >
                            <option value="">BS Information Technology</option>
                            <option value="BSIT">BS Information Technology</option>
                            <option value="BSA">BS Accountancy</option>
                            <option value="BSN">BS Nursing</option>
                          </select>
                        </div>

                        <div className="settings-field">
                          <label className="settings-field__label">Year Level</label>
                          <select
                            className="settings-field__select"
                            value={yearLevel}
                            onChange={(e) => setYearLevel(e.target.value)}
                          >
                            <option value="">2nd Year</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                          </select>
                        </div>

                        <div className="settings-field">
                          <label className="settings-field__label">Date of Birth</label>
                          <div className="settings-field__icon-wrap">
                            <Calendar className="react-icon" aria-hidden="true" />
                            <input
                              type="date"
                              className="settings-field__input settings-field__input--icon"
                              value={dob}
                              onChange={(e) => setDob(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="settings-field">
                          <label className="settings-field__label">
                            Email Address
                            <span className="settings-field__lock" title="Managed by your registration record">
                              <LockIcon className="react-icon" aria-hidden="true" />
                              <span>Locked</span>
                            </span>
                          </label>
                          <div className="settings-field__icon-wrap">
                            <Mail className="react-icon" aria-hidden="true" />
                            <input
                              type="email"
                              className="settings-field__input settings-field__input--icon settings-field__input--locked"
                              value={email}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="settings-panel">
                    <header className="settings-panel__header">
                      <div className="settings-panel__heading">
                        <span className="settings-panel__icon">
                          <MapPin className="react-icon" aria-hidden="true" />
                        </span>
                        <div>
                          <h2 className="settings-panel__title">Shipping Address</h2>
                          <p className="settings-panel__subtitle">
                            Manage your delivery address for your orders.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="settings-btn settings-btn--ghost"
                        onClick={openAddressModal}
                      >
                        <Pencil className="react-icon" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                    </header>
                    <div className="settings-panel__body">
                      <div className="settings-address">
                        <span className="settings-address__icon">
                          <Home className="react-icon" aria-hidden="true" />
                        </span>
                        <span className="settings-address__text">
                          {shippingAddress || 'No shipping address on file yet.'}
                        </span>
                        <span className="settings-address__badge">Default</span>
                      </div>
                    </div>
                  </section>

                  <section className="settings-panel">
                    <header className="settings-panel__header">
                      <div className="settings-panel__heading">
                        <span className="settings-panel__icon">
                          <Globe className="react-icon" aria-hidden="true" />
                        </span>
                        <div>
                          <h2 className="settings-panel__title">Language &amp; Region</h2>
                          <p className="settings-panel__subtitle">
                            Set your preferred language and region.
                          </p>
                        </div>
                      </div>
                      <select
                        className="settings-field__select settings-field__select--inline"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-PH">English (Philippines)</option>
                        <option value="tl-PH">Tagalog</option>
                      </select>
                    </header>
                  </section>
                </>
              )}

              {activeTab === 'security' && (
                <section className="settings-panel">
                  <header className="settings-panel__header">
                    <div className="settings-panel__heading">
                      <span className="settings-panel__icon">
                        <Shield className="react-icon" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="settings-panel__title">Security Settings</h2>
                        <p className="settings-panel__subtitle">
                          Manage your password and security preferences.
                        </p>
                      </div>
                    </div>
                  </header>

                  <div className="settings-panel__body">
                    <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
                      <div className="settings-field">
                        <label className="settings-field__label">Current Password</label>
                        <div className="settings-field__password">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            className="settings-field__input"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter your current password"
                          />
                          <button
                            type="button"
                            className="settings-field__toggle"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="react-icon" aria-hidden="true" />
                            ) : (
                              <Eye className="react-icon" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="settings-field">
                        <label className="settings-field__label">New Password</label>
                        <div className="settings-field__password">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            className="settings-field__input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                          />
                          <button
                            type="button"
                            className="settings-field__toggle"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="react-icon" aria-hidden="true" />
                            ) : (
                              <Eye className="react-icon" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                        <p className="settings-field__hint">
                          Password must be at least 6 characters long.
                        </p>
                      </div>

                      <div className="settings-field">
                        <label className="settings-field__label">Confirm New Password</label>
                        <div className="settings-field__password">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="settings-field__input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your new password"
                          />
                          <button
                            type="button"
                            className="settings-field__toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="react-icon" aria-hidden="true" />
                            ) : (
                              <Eye className="react-icon" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="settings-btn settings-btn--primary"
                        onClick={handleChangePassword}
                        disabled={isSaving}
                      >
                        <LockIcon className="react-icon" aria-hidden="true" />
                        <span>{isSaving ? 'Changing...' : 'Change Password'}</span>
                      </button>
                    </form>
                  </div>
                </section>
              )}

              {activeTab === 'notifications' && (
                <section className="settings-panel">
                  <header className="settings-panel__header">
                    <div className="settings-panel__heading">
                      <span className="settings-panel__icon">
                        <Bell className="react-icon" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="settings-panel__title">Notification Preferences</h2>
                        <p className="settings-panel__subtitle">
                          Control how and when you receive notifications.
                        </p>
                      </div>
                    </div>
                  </header>

                  <div className="settings-panel__body">
                    <div className="settings-form">
                      <div className="settings-toggle-group">
                        <div className="settings-toggle-item">
                          <div className="settings-toggle-info">
                            <Mail className="react-icon" aria-hidden="true" />
                            <div>
                              <h4 className="settings-toggle-label">Email Notifications</h4>
                              <p className="settings-toggle-desc">Receive notifications via email.</p>
                            </div>
                          </div>
                          <label className="settings-switch">
                            <input
                              type="checkbox"
                              checked={emailNotifications}
                              onChange={() => setEmailNotifications(!emailNotifications)}
                            />
                            <span className="settings-switch__slider" />
                          </label>
                        </div>

                        <div className="settings-divider" />

                        <div className="settings-toggle-item">
                          <div className="settings-toggle-info">
                            <CreditCard className="react-icon" aria-hidden="true" />
                            <div>
                              <h4 className="settings-toggle-label">Order Updates</h4>
                              <p className="settings-toggle-desc">Get updates on your order status.</p>
                            </div>
                          </div>
                          <label className="settings-switch">
                            <input
                              type="checkbox"
                              checked={orderUpdates}
                              onChange={() => setOrderUpdates(!orderUpdates)}
                            />
                            <span className="settings-switch__slider" />
                          </label>
                        </div>

                        <div className="settings-divider" />

                        <div className="settings-toggle-item">
                          <div className="settings-toggle-info">
                            <Bell className="react-icon" aria-hidden="true" />
                            <div>
                              <h4 className="settings-toggle-label">Promotions &amp; Offers</h4>
                              <p className="settings-toggle-desc">Receive promotional offers and discounts.</p>
                            </div>
                          </div>
                          <label className="settings-switch">
                            <input
                              type="checkbox"
                              checked={promotions}
                              onChange={() => setPromotions(!promotions)}
                            />
                            <span className="settings-switch__slider" />
                          </label>
                        </div>

                        <div className="settings-divider" />

                        <div className="settings-toggle-item">
                          <div className="settings-toggle-info">
                            <Bell className="react-icon" aria-hidden="true" />
                            <div>
                              <h4 className="settings-toggle-label">Pickup Reminders</h4>
                              <p className="settings-toggle-desc">
                                Get reminders when your items are ready for pickup.
                              </p>
                            </div>
                          </div>
                          <label className="settings-switch">
                            <input
                              type="checkbox"
                              checked={pickupReminders}
                              onChange={() => setPickupReminders(!pickupReminders)}
                            />
                            <span className="settings-switch__slider" />
                          </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="settings-btn settings-btn--primary"
                        onClick={handleSaveNotifications}
                      >
                        <Save className="react-icon" aria-hidden="true" />
                        <span>Save Preferences</span>
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'appearance' && (
                <>
                  <section className="settings-panel">
                    <header className="settings-panel__header">
                      <div className="settings-panel__heading">
                        <span className="settings-panel__icon">
                          <Palette className="react-icon" aria-hidden="true" />
                        </span>
                        <div>
                          <h2 className="settings-panel__title">Theme &amp; Colors</h2>
                          <p className="settings-panel__subtitle">
                            Customize your app experience with your preferred theme and color style.
                          </p>
                        </div>
                      </div>
                    </header>

                    <div className="settings-panel__body">
                      {/* Sub-tabs */}
                      <div className="appearance-tabs">
                        <button
                          type="button"
                          className="appearance-tab is-active"
                          aria-selected="true"
                        >
                          <Palette className="react-icon" aria-hidden="true" />
                          <span>Color Theme</span>
                        </button>
                        <button type="button" className="appearance-tab">
                          <span>☀️</span>
                          <span>Light / Dark Mode</span>
                        </button>
                      </div>

                      {/* Color Themes */}
                      <div className="appearance-section">
                        <h3 className="appearance-section__title">Color Themes</h3>
                        <p className="appearance-section__subtitle">
                          Choose a color theme that matches your style.
                        </p>

                        <div className="theme-grid">
                          {themeOptions.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              data-theme-id={option.id}
                              className={`theme-card ${theme === option.id ? 'is-active' : ''}`}
                              onClick={() => setTheme(option.id)}
                              aria-pressed={theme === option.id}
                            >
                              <div
                                className="theme-card__preview"
                                style={{ background: option.gradient } as React.CSSProperties}
                              >
                                <span className="theme-card__emoji">{option.emoji}</span>
                              </div>
                              <div className="theme-card__body">
                                <div className="theme-card__dots" aria-hidden="true">
                                  <span className="theme-card__dot theme-card__dot--1" />
                                  <span className="theme-card__dot theme-card__dot--2" />
                                  <span className="theme-card__dot theme-card__dot--3" />
                                </div>
                                <span className="theme-card__label">
                                  {option.label}
                                  {option.id === 'green-glass' && (
                                    <span className="theme-card__default"> (Default)</span>
                                  )}
                                </span>
                                <span className="theme-card__radio" aria-hidden="true">
                                  {theme === option.id && <Check className="react-icon" />}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="settings-btn settings-btn--primary"
                        onClick={handleSaveAppearance}
                      >
                        <Save className="react-icon" aria-hidden="true" />
                        <span>Save Preferences</span>
                      </button>
                    </div>
                  </section>

                  {/* Current Theme card */}
                  <section className="appearance-current-theme">
                    <div className="appearance-current-theme__head">
                      <span className="appearance-current-theme__icon">
                        <Palette className="react-icon" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="appearance-current-theme__label">Current Theme</p>
                        <p className="appearance-current-theme__name">
                          {currentThemeOption?.label || 'SJ Green'}
                        </p>
                      </div>
                      <span className="appearance-current-theme__badge">Active</span>
                    </div>
                    <div className="appearance-current-theme__preview" aria-hidden="true">
                      <span className="appearance-current-theme__dot" />
                      <span className="appearance-current-theme__dot" />
                      <span className="appearance-current-theme__dot" />
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'privacy' && (
                <section className="settings-panel">
                  <header className="settings-panel__header">
                    <div className="settings-panel__heading">
                      <span className="settings-panel__icon">
                        <Eye className="react-icon" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="settings-panel__title">Privacy</h2>
                        <p className="settings-panel__subtitle">
                          Control what others can see about your account.
                        </p>
                      </div>
                    </div>
                  </header>

                  <div className="settings-panel__body">
                    <div className="settings-form">
                      <div className="settings-toggle-group">
                        <div className="settings-toggle-item">
                          <div className="settings-toggle-info">
                            <Eye className="react-icon" aria-hidden="true" />
                            <div>
                              <h4 className="settings-toggle-label">Show My Order Activity</h4>
                              <p className="settings-toggle-desc">
                                Let other students see that you've placed an order.
                              </p>
                            </div>
                          </div>
                          <label className="settings-switch">
                            <input
                              type="checkbox"
                              checked={showActivityToOthers}
                              onChange={() => setShowActivityToOthers(!showActivityToOthers)}
                            />
                            <span className="settings-switch__slider" />
                          </label>
                        </div>

                        <div className="settings-divider" />

                        <div className="settings-toggle-item">
                          <div className="settings-toggle-info">
                            <User className="react-icon" aria-hidden="true" />
                            <div>
                              <h4 className="settings-toggle-label">Show Profile in Directory</h4>
                              <p className="settings-toggle-desc">
                                Make your profile visible in the student directory.
                              </p>
                            </div>
                          </div>
                          <label className="settings-switch">
                            <input
                              type="checkbox"
                              checked={showProfileInDirectory}
                              onChange={() => setShowProfileInDirectory(!showProfileInDirectory)}
                            />
                            <span className="settings-switch__slider" />
                          </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="settings-btn settings-btn--primary"
                        onClick={handleSavePrivacy}
                      >
                        <Save className="react-icon" aria-hidden="true" />
                        <span>Save Preferences</span>
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <aside className="settings-side">
              <div className="settings-brand-card">
                <span className="settings-brand-card__logo">SJ</span>
                <div>
                  <p className="settings-brand-card__title">SJCM STORE</p>
                  <p className="settings-brand-card__subtitle">Account Settings</p>
                  <p className="settings-brand-card__tagline">"Your account. Your control."</p>
                </div>
              </div>

              <div className="settings-side-card">
                <p className="settings-side-card__title">Quick Links</p>
                <div className="settings-quicklinks">
                  <button
                    type="button"
                    className="settings-quicklink"
                    onClick={() => setActiveTab('security')}
                  >
                    <span className="settings-quicklink__icon">
                      <LockIcon className="react-icon" aria-hidden="true" />
                    </span>
                    <span className="settings-quicklink__copy">
                      <span className="settings-quicklink__label">Change Password</span>
                      <span className="settings-quicklink__desc">Keep your account secure</span>
                    </span>
                    <ChevronRight className="react-icon settings-quicklink__chev" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="settings-quicklink"
                    onClick={() => setActiveTab('notifications')}
                  >
                    <span className="settings-quicklink__icon">
                      <Bell className="react-icon" aria-hidden="true" />
                    </span>
                    <span className="settings-quicklink__copy">
                      <span className="settings-quicklink__label">Manage Notifications</span>
                      <span className="settings-quicklink__desc">Control what you receive</span>
                    </span>
                    <ChevronRight className="react-icon settings-quicklink__chev" aria-hidden="true" />
                  </button>

                  <a href="mailto:suppliesjc@gmail.com" className="settings-quicklink">
                    <span className="settings-quicklink__icon">
                      <LifeBuoy className="react-icon" aria-hidden="true" />
                    </span>
                    <span className="settings-quicklink__copy">
                      <span className="settings-quicklink__label">Help &amp; Support</span>
                      <span className="settings-quicklink__desc">Get assistance when you need it</span>
                    </span>
                    <ChevronRight className="react-icon settings-quicklink__chev" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div className="settings-side-card settings-side-card--danger">
                <p className="settings-side-card__title settings-side-card__title--danger">
                  <AlertTriangle className="react-icon" aria-hidden="true" />
                  <span>Danger Zone</span>
                </p>
                <p className="settings-side-card__subtitle">
                  Irreversible actions. Please be careful.
                </p>
                <button
                  type="button"
                  className="settings-danger-btn"
                  onClick={handleDeleteAccount}
                >
                  <span className="settings-danger-btn__icon">
                    <Trash2 className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="settings-danger-btn__copy">
                    <span className="settings-danger-btn__label">Delete Account</span>
                    <span className="settings-danger-btn__desc">
                      Permanently remove your account and data
                    </span>
                  </span>
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {isAddressModalOpen && (
        <div
          className="settings-modal-overlay"
          onClick={closeAddressModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="address-modal-title"
        >
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="settings-modal__header">
              <div className="settings-modal__heading">
                <span className="settings-modal__icon">
                  <MapPin className="react-icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="address-modal-title" className="settings-modal__title">
                    Edit Shipping Address
                  </h2>
                  <p className="settings-modal__subtitle">
                    Update your delivery address for future orders.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="settings-modal__close"
                onClick={closeAddressModal}
                aria-label="Close dialog"
              >
                <X className="react-icon" aria-hidden="true" />
              </button>
            </header>

            <div className="settings-modal__body">
              <div className="settings-field">
                <label className="settings-field__label">Address</label>
                <div className="settings-field__icon-wrap">
                  <Home className="react-icon" aria-hidden="true" />
                  <input
                    type="text"
                    className="settings-field__input settings-field__input--icon"
                    value={draftAddress}
                    onChange={(e) => setDraftAddress(e.target.value)}
                    placeholder="Street, building, room, city"
                    autoFocus
                  />
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-field__label">Label</label>
                <div className="settings-modal__labels">
                  {['Default', 'Home', 'Dorm', 'Other'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className={`settings-modal__label-chip ${
                        draftLabel === label ? 'is-active' : ''
                      }`}
                      onClick={() => setDraftLabel(label)}
                    >
                      {draftLabel === label && (
                        <Check className="react-icon" aria-hidden="true" />
                      )}
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <footer className="settings-modal__footer">
              <button
                type="button"
                className="settings-btn settings-btn--ghost"
                onClick={closeAddressModal}
                disabled={isSavingAddress}
              >
                Cancel
              </button>
              <button
                type="button"
                className="settings-btn settings-btn--primary"
                onClick={handleSaveAddress}
                disabled={isSavingAddress}
              >
                <Save className="react-icon" aria-hidden="true" />
                <span>{isSavingAddress ? 'Saving...' : 'Save Address'}</span>
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}