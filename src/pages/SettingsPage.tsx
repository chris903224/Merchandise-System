// src/pages/SettingsPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  GraduationCap,
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

export default function SettingsPage() {
  const { session, updateProfilePicture, signOut } = useApp();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // ----- Account fields -----
  // courseStrand, yearLevel, and dob aren't on the session model yet —
  // wire these up once your backend supports them. Seeded from session
  // where a matching field already exists so nothing here is fabricated.
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [courseStrand, setCourseStrand] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [dob, setDob] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // ----- Security -----
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ----- Notifications -----
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [pickupReminders, setPickupReminders] = useState(true);

  // ----- Appearance -----
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // ----- Privacy (local-only placeholders — see note above each toggle) -----
  const [showActivityToOthers, setShowActivityToOthers] = useState(true);
  const [showProfileInDirectory, setShowProfileInDirectory] = useState(true);

  // ----- Misc -----
  const [language, setLanguage] = useState('en-US');
  const [shippingAddress] = useState<string | null>(null);
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

  if (!session) {
    return null;
  }

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
      if (file) {
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
      }
    };
    input.click();
  };

  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    try {
      // TODO: replace with a real updateProfile(...) call once it exists on useApp().
      await new Promise((resolve) => setTimeout(resolve, 600));
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

  const handleSaveNotifications = () => {
    toast('Notification preferences updated!', 'success');
  };

  const handleSaveAppearance = () => {
    toast('Appearance updated!', 'success');
  };

  const handleSavePrivacy = () => {
    toast('Privacy preferences updated!', 'success');
  };

  const handleConnect = (provider: 'google' | 'facebook') => {
    // TODO: wire to real OAuth. This just flips the local UI state for now.
    if (provider === 'google') {
      setConnectedGoogle(true);
      toast('Connect this button to your Google OAuth flow.', 'warning');
    } else {
      setConnectedFacebook(true);
      toast('Connect this button to your Facebook OAuth flow.', 'warning');
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'This will permanently delete your account and data. This cannot be undone. Continue?'
    );
    if (!confirmed) return;
    // TODO: call your real delete-account endpoint here.
    toast('Account deletion requested — wire this up to your backend.', 'warning');
  };

  return (
    <main className="settings-page">
      <div className="settings-hero">
        <div className="settings-hero-overlay" />
        <div className="settings-hero-content">
          <h1 className="settings-hero-title">Settings</h1>
          <p className="settings-hero-desc">Manage your account preferences, security, and more.</p>
        </div>
        <p className="settings-hero-quote">
          &ldquo;Your Account.
          <br />
          Your Control.&rdquo;
        </p>
      </div>

      <nav className="settings-tabs" role="tablist" aria-label="Settings sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="react-icon" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="settings-layout">
        <div className="settings-main">
          {/* ===== Account tab ===== */}
          {activeTab === 'account' && (
            <>
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">
                      <User className="react-icon" aria-hidden="true" />
                      Profile Information
                    </h2>
                    <p className="settings-card-subtitle">Update your personal details and profile picture.</p>
                  </div>
                  <button
                    type="button"
                    className="settings-card-action"
                    onClick={handleSaveAccount}
                    disabled={isSavingAccount}
                  >
                    <Save className="react-icon" aria-hidden="true" />
                    {isSavingAccount ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="settings-card-body">
                  <div className="settings-photo-block">
                    <div className="settings-photo-box">
                      {profilePicture ? (
                        <img src={profilePicture} alt={fullName} />
                      ) : (
                        <div className="settings-photo-fallback">{getInitials()}</div>
                      )}
                      <button
                        type="button"
                        className="settings-photo-badge"
                        onClick={handleProfilePictureUpload}
                        aria-label="Upload profile picture"
                      >
                        <Camera className="react-icon" aria-hidden="true" />
                      </button>
                    </div>
                    <button type="button" className="settings-photo-btn" onClick={handleProfilePictureUpload}>
                      <Camera className="react-icon" aria-hidden="true" />
                      Change Photo
                    </button>
                  </div>

                  <div className="settings-account-grid">
                    <div className="settings-field">
                      <label className="settings-field-label" htmlFor="acct-name">
                        FULL NAME
                      </label>
                      <input
                        id="acct-name"
                        className="settings-field-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field-label" htmlFor="acct-student-id">
                        STUDENT ID
                      </label>
                      <input
                        id="acct-student-id"
                        className="settings-field-input"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field-label" htmlFor="acct-course">
                        COURSE / STRAND
                      </label>
                      <div className="settings-field-with-icon">
                        <GraduationCap className="react-icon" aria-hidden="true" />
                        <input
                          id="acct-course"
                          className="settings-field-input settings-field-input-icon"
                          placeholder="e.g. BS Information Technology"
                          value={courseStrand}
                          onChange={(e) => setCourseStrand(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="settings-field">
                      <label className="settings-field-label" htmlFor="acct-year">
                        YEAR LEVEL
                      </label>
                      <select
                        id="acct-year"
                        className="settings-field-select"
                        value={yearLevel}
                        onChange={(e) => setYearLevel(e.target.value)}
                      >
                        <option value="">Select year level</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>

                    <div className="settings-field">
                      <label className="settings-field-label" htmlFor="acct-dob">
                        DATE OF BIRTH
                      </label>
                      <div className="settings-field-with-icon">
                        <Calendar className="react-icon" aria-hidden="true" />
                        <input
                          id="acct-dob"
                          type="date"
                          className="settings-field-input settings-field-input-icon"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="settings-field">
                      <label className="settings-field-label" htmlFor="acct-email">
                        EMAIL ADDRESS
                      </label>
                      <div className="settings-field-with-icon">
                        <Mail className="react-icon" aria-hidden="true" />
                        <input
                          id="acct-email"
                          type="email"
                          className="settings-field-input settings-field-input-icon"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">
                      <MapPin className="react-icon" aria-hidden="true" />
                      Shipping Address
                    </h2>
                    <p className="settings-card-subtitle">Manage your delivery address for your orders.</p>
                  </div>
                  <button type="button" className="settings-card-action settings-card-action-ghost">
                    <Pencil className="react-icon" aria-hidden="true" />
                    {shippingAddress ? 'Edit' : 'Add'}
                  </button>
                </div>

                <div className="settings-address-box">
                  <div className="settings-address-icon">
                    <Home className="react-icon" aria-hidden="true" />
                  </div>
                  {shippingAddress ? (
                    <p className="settings-address-text">{shippingAddress}</p>
                  ) : (
                    <p className="settings-address-text settings-address-text-empty">
                      No shipping address on file yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">
                      <Globe className="react-icon" aria-hidden="true" />
                      Language &amp; Region
                    </h2>
                    <p className="settings-card-subtitle">Set your preferred language and region.</p>
                  </div>
                </div>
                <select
                  className="settings-field-select settings-language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-PH">English (Philippines)</option>
                  <option value="tl-PH">Tagalog</option>
                </select>
              </div>
            </>
          )}

          {/* ===== Security tab ===== */}
          {activeTab === 'security' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">
                    <Shield className="react-icon" aria-hidden="true" />
                    Security Settings
                  </h2>
                  <p className="settings-card-subtitle">Manage your password and security preferences.</p>
                </div>
              </div>

              <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="settings-current-password">
                    CURRENT PASSWORD
                  </label>
                  <div className="settings-password-wrapper">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="settings-current-password"
                      className="settings-field-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="settings-password-toggle"
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
                  <label className="settings-field-label" htmlFor="settings-new-password">
                    NEW PASSWORD
                  </label>
                  <div className="settings-password-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="settings-new-password"
                      className="settings-field-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 characters)"
                    />
                    <button
                      type="button"
                      className="settings-password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="react-icon" aria-hidden="true" />
                      ) : (
                        <Eye className="react-icon" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p className="settings-field-hint">Password must be at least 6 characters long.</p>
                </div>

                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="settings-confirm-password">
                    CONFIRM NEW PASSWORD
                  </label>
                  <div className="settings-password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="settings-confirm-password"
                      className="settings-field-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                    />
                    <button
                      type="button"
                      className="settings-password-toggle"
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
                  className="settings-save-btn"
                  onClick={handleChangePassword}
                  disabled={isSaving}
                >
                  <LockIcon className="react-icon" aria-hidden="true" />
                  <span>{isSaving ? 'Changing...' : 'Change Password'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ===== Notifications tab ===== */}
          {activeTab === 'notifications' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">
                    <Bell className="react-icon" aria-hidden="true" />
                    Notification Preferences
                  </h2>
                  <p className="settings-card-subtitle">Control how and when you receive notifications.</p>
                </div>
              </div>

              <div className="settings-form">
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div className="settings-toggle-info">
                      <Mail className="react-icon" aria-hidden="true" />
                      <div>
                        <h4 className="settings-toggle-label">Email Notifications</h4>
                        <p className="settings-toggle-description">Receive notifications via email.</p>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={() => setEmailNotifications(!emailNotifications)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-divider" />

                  <div className="settings-toggle-item">
                    <div className="settings-toggle-info">
                      <CreditCard className="react-icon" aria-hidden="true" />
                      <div>
                        <h4 className="settings-toggle-label">Order Updates</h4>
                        <p className="settings-toggle-description">Get updates on your order status.</p>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={orderUpdates}
                        onChange={() => setOrderUpdates(!orderUpdates)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-divider" />

                  <div className="settings-toggle-item">
                    <div className="settings-toggle-info">
                      <Bell className="react-icon" aria-hidden="true" />
                      <div>
                        <h4 className="settings-toggle-label">Promotions &amp; Offers</h4>
                        <p className="settings-toggle-description">Receive promotional offers and discounts.</p>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={promotions}
                        onChange={() => setPromotions(!promotions)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-divider" />

                  <div className="settings-toggle-item">
                    <div className="settings-toggle-info">
                      <Bell className="react-icon" aria-hidden="true" />
                      <div>
                        <h4 className="settings-toggle-label">Pickup Reminders</h4>
                        <p className="settings-toggle-description">
                          Get reminders when your items are ready for pickup.
                        </p>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={pickupReminders}
                        onChange={() => setPickupReminders(!pickupReminders)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>

                <button type="button" className="settings-save-btn" onClick={handleSaveNotifications}>
                  <Save className="react-icon" aria-hidden="true" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* ===== Appearance tab ===== */}
          {activeTab === 'appearance' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">
                    <Palette className="react-icon" aria-hidden="true" />
                    Appearance
                  </h2>
                  <p className="settings-card-subtitle">Customize your app experience.</p>
                </div>
              </div>

              <div className="settings-form">
                <div className="settings-field">
                  <label className="settings-field-label">THEME</label>
                  <div className="settings-radio-group">
                    <button
                      type="button"
                      className={`settings-radio-btn ${theme === 'light' ? 'settings-radio-btn--active' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="react-icon" aria-hidden="true" />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      className={`settings-radio-btn ${theme === 'dark' ? 'settings-radio-btn--active' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="react-icon" aria-hidden="true" />
                      <span>Dark</span>
                    </button>
                    <button
                      type="button"
                      className={`settings-radio-btn ${theme === 'system' ? 'settings-radio-btn--active' : ''}`}
                      onClick={() => setTheme('system')}
                    >
                      <Smartphone className="react-icon" aria-hidden="true" />
                      <span>System</span>
                    </button>
                  </div>
                </div>

                <button type="button" className="settings-save-btn" onClick={handleSaveAppearance}>
                  <Save className="react-icon" aria-hidden="true" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* ===== Privacy tab ===== */}
          {activeTab === 'privacy' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">
                    <Eye className="react-icon" aria-hidden="true" />
                    Privacy
                  </h2>
                  <p className="settings-card-subtitle">Control what others can see about your account.</p>
                </div>
              </div>

              <div className="settings-form">
                <div className="settings-toggle-group">
                  <div className="settings-toggle-item">
                    <div className="settings-toggle-info">
                      <Eye className="react-icon" aria-hidden="true" />
                      <div>
                        <h4 className="settings-toggle-label">Show My Order Activity</h4>
                        <p className="settings-toggle-description">
                          Let other students see that you've placed an order.
                        </p>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={showActivityToOthers}
                        onChange={() => setShowActivityToOthers(!showActivityToOthers)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-divider" />

                  <div className="settings-toggle-item">
                    <div className="settings-toggle-info">
                      <User className="react-icon" aria-hidden="true" />
                      <div>
                        <h4 className="settings-toggle-label">Show Profile in Directory</h4>
                        <p className="settings-toggle-description">
                          Make your profile visible in the student directory.
                        </p>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={showProfileInDirectory}
                        onChange={() => setShowProfileInDirectory(!showProfileInDirectory)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>

                <button type="button" className="settings-save-btn" onClick={handleSavePrivacy}>
                  <Save className="react-icon" aria-hidden="true" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== Right sidebar ===== */}
        <aside className="settings-side">
          <div className="settings-brand-card">
            <span className="settings-brand-logo">SJ</span>
            <div>
              <p className="settings-brand-title">SJCM STORE</p>
              <p className="settings-brand-subtitle">Account Settings</p>
              <p className="settings-brand-tagline">Your account. Your control.</p>
            </div>
          </div>

          <div className="settings-side-card">
            <div className="settings-side-title">Quick Links</div>
            <div className="settings-quicklinks">
              <button type="button" className="settings-quicklink" onClick={() => setActiveTab('security')}>
                <span className="settings-quicklink-icon">
                  <LockIcon className="react-icon" aria-hidden="true" />
                </span>
                <span className="settings-quicklink-text">
                  <span className="settings-quicklink-label">Change Password</span>
                  <span className="settings-quicklink-desc">Keep your account secure</span>
                </span>
                <ChevronRight className="react-icon settings-quicklink-chevron" aria-hidden="true" />
              </button>

              <button type="button" className="settings-quicklink" onClick={() => setActiveTab('notifications')}>
                <span className="settings-quicklink-icon">
                  <Bell className="react-icon" aria-hidden="true" />
                </span>
                <span className="settings-quicklink-text">
                  <span className="settings-quicklink-label">Manage Notifications</span>
                  <span className="settings-quicklink-desc">Control what you receive</span>
                </span>
                <ChevronRight className="react-icon settings-quicklink-chevron" aria-hidden="true" />
              </button>

              <a href="mailto:support@example.com" className="settings-quicklink">
                <span className="settings-quicklink-icon">
                  <LifeBuoy className="react-icon" aria-hidden="true" />
                </span>
                <span className="settings-quicklink-text">
                  <span className="settings-quicklink-label">Help &amp; Support</span>
                  <span className="settings-quicklink-desc">Get assistance when you need it</span>
                </span>
                <ChevronRight className="react-icon settings-quicklink-chevron" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="settings-side-card">
            <div className="settings-side-title">
              <Link2 className="react-icon" aria-hidden="true" />
              Connected Accounts
            </div>
            <p className="settings-side-subtitle">Link your accounts for a better experience.</p>

            <div className="settings-connected-item">
              <span className="settings-connected-icon settings-connected-icon-google">G</span>
              <span className="settings-connected-text">
                <span className="settings-connected-label">Google</span>
                <span className="settings-connected-status">
                  {connectedGoogle ? 'Connected' : 'Not connected'}
                </span>
              </span>
              {!connectedGoogle && (
                <button type="button" className="settings-connect-btn" onClick={() => handleConnect('google')}>
                  Connect
                </button>
              )}
            </div>

            <div className="settings-connected-item">
              <span className="settings-connected-icon settings-connected-icon-facebook">f</span>
              <span className="settings-connected-text">
                <span className="settings-connected-label">Facebook</span>
                <span className="settings-connected-status">
                  {connectedFacebook ? 'Connected' : 'Not connected'}
                </span>
              </span>
              {!connectedFacebook && (
                <button type="button" className="settings-connect-btn" onClick={() => handleConnect('facebook')}>
                  Connect
                </button>
              )}
            </div>
          </div>

          <div className="settings-side-card settings-danger-card">
            <div className="settings-side-title settings-danger-title">
              <AlertTriangle className="react-icon" aria-hidden="true" />
              Danger Zone
            </div>
            <p className="settings-side-subtitle">Irreversible actions. Please be careful.</p>

            <button type="button" className="settings-danger-btn" onClick={handleDeleteAccount}>
              <span className="settings-danger-btn-icon">
                <Trash2 className="react-icon" aria-hidden="true" />
              </span>
              <span className="settings-quicklink-text">
                <span className="settings-quicklink-label">Delete Account</span>
                <span className="settings-quicklink-desc">Permanently remove your account and data</span>
              </span>
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}