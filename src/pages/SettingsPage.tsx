// src/pages/SettingsPage.tsx

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Palette,
  Lock as LockIcon,
  Sun,
  Moon,
  Smartphone,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
  Home,
  Globe,
  Link2,
  Trash2,
  AlertTriangle,
  Save,
  Camera,
  Pencil,
  ChevronRight,
  LifeBuoy,
  Eye,
  EyeOff,
  Menu,
  X,
  Store,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Account fields
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [courseStrand, setCourseStrand] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [dob, setDob] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Security
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [pickupReminders, setPickupReminders] = useState(true);

  // Appearance
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Privacy
  const [showActivityToOthers, setShowActivityToOthers] = useState(true);
  const [showProfileInDirectory, setShowProfileInDirectory] = useState(true);

  // Misc
  const [language, setLanguage] = useState('en-US');
  const [shippingAddress] = useState<string | null>(
    'Room 302, SJCM Dormitory, PHINMA Saint Jude College, Manila'
  );
  const [connectedGoogle, setConnectedGoogle] = useState(false);
  const [connectedFacebook, setConnectedFacebook] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/dashboard');
      return;
    }
    setFullName(session.name || '');
    setEmail(session.email || '');
    setStudentId(session.idNumber || '');
    setProfilePicture(session.profilePicture || null);
  }, [session, navigate]);

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
  const handleSaveAppearance = () => toast('Appearance updated!', 'success');
  const handleSavePrivacy = () => toast('Privacy preferences updated!', 'success');

  const handleConnect = (provider: 'google' | 'facebook') => {
    if (provider === 'google') {
      setConnectedGoogle(true);
      toast('Connect this button to your Google OAuth flow.', 'warning');
    } else {
      setConnectedFacebook(true);
      toast('Connect this button to your Facebook OAuth flow.', 'warning');
    }
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('This will permanently delete your account and data. Continue?')) return;
    toast('Account deletion requested — wire this up to your backend.', 'warning');
  };

  return (
    <div className="settings-shell">
      {/* ============================================
          SIDEBAR (dark, with brand + nav)
          ============================================ */}
      <aside className={`settings-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="settings-sidebar__top">
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

      {/* Backdrop for mobile */}
      {isSidebarOpen ? (
        <div
          className="settings-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* ============================================
          MAIN AREA — starts directly with hero (no duplicate topbar)
          ============================================ */}
      <div className="settings-main">
        {/* Mobile floating menu button */}
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
          {/* Hero banner */}
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

          {/* Horizontal tabs */}
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

          {/* Two-column content */}
          <div className="settings-layout">
            {/* ---------- MAIN COLUMN ---------- */}
            <div className="settings-content">
              {activeTab === 'account' && (
                <>
                  {/* Profile */}
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
                          <label className="settings-field__label">Full Name</label>
                          <input
                            className="settings-field__input"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>

                        <div className="settings-field">
                          <label className="settings-field__label">Student ID</label>
                          <input
                            className="settings-field__input"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
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
                          <label className="settings-field__label">Email Address</label>
                          <div className="settings-field__icon-wrap">
                            <Mail className="react-icon" aria-hidden="true" />
                            <input
                              type="email"
                              className="settings-field__input settings-field__input--icon"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Shipping */}
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
                      <button type="button" className="settings-btn settings-btn--ghost">
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

                  {/* Language */}
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
                <section className="settings-panel">
                  <header className="settings-panel__header">
                    <div className="settings-panel__heading">
                      <span className="settings-panel__icon">
                        <Palette className="react-icon" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="settings-panel__title">Appearance</h2>
                        <p className="settings-panel__subtitle">Customize your app experience.</p>
                      </div>
                    </div>
                  </header>

                  <div className="settings-panel__body">
                    <div className="settings-form">
                      <div className="settings-field">
                        <label className="settings-field__label">Theme</label>
                        <div className="settings-radio-group">
                          <button
                            type="button"
                            className={`settings-radio ${theme === 'light' ? 'is-active' : ''}`}
                            onClick={() => setTheme('light')}
                          >
                            <Sun className="react-icon" aria-hidden="true" />
                            <span>Light</span>
                          </button>
                          <button
                            type="button"
                            className={`settings-radio ${theme === 'dark' ? 'is-active' : ''}`}
                            onClick={() => setTheme('dark')}
                          >
                            <Moon className="react-icon" aria-hidden="true" />
                            <span>Dark</span>
                          </button>
                          <button
                            type="button"
                            className={`settings-radio ${theme === 'system' ? 'is-active' : ''}`}
                            onClick={() => setTheme('system')}
                          >
                            <Smartphone className="react-icon" aria-hidden="true" />
                            <span>System</span>
                          </button>
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
                  </div>
                </section>
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

            {/* ---------- RIGHT SIDEBAR ---------- */}
            <aside className="settings-side">
              {/* Brand card */}
              <div className="settings-brand-card">
                <span className="settings-brand-card__logo">SJ</span>
                <div>
                  <p className="settings-brand-card__title">SJCM STORE</p>
                  <p className="settings-brand-card__subtitle">Account Settings</p>
                  <p className="settings-brand-card__tagline">"Your account. Your control."</p>
                </div>
              </div>

              {/* Quick Links */}
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

              {/* Connected accounts */}
              <div className="settings-side-card">
                <p className="settings-side-card__title">
                  <Link2 className="react-icon" aria-hidden="true" />
                  <span>Connected Accounts</span>
                </p>
                <p className="settings-side-card__subtitle">
                  Link your accounts for a better experience.
                </p>

                <div className="settings-connected-item">
                  <span className="settings-connected-icon settings-connected-icon--google">G</span>
                  <span className="settings-connected-copy">
                    <span className="settings-connected-label">Google</span>
                    <span className="settings-connected-status">
                      {connectedGoogle ? 'Connected' : 'Not connected'}
                    </span>
                  </span>
                  {!connectedGoogle && (
                    <button
                      type="button"
                      className="settings-connect-btn"
                      onClick={() => handleConnect('google')}
                    >
                      Connect
                    </button>
                  )}
                </div>

                <div className="settings-connected-item">
                  <span className="settings-connected-icon settings-connected-icon--facebook">f</span>
                  <span className="settings-connected-copy">
                    <span className="settings-connected-label">Facebook</span>
                    <span className="settings-connected-status">
                      {connectedFacebook ? 'Connected' : 'Not connected'}
                    </span>
                  </span>
                  {!connectedFacebook && (
                    <button
                      type="button"
                      className="settings-connect-btn"
                      onClick={() => handleConnect('facebook')}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Danger zone */}
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
    </div>
  );
}