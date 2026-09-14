// src/pages/SettingsPage.tsx

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Shield,
  Bell,
  Moon,
  Sun,
  Globe,
  Smartphone,
  CreditCard,
  LogOut,
  Save,
  Eye,
  Mail,
  EyeOff,
  Camera,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import ProfilePicture from '../components/ProfilePicture';
import './SettingsPage.css';

export default function SettingsPage() {
  const { session, updateProfilePicture, signOut } = useApp();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'security' | 'preferences' | 'notifications'>('security');
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Asia/Manila');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [pickupReminders, setPickupReminders] = useState(true);

  useEffect(() => {
    if (!session) {
      navigate('/dashboard');
      return;
    }
    setProfilePicture(session.profilePicture || null);
  }, [session, navigate]);

  if (!session) {
    return null;
  }

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
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast('Failed to change password.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = () => {
    toast('Preferences updated successfully!', 'success');
  };

  const handleSaveNotifications = () => {
    toast('Notification preferences updated!', 'success');
  };

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  const tabs = [
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <main className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <Link to="/dashboard" className="settings-back">
            <ArrowLeft className="react-icon" aria-hidden="true" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-description">
            Manage your account settings and preferences.
          </p>
        </header>

        <div className="settings-layout">
          <aside className="settings-sidebar">
            <div className="settings-user">
              <div className="settings-picture-wrapper">
                <ProfilePicture
                  name={session.name}
                  imageUrl={profilePicture}
                  size="lg"
                  bordered={true}
                />
                <button
                  type="button"
                  className="settings-picture-upload"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleProfilePictureUpload();
                  }}
                  aria-label="Upload profile picture"
                >
                  <Camera className="react-icon" aria-hidden="true" />
                </button>
              </div>
              <div className="settings-user-info">
                <p className="settings-user-name">{session.name}</p>
                <p className="settings-user-email">{session.email}</p>
                <span className="settings-user-role">{session.role}</span>
              </div>
            </div>

            <nav className="settings-tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="react-icon" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              className="settings-signout"
              onClick={handleSignOut}
            >
              <LogOut className="react-icon" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </aside>

          <section className="settings-content">
            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <h2 className="settings-section-title">Security Settings</h2>
                <p className="settings-section-description">
                  Manage your password and security preferences.
                </p>

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
                    <p className="settings-field-hint">
                      Password must be at least 6 characters long.
                    </p>
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
                    <Lock className="react-icon" aria-hidden="true" />
                    <span>{isSaving ? 'Changing...' : 'Change Password'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="settings-section">
                <h2 className="settings-section-title">Preferences</h2>
                <p className="settings-section-description">
                  Customize your app experience.
                </p>

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

                  <div className="settings-field">
                    <label className="settings-field-label" htmlFor="settings-language">
                      LANGUAGE
                    </label>
                    <select
                      id="settings-language"
                      className="settings-field-select"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="tl">Tagalog</option>
                    </select>
                  </div>

                  <div className="settings-field">
                    <label className="settings-field-label" htmlFor="settings-timezone">
                      TIMEZONE
                    </label>
                    <select
                      id="settings-timezone"
                      className="settings-field-select"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="settings-save-btn"
                    onClick={handleSavePreferences}
                  >
                    <Save className="react-icon" aria-hidden="true" />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2 className="settings-section-title">Notification Preferences</h2>
                <p className="settings-section-description">
                  Control how and when you receive notifications.
                </p>

                <div className="settings-form">
                  <div className="settings-toggle-group">
                    <div className="settings-toggle-item">
                      <div className="settings-toggle-info">
                        <Mail className="react-icon" aria-hidden="true" />
                        <div>
                          <h4 className="settings-toggle-label">Email Notifications</h4>
                          <p className="settings-toggle-description">
                            Receive notifications via email.
                          </p>
                        </div>
                      </div>
                      <label className="settings-toggle">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={() => setEmailNotifications(!emailNotifications)}
                        />
                        <span className="settings-toggle-slider"></span>
                      </label>
                    </div>

                    <div className="settings-divider" />

                    <div className="settings-toggle-item">
                      <div className="settings-toggle-info">
                        <CreditCard className="react-icon" aria-hidden="true" />
                        <div>
                          <h4 className="settings-toggle-label">Order Updates</h4>
                          <p className="settings-toggle-description">
                            Get updates on your order status.
                          </p>
                        </div>
                      </div>
                      <label className="settings-toggle">
                        <input
                          type="checkbox"
                          checked={orderUpdates}
                          onChange={() => setOrderUpdates(!orderUpdates)}
                        />
                        <span className="settings-toggle-slider"></span>
                      </label>
                    </div>

                    <div className="settings-divider" />

                    <div className="settings-toggle-item">
                      <div className="settings-toggle-info">
                        <Bell className="react-icon" aria-hidden="true" />
                        <div>
                          <h4 className="settings-toggle-label">Promotions & Offers</h4>
                          <p className="settings-toggle-description">
                            Receive promotional offers and discounts.
                          </p>
                        </div>
                      </div>
                      <label className="settings-toggle">
                        <input
                          type="checkbox"
                          checked={promotions}
                          onChange={() => setPromotions(!promotions)}
                        />
                        <span className="settings-toggle-slider"></span>
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
                        <span className="settings-toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="settings-save-btn"
                    onClick={handleSaveNotifications}
                  >
                    <Save className="react-icon" aria-hidden="true" />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}