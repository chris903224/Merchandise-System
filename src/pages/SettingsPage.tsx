// src/pages/SettingsPage.tsx

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Palette,
  Lock as LockIcon,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
  Home,
  Globe,
  Trash2,
  AlertTriangle,
  Save,
  Camera,
  Pencil,
  ChevronRight,
  LifeBuoy,
  Eye,
  EyeOff,
  Store,
  Package,
  ShoppingCart,
  Check,
  Phone,
  X,
  Building2,     // ✅ IDAGDAG
  DoorOpen,      // ✅ IDAGDAG
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import {
  applyTheme,
  getStoredTheme,
  themeOptions,
  type ThemeId,
} from '../theme';
import {
  fetchProfileImages,
  fetchUserProfile,
  updateUserProfile,
} from '../data/storage';
import { COURSE_OPTIONS, YEAR_LEVELS, BUILDINGS, BUILDING_NAMES } from '../data/constants'; // ✅ IDAGDAG
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

const DEFAULT_THEME_ID: ThemeId = 'cream-yellow';

/* ✅ Available languages for Google Translate */
const LANGUAGES = [
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'tl', label: 'Tagalog', flag: '🇵🇭' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

/* ✅ Helper: read current Google Translate language */
function getCurrentLanguage(): string {
  const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
  return match ? match[1] : 'en';
}

/* ✅ Helper: apply Google Translate language */
function applyLanguage(langCode: string) {
  document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

  if (langCode === 'en') {
    window.location.reload();
    return;
  }

  document.cookie = `googtrans=/en/${langCode}; path=/`;

  const selectEl = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (selectEl) {
    selectEl.value = langCode;
    selectEl.dispatchEvent(new Event('change'));
  } else {
    window.location.reload();
  }
}

/* ============================================
   ✅ PHONE NUMBER HELPERS
   ============================================ */

/** ✅ Format phone: 09XX XXX XXXX (11 digits) */
function formatPhoneNumber(input: string): string {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '').slice(0, 11);

  // Format: 09XX XXX XXXX
  if (digits.length === 0) return '';
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
}

/** ✅ Validate phone: must be 11 digits starting with 09 */
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('09');
}

export default function SettingsPage() {
  const { session, updateProfilePicture } = useApp();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  const [profilePicture, setProfilePicture] = useState<string | null>(
    session?.profilePicture ?? null
  );

  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [courseStrand, setCourseStrand] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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

  const [language, setLanguage] = useState<string>(getCurrentLanguage());

  /* ============================================
     ✅ SHIPPING ADDRESS — Building + Room
     ============================================ */
  const [shippingBuilding, setShippingBuilding] = useState<string>(BUILDING_NAMES[0] || '');
  const [shippingRoom, setShippingRoom] = useState<string>(BUILDINGS[BUILDING_NAMES[0]]?.[0] || '');
  const [shippingNotes, setShippingNotes] = useState<string>('');

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [draftBuilding, setDraftBuilding] = useState(shippingBuilding);
  const [draftRoom, setDraftRoom] = useState(shippingRoom);
  const [draftNotes, setDraftNotes] = useState(shippingNotes);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  /* ============================================
     LOAD PROFILE
     ============================================ */
  useEffect(() => {
    if (!session) {
      navigate('/dashboard');
      return;
    }

    setFullName(session.name || '');
    setEmail(session.email || '');
    setStudentId(session.idNumber || '');
    setProfilePicture(session.profilePicture || null);

    if ((session as any).course) setCourseStrand((session as any).course);
    if ((session as any).yearLevel) setYearLevel((session as any).yearLevel);
    if ((session as any).dateOfBirth) setDob((session as any).dateOfBirth);
    if ((session as any).phone) setPhone(formatPhoneNumber((session as any).phone));

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const { avatar_url } = await fetchProfileImages(session.id);
        if (avatar_url) {
          setProfilePicture(avatar_url);
        }

        const profile = await fetchUserProfile(session.id);
        if (profile) {
          if (profile.course_strand) setCourseStrand(profile.course_strand);
          if (profile.year_level) setYearLevel(profile.year_level);
          if (profile.phone) setPhone(formatPhoneNumber(profile.phone));

          if (profile.date_of_birth) {
            const dobStr =
              typeof profile.date_of_birth === 'string'
                ? profile.date_of_birth.slice(0, 10)
                : new Date(profile.date_of_birth).toISOString().slice(0, 10);
            setDob(dobStr);
          }

          /* ✅ Load shipping address from profile if available */
          if ((profile as any).building) {
            setShippingBuilding((profile as any).building);
            const rooms = BUILDINGS[(profile as any).building] || [];
            setShippingRoom((profile as any).room || rooms[0] || '');
          }
          if ((profile as any).room) setShippingRoom((profile as any).room);
          if ((profile as any).shipping_notes) setShippingNotes((profile as any).shipping_notes);
        }
      } catch (error) {
        console.warn('[Settings] Failed to load profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void loadProfile();
  }, [session, navigate]);

  useEffect(() => {
    const syncLanguage = () => setLanguage(getCurrentLanguage());
    syncLanguage();
    const interval = setInterval(syncLanguage, 1000);
    return () => clearInterval(interval);
  }, []);

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

  /* ============================================
     ✅ PHONE INPUT HANDLER — numbers only + auto-format
     ============================================ */
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
  };

  const handleSaveAccount = async () => {
    /* ✅ Validate phone before saving */
    if (phone && !isValidPhone(phone)) {
      toast('Phone number must be 11 digits starting with 09 (e.g., 0917 123 4567).', 'warning');
      return;
    }

    setIsSavingAccount(true);
    try {
      await updateUserProfile(session.id, {
        course_strand: courseStrand || null,
        year_level: yearLevel || null,
        date_of_birth: dob || null,
        phone: phone ? phone.replace(/\D/g, '') : null, // ✅ Save raw digits
      });

      toast('Account details saved!', 'success');
    } catch (error) {
      console.error('[Settings] Failed to save account:', error);
      toast('Failed to save account details. Please try again.', 'danger');
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

  const handleSaveNotifications = () =>
    toast('Notification preferences updated!', 'success');

  const handleThemeChange = (newTheme: ThemeId) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    toast('Theme applied!', 'success');
  };

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    applyLanguage(langCode);
    toast('Language changed!', 'success');
  };

  const handleSavePrivacy = () =>
    toast('Privacy preferences updated!', 'success');

  const handleDeleteAccount = () => {
    if (
      !window.confirm(
        'This will permanently delete your account and data. Continue?'
      )
    )
      return;
    toast(
      'Account deletion requested — wire this up to your backend.',
      'warning'
    );
  };

  /* ============================================
     ✅ ADDRESS MODAL HANDLERS
     ============================================ */
  const openAddressModal = () => {
    setDraftBuilding(shippingBuilding);
    setDraftRoom(shippingRoom);
    setDraftNotes(shippingNotes);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    if (isSavingAddress) return;
    setIsAddressModalOpen(false);
  };

  /* ✅ Building change — auto-select first room */
  const handleDraftBuildingChange = (newBuilding: string) => {
    setDraftBuilding(newBuilding);
    const rooms = BUILDINGS[newBuilding] || [];
    setDraftRoom(rooms[0] || '');
  };

  const handleSaveAddress = async () => {
    if (!draftBuilding.trim() || !draftRoom.trim()) {
      toast('Please select a building and room.', 'warning');
      return;
    }
    setIsSavingAddress(true);
    try {
      await updateUserProfile(session.id, {
        building: draftBuilding,
        room: draftRoom,
        shipping_notes: draftNotes || null,
      } as any);

      setShippingBuilding(draftBuilding);
      setShippingRoom(draftRoom);
      setShippingNotes(draftNotes);

      toast('Shipping address updated!', 'success');
      setIsAddressModalOpen(false);
    } catch (error) {
      console.error('[Settings] Failed to save address:', error);
      toast('Failed to save address.', 'danger');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const currentThemeOption = themeOptions.find((t) => t.id === theme);
  const lightThemes = themeOptions.filter((t) => t.mode === 'light');
  const darkThemes = themeOptions.filter((t) => t.mode === 'dark');
  const availableDraftRooms = BUILDINGS[draftBuilding] || [];

  return (
    <div className="settings-shell">
      {/* SIDEBAR */}
      <aside className="settings-sidebar">
        <div className="settings-sidebar__top">
          <nav className="settings-sidebar__nav">
            {sideNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active || item.to === '/settings';
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`settings-sidebar__item ${isActive ? 'is-active' : ''}`}
                  data-label={item.label}
                >
                  <Icon className="react-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MAIN */}
      <div className="settings-main">
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
                        disabled={isSavingAccount || isLoadingProfile}
                      >
                        <Save className="react-icon" aria-hidden="true" />
                        <span>
                          {isSavingAccount ? 'Saving...' : isLoadingProfile ? 'Loading...' : 'Save Changes'}
                        </span>
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
                            disabled={isLoadingProfile}
                          >
                            <option value="">Select course / strand</option>
                            {COURSE_OPTIONS.map((course) => (
                              <option key={course.value} value={course.value}>
                                {course.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="settings-field">
                          <label className="settings-field__label">Year Level</label>
                          <select
                            className="settings-field__select"
                            value={yearLevel}
                            onChange={(e) => setYearLevel(e.target.value)}
                            disabled={isLoadingProfile}
                          >
                            <option value="">Select year level</option>
                            {YEAR_LEVELS.map((year) => (
                              <option key={year} value={year}>{year}</option>
                            ))}
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
                              disabled={isLoadingProfile}
                            />
                          </div>
                        </div>

                        {/* ============================================
                            ✅ CONTACT NUMBER — Numbers only, 11 digits max
                        ============================================ */}
                        <div className="settings-field">
                          <label className="settings-field__label">
                            Contact Number
                          </label>
                          <div className="settings-field__icon-wrap">
                            <Phone className="react-icon" aria-hidden="true" />
                            <input
                              type="tel"
                              inputMode="numeric"
                              className="settings-field__input settings-field__input--icon"
                              value={phone}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              placeholder="09XX XXX XXXX"
                              maxLength={13}  /* 11 digits + 2 spaces */
                              disabled={isLoadingProfile}
                            />
                          </div>
                          {phone && !isValidPhone(phone) && (
                            <p className="settings-field__hint settings-field__hint--error">
                              ⚠️ Phone must be 11 digits starting with 09.
                            </p>
                          )}
                          {phone && isValidPhone(phone) && (
                            <p className="settings-field__hint settings-field__hint--success">
                              ✓ Valid phone number
                            </p>
                          )}
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

                  {/* ============================================
                      ✅ SHIPPING ADDRESS — Building + Room
                  ============================================ */}
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
                          <Building2 className="react-icon" aria-hidden="true" />
                        </span>
                        <span className="settings-address__text">
                          {shippingBuilding && shippingRoom
                            ? `${shippingBuilding} — ${shippingRoom}`
                            : 'No shipping address on file yet.'}
                        </span>
                        <span className="settings-address__badge">Default</span>
                      </div>
                      {shippingNotes && (
                        <p className="settings-address__notes">
                          <strong>Notes:</strong> {shippingNotes}
                        </p>
                      )}
                    </div>
                  </section>

                  {/* LANGUAGE */}
                  <section className="settings-panel">
                    <header className="settings-panel__header">
                      <div className="settings-panel__heading">
                        <span className="settings-panel__icon">
                          <Globe className="react-icon" aria-hidden="true" />
                        </span>
                        <div>
                          <h2 className="settings-panel__title">Language &amp; Region</h2>
                          <p className="settings-panel__subtitle">
                            Set your preferred language — applies to the entire site.
                          </p>
                        </div>
                      </div>
                      <select
                        className="settings-field__select settings-field__select--inline"
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.label}
                          </option>
                        ))}
                      </select>
                    </header>
                  </section>
                </>
              )}

              {/* ============================================
                  SECURITY TAB
              ============================================ */}
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

              {/* ============================================
                  NOTIFICATIONS TAB
              ============================================ */}
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

              {/* ============================================
                  APPEARANCE TAB
              ============================================ */}
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
                            Choose from 5 light and 5 dark themes — tap to apply instantly.
                          </p>
                        </div>
                      </div>
                    </header>

                    <div className="settings-panel__body">
                      <div className="appearance-section">
                        <h3 className="appearance-section__title">☀️ Light Themes</h3>
                        <p className="appearance-section__subtitle">
                          Bright & clean — perfect for daytime use.
                        </p>

                        <div className="theme-grid">
                          {lightThemes.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              data-theme-id={option.id}
                              data-theme-mode={option.mode}
                              className={`theme-card ${theme === option.id ? 'is-active' : ''}`}
                              onClick={() => handleThemeChange(option.id)}
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
                                  {option.id === DEFAULT_THEME_ID && (
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

                      <div className="appearance-section">
                        <h3 className="appearance-section__title">🌙 Dark Themes</h3>
                        <p className="appearance-section__subtitle">
                          Easy on the eyes — perfect for nighttime use.
                        </p>

                        <div className="theme-grid">
                          {darkThemes.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              data-theme-id={option.id}
                              data-theme-mode={option.mode}
                              className={`theme-card ${theme === option.id ? 'is-active' : ''}`}
                              onClick={() => handleThemeChange(option.id)}
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
                                <span className="theme-card__label">{option.label}</span>
                                <span className="theme-card__radio" aria-hidden="true">
                                  {theme === option.id && <Check className="react-icon" />}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="appearance-current-theme">
                    <div className="appearance-current-theme__head">
                      <span className="appearance-current-theme__icon">
                        <Palette className="react-icon" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="appearance-current-theme__label">Current Theme</p>
                        <p className="appearance-current-theme__name">
                          {currentThemeOption?.label || 'Cream Yellow'}
                        </p>
                      </div>
                      <span className="appearance-current-theme__badge">
                        {currentThemeOption?.mode === 'dark' ? 'Dark' : 'Light'}
                      </span>
                    </div>
                    <div className="appearance-current-theme__preview" aria-hidden="true">
                      <span className="appearance-current-theme__dot" />
                      <span className="appearance-current-theme__dot" />
                      <span className="appearance-current-theme__dot" />
                    </div>
                  </section>
                </>
              )}

              {/* ============================================
                  PRIVACY TAB
              ============================================ */}
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

            {/* RIGHT SIDE PANEL */}
            <aside className="settings-side">
              <div className="settings-brand-card">
                <span className="settings-brand-card__logo">
                  <img src="/logo.png" alt="SJCM Store Logo" className="settings-brand-card__logo-img" />
                </span>
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

      {/* ============================================
          ✅ ADDRESS MODAL — Building + Room
      ============================================ */}
      {isAddressModalOpen && (
        <div
          className="settings-modal-overlay"
          onClick={closeAddressModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="address-modal-title"
        >
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
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
                    Update your pickup location for future orders.
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
              {/* Building */}
              <div className="settings-field">
                <label className="settings-field__label">Building</label>
                <div className="settings-field__icon-wrap">
                  <Building2 className="react-icon" aria-hidden="true" />
                  <select
                    className="settings-field__select settings-field__select--icon"
                    value={draftBuilding}
                    onChange={(e) => handleDraftBuildingChange(e.target.value)}
                  >
                    {BUILDING_NAMES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Room */}
              <div className="settings-field">
                <label className="settings-field__label">Room / Office</label>
                <div className="settings-field__icon-wrap">
                  <DoorOpen className="react-icon" aria-hidden="true" />
                  <select
                    className="settings-field__select settings-field__select--icon"
                    value={draftRoom}
                    onChange={(e) => setDraftRoom(e.target.value)}
                  >
                    {availableDraftRooms.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="settings-field">
                <label className="settings-field__label">Additional Notes (Optional)</label>
                <textarea
                  className="settings-field__input settings-field__input--textarea"
                  rows={3}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="e.g., Landmark, preferred pickup time, etc."
                />
              </div>

              {/* Preview */}
              <div className="settings-address-preview">
                <MapPin className="react-icon" aria-hidden="true" />
                <div>
                  <p className="settings-address-preview__title">Pickup Location</p>
                  <p className="settings-address-preview__text">
                    {draftBuilding} · {draftRoom}
                  </p>
                  <p className="settings-address-preview__note">
                    Monday – Friday · 8:00 AM – 4:00 PM. Bring a valid school ID.
                  </p>
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